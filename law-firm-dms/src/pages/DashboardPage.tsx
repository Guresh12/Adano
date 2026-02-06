import { useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { Briefcase, Clock, FileText, Activity, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Database } from '../lib/database.types';

type Matter = Database['public']['Tables']['matters']['Row'];
type Deadline = Database['public']['Tables']['deadlines']['Row'];
type ActivityLog = Database['public']['Tables']['activity_log']['Row'];

export default function DashboardPage() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ matters: 0, deadlines: 0, files: 0 });
    const [matters, setMatters] = useState<Matter[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.workspace_id) {
            loadDashboardData();
        } else {
            // Stop loading if no workspace is assigned
            setLoading(false);
        }
    }, [profile]);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const wsId = profile!.workspace_id!;

            // Execute parallel queries for performance
            const [
                { data: mattersData, count: mattersCount },
                { data: deadlinesData, count: deadlinesCount },
                { data: filesCount },
                { data: activityData }
            ] = await Promise.all([
                supabase.from('matters').select('*', { count: 'exact' }).eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(5),
                supabase.from('deadlines').select('*', { count: 'exact' }).eq('workspace_id', wsId).eq('is_completed', false).gte('due_date', new Date().toISOString()).order('due_date', { ascending: true }).limit(5),
                supabase.from('files').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
                supabase.from('activity_log').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(7)
            ]);

            setStats({
                matters: mattersCount || 0,
                deadlines: deadlinesCount || 0,
                files: filesCount?.count || 0, // fix for count structure
            });

            setMatters(mattersData || []);
            setDeadlines(deadlinesData || []);
            setActivity(activityData || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    async function seedDemoData() {
        if (!profile?.workspace_id) return;
        // implementation remains similar but cleaner...
        // For brevity preserving logic:
        try {
            const { data: client } = await supabase.from('clients').insert({ workspace_id: profile.workspace_id, name: 'Acme Holdings Ltd', email: 'legal@acme.test' }).select().single();
            if (!client) return;
            const { data: matter } = await supabase.from('matters').insert({ workspace_id: profile.workspace_id, client_id: client.id, reference: 'ELC-2026-014', title: 'Land dispute: Plot 209/19860', status: 'active', created_by: profile.id }).select().single();
            if (!matter) return;
            const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 7);
            await supabase.from('deadlines').insert({ workspace_id: profile.workspace_id, matter_id: matter.id, title: 'File submissions', due_date: dueDate.toISOString(), priority: 'high', created_by: profile.id });
            await logActivity('matter.create', 'Seeded demo matters', 'matter', matter.id);
            loadDashboardData();
        } catch (e) {
            console.error(e);
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!profile?.workspace_id) {
        return (
            <div className="flex flex-col h-96 items-center justify-center text-center p-6">
                <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Workspace Assigned</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    Your account is created but not assigned to a workspace. Please ask your administrator to assign you to a workspace, or if you are the admin, execute the setup SQL script.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800">
                    <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Active Matters</dt>
                    <dd className="mt-2 flex items-baseline text-3xl font-semibold text-slate-900 dark:text-white">
                        {stats.matters}
                        <Briefcase className="ml-auto h-6 w-6 text-indigo-500 opacity-50" />
                    </dd>
                </div>
                <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800">
                    <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming Deadlines</dt>
                    <dd className="mt-2 flex items-baseline text-3xl font-semibold text-slate-900 dark:text-white">
                        {stats.deadlines}
                        <Clock className="ml-auto h-6 w-6 text-amber-500 opacity-50" />
                    </dd>
                </div>
                <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800">
                    <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Documents</dt>
                    <dd className="mt-2 flex items-baseline text-3xl font-semibold text-slate-900 dark:text-white">
                        {stats.files}
                        <FileText className="ml-auto h-6 w-6 text-emerald-500 opacity-50" />
                    </dd>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
                {/* Main Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Matters */}
                    <div className="rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                            <h2 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">Recent Matters</h2>
                            <Link to="/matters" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                View All
                            </Link>
                        </div>
                        <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-800">
                            {matters.length === 0 ? (
                                <li className="px-6 py-8 text-center text-sm text-slate-500">
                                    No matters found. <button onClick={seedDemoData} className="text-indigo-600 hover:underline">Create one?</button>
                                </li>
                            ) : (
                                matters.map((matter) => (
                                    <li key={matter.id} className="relative flex justify-between gap-x-6 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex min-w-0 gap-x-4">
                                            <div className="min-w-0 flex-auto">
                                                <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                                    {matter.reference}
                                                </p>
                                                <p className="mt-1 flex text-xs leading-5 text-slate-500">
                                                    {matter.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-x-4">
                                            <div className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${matter.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                matter.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                                                    'bg-slate-50 text-slate-600 ring-slate-500/10'
                                                }`}>
                                                {matter.status}
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800">
                        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                            <h2 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">Activity Log</h2>
                        </div>
                        <div className="flow-root p-6">
                            <ul role="list" className="-mb-8">
                                {activity.map((item, itemIdx) => (
                                    <li key={item.id}>
                                        <div className="relative pb-8">
                                            {itemIdx !== activity.length - 1 ? (
                                                <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20 ring-8 ring-white dark:ring-slate-900">
                                                    <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                                                </div>
                                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                    <div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    <div className="whitespace-nowrap text-right text-sm text-slate-500">
                                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {activity.length === 0 && <div className="text-center text-sm text-slate-500">No recent activity.</div>}
                        </div>
                    </div>
                </div>

                {/* Right Column (Deadlines) */}
                <div className="space-y-6">
                    <div className="rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800">
                        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">Upcoming Deadlines</h2>
                            <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-400/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10">
                                {deadlines.length} due
                            </span>
                        </div>
                        <div className="p-6">
                            {deadlines.length > 0 ? (
                                <ul className="space-y-4">
                                    {deadlines.map((deadline) => (
                                        <li key={deadline.id} className="relative flex gap-x-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex-auto">
                                                <div className="flex items-baseline justify-between gap-x-4">
                                                    <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                                                        {deadline.title}
                                                    </p>
                                                    <p className={`flex-none text-xs ${deadline.priority === 'high' ? 'text-red-600 font-bold' : 'text-slate-500'
                                                        }`}>
                                                        {new Date(deadline.due_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {format(new Date(deadline.due_date), 'MMM d, yyyy h:mm a')}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6">
                                    <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                    <p className="mt-2 text-sm text-slate-500">No upcoming deadlines</p>
                                </div>
                            )}
                            <Link to="/calendar" className="mt-6 flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                Go to Calendar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
