import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Monitor, User, Shield, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
    const { profile } = useAuth();
    const [theme, setTheme] = useState<'dark' | 'light'>('light');

    useEffect(() => {
        // Default to 'light' if not set
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    function handleThemeChange(newTheme: 'dark' | 'light') {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800 rounded-xl overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-indigo-500" />
                        Appearance
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">Customize the interface theme.</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'
                                }`}
                        >
                            <Sun className="h-6 w-6" />
                            <span className="text-sm font-medium">Light Mode</span>
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'
                                }`}
                        >
                            <Moon className="h-6 w-6" />
                            <span className="text-sm font-medium">Dark Mode</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800 rounded-xl overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-500" />
                        Profile
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Full Name</label>
                        <input
                            type="text"
                            disabled
                            value={profile?.full_name || ''}
                            className="mt-2 block w-full rounded-md border-0 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Email Address</label>
                        <input
                            type="text"
                            disabled
                            value={profile?.email || ''}
                            className="mt-2 block w-full rounded-md border-0 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-800 rounded-xl overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        Security & System
                    </h3>
                </div>
                <div className="p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">User Role</dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white capitalize">{profile?.role || 'User'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Workspace ID</dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white font-mono">{profile?.workspace_id || 'Not Assigned'}</dd>
                        </div>
                    </dl>
                    <div className="mt-6 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-900/50">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Shield className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Secure Environment</h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                                    <p>
                                        This system enforces Row Level Security (RLS). You can only access data belonging to your assigned workspace.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
