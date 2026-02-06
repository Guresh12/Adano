import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Search,
    HelpCircle,
    Bell,
    Menu,
    X
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    async function handleLogout() {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Matters', href: '/matters', icon: Briefcase },
        { name: 'Clients', href: '/clients', icon: Users },
        { name: 'Documents', href: '/files', icon: FileText },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white mr-3">
                            LP
                        </div>
                        <span className="text-lg font-bold tracking-tight">LegalPractice</span>
                        <button
                            className="ml-auto lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                        {navigation.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                                        ${active
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon className={`
                                        mr-3 h-5 w-5 flex-shrink-0 transition-colors
                                        ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}
                                    `} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-slate-800 bg-slate-950">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-medium">
                                {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {profile?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1 flex justify-between items-center ml-4 lg:ml-0">
                        <div className="flex items-center max-w-md w-full">
                            <div className="relative w-full text-slate-500 focus-within:text-indigo-600">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-lg leading-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                    placeholder="Search matters, clients, cases..."
                                />
                            </div>
                        </div>

                        <div className="ml-4 flex items-center md:ml-6 gap-4">
                            <button className="p-1 rounded-full text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none">
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-5 w-5" />
                            </button>
                            <button className="p-1 rounded-full text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none">
                                <span className="sr-only">Help</span>
                                <HelpCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {navigation.find(n => isActive(n.href))?.name || 'Dashboard'}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {getPageDescription(location.pathname)}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

function getPageDescription(path: string): string {
    switch (path) {
        case '/': return 'Overview of your legal practice';
        case '/matters': return 'Manage cases and legal matters';
        case '/clients': return 'Directory of all clients';
        case '/files': return 'Document management system';
        case '/calendar': return 'Upcoming hearings and deadlines';
        case '/settings': return 'System preferences and configuration';
        default: return '';
    }
}
