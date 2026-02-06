import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Mail, Phone, Plus, Search } from 'lucide-react';
import Modal from '../components/Modal';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

export default function ClientsPage() {
    const { profile } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', company: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (profile?.workspace_id) {
            fetchClients();
        }
    }, [profile]);

    async function fetchClients() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('workspace_id', profile!.workspace_id!)
                .order('name', { ascending: true });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateClient(e: React.FormEvent) {
        e.preventDefault();
        if (!profile?.workspace_id) return;

        try {
            setSubmitting(true);
            const { data, error } = await supabase
                .from('clients')
                .insert({
                    workspace_id: profile.workspace_id,
                    name: newClient.name,
                    email: newClient.email || null,
                    phone: newClient.phone || null,
                    company: newClient.company || null
                })
                .select()
                .single();

            if (error) throw error;

            await logActivity('client.create', `Added new client: ${newClient.name}`, 'client', data.id);

            setClients([...clients, data]);
            setIsModalOpen(false);
            setNewClient({ name: '', email: '', phone: '', company: '' });
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Failed to create client');
        } finally {
            setSubmitting(false);
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">Clients</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage your client database and contact information.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Plus className="inline-block -ml-1 mr-1 h-4 w-4" />
                        Add Client
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-950 dark:ring-slate-800 dark:text-white"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Users className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No clients found</h3>
                    <p className="mt-1 text-sm text-slate-500">Add a new client to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="relative flex items-center space-x-3 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-slate-400 dark:hover:border-slate-700 transition-colors">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {client.name.charAt(0)}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <a href="#" className="focus:outline-none">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</p>
                                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{client.company || 'Individual'}</p>
                                </a>
                            </div>
                            <div className="flex flex-col gap-1 text-slate-400">
                                {client.email && <Mail className="h-4 w-4" />}
                                {client.phone && <Phone className="h-4 w-4" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Client"
            >
                <form onSubmit={handleCreateClient} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                        <input
                            type="text"
                            required
                            value={newClient.name}
                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company (Optional)</label>
                        <input
                            type="text"
                            value={newClient.company}
                            onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email (Optional)</label>
                        <input
                            type="email"
                            value={newClient.email}
                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone (Optional)</label>
                        <input
                            type="tel"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Client'}
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
