import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Upload, Search } from 'lucide-react';
import type { Database } from '../lib/database.types';

type File = Database['public']['Tables']['files']['Row'];

export default function FilesPage() {
    const { profile } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (profile?.workspace_id) {
            fetchFiles();
        }
    }, [profile]);

    async function fetchFiles() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('files')
                .select('*')
                .eq('workspace_id', profile!.workspace_id!)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(false);
        }
    }

    // Mock upload function
    const handleUpload = () => {
        alert('File upload would open the native file picker here and upload to Supabase Storage.');
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">Documents</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Securely stored files related to matters and clients.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={handleUpload}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Upload className="inline-block -ml-1 mr-1 h-4 w-4" />
                        Upload File
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-950 dark:ring-slate-800 dark:text-white"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* File Grid/List */}
            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No files stored</h3>
                        <p className="mt-1 text-sm text-slate-500">Upload a document to get started.</p>
                    </div>
                ) : (
                    <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredFiles.map((file) => (
                            <li key={file.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex min-w-0 gap-x-4">
                                    <div className="h-12 w-12 flex-none rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700">
                                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">{file.name}</p>
                                        <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                                            {formatBytes(file.size_bytes || 0)} • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-none items-center gap-x-4">
                                    <a
                                        href="#"
                                        className="rounded-md bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        Download
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
