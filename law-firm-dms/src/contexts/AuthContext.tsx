import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const hasAuth = !!supabase?.auth;

    useEffect(() => {
        if (!hasAuth) {
            setLoading(false);
            return;
        }

        // Initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange(async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    // Small delay to ensure triggers have fired
                    await new Promise(resolve => setTimeout(resolve, 500));
                    loadProfile(session.user.id);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            });

        return () => subscription.unsubscribe();
    }, [hasAuth]);

    async function loadProfile(userId: string) {
        try {
            if (!hasAuth) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            setProfile(data);
        } catch (error) {
            console.error('CRITICAL: Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    }

    async function refreshProfile() {
        if (user) await loadProfile(user.id);
    }

    async function signIn(email: string, password: string) {
        if (!hasAuth) {
            // Demo Login
            const mockUser = {
                id: 'demo-user-id',
                email: email,
                app_metadata: {},
                user_metadata: { full_name: 'Demo Admin' },
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as User;

            const mockProfile = {
                id: 'demo-user-id',
                email: email,
                full_name: 'Demo Admin',
                role: 'admin',
                workspace_id: 'demo-workspace',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: {}
            } as Profile;

            setUser(mockUser);
            setProfile(mockProfile);
            setSession({ user: mockUser, access_token: 'fake', refresh_token: 'fake' } as Session);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Refresh profile immediately to get up-to-date workspace_id
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await loadProfile(user.id);
        }
    }

    async function signUp(email: string, password: string, fullName: string) {
        if (!hasAuth) {
            alert("Sign up simulation not supported in demo mode. Please use 'Sign In'.");
            return;
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;
    }

    async function signOut() {
        if (!hasAuth) {
            setUser(null);
            setProfile(null);
            setSession(null);
            return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    const value = {
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
