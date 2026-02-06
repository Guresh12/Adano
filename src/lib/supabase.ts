import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we are using real credentials or placeholders
const isRealConnection = supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project');

export const supabase =
    isRealConnection
        ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            },
        })
        : ({} as any);

// Helper function to log activity
export async function logActivity(
    activityType: Database['public']['Enums']['activity_type'],
    description: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, any>
) {
    try {
        const { data: { user } } = await supabase.auth?.getUser?.();
        if (!user) return;

        const { data: profile } = await supabase
            .from?.('profiles')
            .select?.('workspace_id')
            .eq?.('id', user.id)
            .single?.();

        if (!profile) return;

        await supabase.from?.('activity_log').insert?.({
            workspace_id: profile.workspace_id,
            user_id: user.id,
            activity_type: activityType,
            entity_type: entityType,
            entity_id: entityId,
            description,
            metadata: metadata || {},
        });
    } catch {
        // ignore when Supabase is not available
    }
}

// Helper to get current user's workspace
export async function getCurrentWorkspace() {
    try {
        const { data: { user } } = await supabase.auth?.getUser?.();
        if (!user) return null;

        const { data: profile } = await supabase
            .from?.('profiles')
            .select?.('workspace_id, workspaces(*)')
            .eq?.('id', user.id)
            .single?.();

        return profile?.workspaces || null;
    } catch {
        return null;
    }
}

// Helper to check user role
export async function getUserRole(): Promise<Database['public']['Enums']['user_role'] | null> {
    try {
        const { data: { user } } = await supabase.auth?.getUser?.();
        if (!user) return null;

        const { data: profile } = await supabase
            .from?.('profiles')
            .select?.('role')
            .eq?.('id', user.id)
            .single?.();

        return profile?.role || null;
    } catch {
        return null;
    }
}
