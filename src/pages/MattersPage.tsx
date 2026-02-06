import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, MoreVertical, Briefcase } from 'lucide-react';
import Modal from '../components/Modal';
import type { Database } from '../lib/database.types';

type Matter = Database['public']['Tables']['matters']['Row'] & {
    clients: { name: string } | null;
};

export default function MattersPage() {
    const { profile } = useAuth();
    // Main data state
    const [matters, setMatters] = useState<Matter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Create Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
    const [newMatter, setNewMatter] = useState({ title: '', reference: '', client_id: '', status: 'active' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (profile?.workspace_id) {
            fetchMatters();
            fetchClients();
        }
    }, [profile]);

    async function fetchMatters() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('matters')
                .select('*, clients(name)')
                .eq('workspace_id', profile!.workspace_id!)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMatters(data || []);
        } catch (error) {
            console.error('Error fetching matters:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchClients() {
        try {
            const { data } = await supabase
                .from('clients')
                .select('id, name')
                .eq('workspace_id', profile!.workspace_id!)
                .order('name');
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients for dropdown:', error);
        }
    }

    async function handleCreateMatter(e: React.FormEvent) {
        e.preventDefault();
        if (!profile?.workspace_id) return;

        try {
            setSubmitting(true);
            const { data, error } = await supabase
                .from('matters')
                .insert({
                    workspace_id: profile.workspace_id,
                    title: newMatter.title,
                    reference: newMatter.reference,
                    client_id: newMatter.client_id,
                    status: newMatter.status as any,
                    created_by: profile.id
                })
                .select('*, clients(name)')
                .single();

            if (error) throw error;

            await logActivity('matter.create', `Opened new matter: ${newMatter.reference}`, 'matter', data.id);

            setMatters([data, ...matters]);
            setIsModalOpen(false);
            setNewMatter({ title: '', reference: '', client_id: '', status: 'active' });
        } catch (error) {
            console.error('Error creating matter:', error);
            alert('Failed to create matter');
        } finally {
            setSubmitting(false);
        }
    }

    const filteredMatters = matters.filter(matter => {
        const matchesSearch =
            matter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            matter.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            matter.clients?.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || matter.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">All Matters</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        A list of all legal cases and matters including their status and client details.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Plus className="inline-block -ml-1 mr-1 h-4 w-4" />
                        New Matter
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-950 dark:ring-slate-800 dark:text-white"
                        placeholder="Search matters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-950 dark:ring-slate-800 dark:text-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : filteredMatters.length === 0 ? (
                    <div className="text-center py-12">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No matters found</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new matter.</p>
                        <div className="mt-6">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                New Matter
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-white sm:pl-6">Reference</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Title</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Client</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Created</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {filteredMatters.map((matter) => (
                                <tr key={matter.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => console.log('View matter', matter.id)}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 sm:pl-6">
                                        {matter.reference}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-slate-300">
                                        {matter.title}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {matter.clients?.name || 'Unknown'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${matter.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                            matter.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                                                'bg-slate-50 text-slate-600 ring-slate-500/10'
                                            }`}>
                                            {matter.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(matter.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <button className="text-slate-400 hover:text-indigo-600">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Matter"
            >
                <form onSubmit={handleCreateMatter} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reference Number</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. CAS-2023-001"
                            value={newMatter.reference}
                            onChange={(e) => setNewMatter({ ...newMatter, reference: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title / Description</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Estate Planning for John Doe"
                            value={newMatter.title}
                            onChange={(e) => setNewMatter({ ...newMatter, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Client</label>
                        <select
                            required
                            value={newMatter.client_id}
                            onChange={(e) => setNewMatter({ ...newMatter, client_id: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        >
                            <option value="">Select a Client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                        {clients.length === 0 && (
                            <p className="mt-1 text-xs text-amber-500">No clients found. Please add a client first.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                        <select
                            value={newMatter.status}
                            onChange={(e) => setNewMatter({ ...newMatter, status: e.target.value })}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-700 dark:text-white"
                        >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="closed">Closed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Matter'}
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
