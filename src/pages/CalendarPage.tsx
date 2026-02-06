import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import type { Database } from '../lib/database.types';

type Deadline = Database['public']['Tables']['deadlines']['Row'];

export default function CalendarPage() {
    const { profile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', due_date: '', description: '', priority: 'medium' });
    const [submitting, setSubmitting] = useState(false);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    async function syncWithGoogle() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    scopes: 'https://www.googleapis.com/auth/calendar.events',
                    redirectTo: window.location.origin + '/calendar'
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error connecting to Google:', error);
            alert('Failed to connect to Google');
        }
    }

    async function pushToGoogle(deadline: Deadline) {
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.provider_token;

            if (!token) {
                alert('Please connect to Google first');
                return;
            }

            const event = {
                summary: deadline.title,
                description: deadline.description || '',
                start: {
                    dateTime: deadline.due_date,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: new Date(new Date(deadline.due_date).getTime() + 60 * 60 * 1000).toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) throw new Error('Failed to push to Google');

            alert('Event synced to Google Calendar!');
        } catch (error) {
            console.error('Push to Google error:', error);
            alert('Sync failed. You might need to reconnect Google.');
        }
    }

    useEffect(() => {
        if (profile?.workspace_id) {
            fetchDeadlines();
        }
    }, [profile, currentDate]); // Refetch when month changes ideally, but fetching all for now is simpler for a small app

    async function fetchDeadlines() {
        try {
            // Fetch deadlines for current month window +/- some buffer could be better optimization
            const { data } = await supabase
                .from('deadlines')
                .select('*')
                .eq('workspace_id', profile!.workspace_id!);
            setDeadlines(data || []);
        } catch (error) {
            console.error('Error fetching deadlines:', error);
        }
    }

    async function handleCreateEvent(e: React.FormEvent) {
        e.preventDefault();
        if (!profile?.workspace_id) return;

        try {
            setSubmitting(true);
            const { data, error } = await supabase
                .from('deadlines')
                .insert({
                    workspace_id: profile.workspace_id,
                    title: newEvent.title,
                    description: newEvent.description,
                    due_date: newEvent.due_date, // Setup form to provide full ISO string or handle it
                    priority: newEvent.priority as any,
                    created_by: profile.id
                })
                .select()
                .single();

            if (error) throw error;

            await logActivity('deadline.create', `Set new deadline: ${newEvent.title}`, 'deadline', data.id);

            // Optional: Automaticaly push to google if connected
            const session = await supabase.auth.getSession();
            if (session.data.session?.provider_token) {
                pushToGoogle(data);
            }

            setDeadlines([...deadlines, data]);
            setIsModalOpen(false);
            setNewEvent({ title: '', due_date: '', description: '', priority: 'medium' });
        } catch (error) {
            console.error('Error creating deadline:', error);
            alert('Failed to create event');
        } finally {
            setSubmitting(false);
        }
    }

    function openNewEventModal(date?: Date) {
        const dateStr = date ? format(date, "yyyy-MM-dd'T'09:00") : '';
        setNewEvent({ ...newEvent, due_date: dateStr });
        setIsModalOpen(true);
    }

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    // Padding for start of month
    const startPadding = Array(startOfMonth(currentDate).getDay()).fill(null);

    const eventsForDay = (date: Date) => {
        return deadlines.filter(d => isSameDay(parseISO(d.due_date), date));
    };

    return (
        <div className="lg:flex lg:h-[calc(100vh-140px)] lg:flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 rounded-t-xl">
                <h2 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={syncWithGoogle}
                        className="hidden lg:inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-300 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="w-4 h-4 mr-2" alt="Google Calendar" />
                        Connect Google
                    </button>
                    <button
                        onClick={() => openNewEventModal(new Date())}
                        className="hidden sm:inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Event
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={today} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Today</button>
                        <div className="flex items-center rounded-md bg-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700">
                            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-md">
                                <ChevronLeft className="h-5 w-5 text-slate-400" />
                            </button>
                            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-r-md">
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="shadow ring-1 ring-slate-900/5 dark:ring-slate-800 lg:flex lg:flex-auto lg:flex-col rounded-b-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="grid grid-cols-7 gap-px border-b border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 text-center text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300 lg:flex-none">
                    <div className="py-2 bg-white dark:bg-slate-900">Sun</div>
                    <div className="py-2 bg-white dark:bg-slate-900">Mon</div>
                    <div className="py-2 bg-white dark:bg-slate-900">Tue</div>
                    <div className="py-2 bg-white dark:bg-slate-900">Wed</div>
                    <div className="py-2 bg-white dark:bg-slate-900">Thu</div>
                    <div className="py-2 bg-white dark:bg-slate-900">Fri</div>
                    <div className="py-2 bg-white dark:bg-slate-900">Sat</div>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-800 text-xs leading-6 text-slate-700 dark:text-slate-200 lg:flex-auto">
                    <div className="hidden w-full lg:grid lg:grid-cols-7 lg:gap-px">
                        {startPadding.map((_: null, i: number) => (
                            <div key={`pad-${i}`} className="bg-slate-50 dark:bg-slate-950/50 px-3 py-2 min-h-[120px]" />
                        ))}
                        {days.map((day: Date) => (
                            <div
                                key={day.toISOString()}
                                className={`relative px-3 py-2 min-h-[120px] ${isSameMonth(day, currentDate) ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-950'} ${isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''} cursor-pointer group`}
                                onClick={() => openNewEventModal(day)}
                            >
                                <time dateTime={format(day, 'yyyy-MM-dd')} className={isToday(day) ? 'flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white' : undefined}>
                                    {format(day, 'd')}
                                </time>

                                <div className="mt-2 space-y-1">
                                    {eventsForDay(day).map(event => (
                                        <div key={event.id} className={`flex items-center justify-between rounded-md px-2 py-1 text-xs font-medium cursor-pointer ${event.priority === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                            event.priority === 'medium' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                            <span className="truncate">{event.title}</span>
                                        </div>
                                    ))}
                                    {/* Ghost button for adding on hover */}
                                    <button className="hidden group-hover:block w-full text-center text-slate-400 hover:text-indigo-600 text-[10px] mt-2">
                                        + Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Event"
            >
                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Event Title</label>
                        <input
                            type="text"
                            required
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <textarea
                            rows={3}
                            value={newEvent.description || ''}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={newEvent.due_date}
                            onChange={(e) => setNewEvent({ ...newEvent, due_date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                        <select
                            value={newEvent.priority}
                            onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Event'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-300 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 sm:col-start-1 sm:mt-0"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
