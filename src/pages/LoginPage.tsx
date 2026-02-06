import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password, fullName);
                setError('Check your email for confirmation link!');
            } else {
                await signIn(email, password);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-[1000px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">

                {/* Marketing Side */}
                <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20" />
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                LP
                            </div>
                            <span className="text-xl font-bold tracking-tight">LegalPractice</span>
                        </div>

                        <h2 className="text-3xl font-bold leading-tight mb-6">
                            Manage your legal practice with confidence.
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8">
                            A production-ready document management system built for scalability, security, and efficiency.
                        </p>

                        <div className="space-y-4">
                            {[
                                'Secure encrypted storage',
                                'Client portal & messaging',
                                'Role-based access control',
                                'Case & deadline management'
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 text-sm text-slate-500">
                        © 2026 LegalPractice Inc. All rights reserved.
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isSignUp ? 'Create an account' : 'Welcome back'}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {isSignUp
                                    ? 'Enter your details to get started with your 14-day free trial.'
                                    : 'Please enter your details to sign in.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isSignUp && (
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800"
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className={`rounded-md p-4 text-sm ${error.includes('Check') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {error}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            {isSignUp ? 'Create account' : 'Sign in'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError('');
                                    }}
                                    className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
                                >
                                    {isSignUp ? 'Sign in' : 'Sign up'}
                                </button>
                            </p>

                            {!isSignUp && (
                                <div className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
                                            <strong>Demo Mode:</strong> If Supabase is disconnected, any email/password will work for testing the UI.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
