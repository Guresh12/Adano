-- =============================================
-- LAW FIRM DMS - SUPABASE DATABASE SCHEMA
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'staff', 'client');
CREATE TYPE matter_status AS ENUM ('active', 'pending', 'closed', 'archived');
CREATE TYPE file_category AS ENUM ('pleadings', 'evidence', 'client_communication', 'research', 'internal', 'contracts', 'correspondence');
CREATE TYPE activity_type AS ENUM ('matter.create', 'matter.update', 'matter.close', 'file.upload', 'file.download', 'file.delete', 'deadline.create', 'deadline.update', 'message.send', 'user.invite');

-- =============================================
-- WORKSPACES (Multi-tenant)
-- =============================================

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- PROFILES (Extended user data)
-- =============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role DEFAULT 'client',
    avatar_url TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(workspace_id, email)
);

-- =============================================
-- CLIENTS
-- =============================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(workspace_id, email)
);

-- =============================================
-- MATTERS
-- =============================================

CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    reference VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status matter_status DEFAULT 'active',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(workspace_id, reference)
);

-- Index for faster queries
CREATE INDEX idx_matters_workspace ON matters(workspace_id);
CREATE INDEX idx_matters_client ON matters(client_id);
CREATE INDEX idx_matters_status ON matters(status);

-- =============================================
-- DEADLINES
-- =============================================

CREATE TABLE deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deadlines_matter ON deadlines(matter_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX idx_deadlines_workspace ON deadlines(workspace_id);

-- =============================================
-- FILES (Metadata only, actual files in Supabase Storage)
-- =============================================

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    category file_category DEFAULT 'internal',
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    is_client_visible BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_matter ON files(matter_id);
CREATE INDEX idx_files_workspace ON files(workspace_id);
CREATE INDEX idx_files_category ON files(category);

-- =============================================
-- MESSAGES (Client Portal Communication)
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_matter ON messages(matter_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

-- =============================================
-- ACTIVITY LOG (Audit Trail)
-- =============================================

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    activity_type activity_type NOT NULL,
    entity_type VARCHAR(50), -- 'matter', 'file', 'deadline', etc.
    entity_id UUID,
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_workspace ON activity_log(workspace_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_type ON activity_log(activity_type);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their workspace"
    ON profiles FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles WHERE id = auth.uid()
        )
    );

-- =============================================
-- WORKSPACES POLICIES
-- =============================================

CREATE POLICY "Users can view their workspace"
    ON workspaces FOR SELECT
    USING (
        id IN (
            SELECT workspace_id FROM profiles WHERE id = auth.uid()
        )
    );

-- =============================================
-- CLIENTS POLICIES
-- =============================================

CREATE POLICY "Staff can view all clients in workspace"
    ON clients FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Clients can view their own record"
    ON clients FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Staff can insert clients"
    ON clients FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can update clients"
    ON clients FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- MATTERS POLICIES
-- =============================================

CREATE POLICY "Staff can view all matters in workspace"
    ON matters FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Clients can view their own matters"
    ON matters FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can insert matters"
    ON matters FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can update matters"
    ON matters FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- DEADLINES POLICIES
-- =============================================

CREATE POLICY "Staff can view all deadlines in workspace"
    ON deadlines FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Clients can view deadlines for their matters"
    ON deadlines FOR SELECT
    USING (
        matter_id IN (
            SELECT m.id FROM matters m
            JOIN clients c ON m.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage deadlines"
    ON deadlines FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- FILES POLICIES
-- =============================================

CREATE POLICY "Staff can view all files in workspace"
    ON files FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Clients can view files marked as client-visible"
    ON files FOR SELECT
    USING (
        is_client_visible = true AND
        matter_id IN (
            SELECT m.id FROM matters m
            JOIN clients c ON m.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage files"
    ON files FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- MESSAGES POLICIES
-- =============================================

CREATE POLICY "Users can view messages they sent or received"
    ON messages FOR SELECT
    USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages (mark as read)"
    ON messages FOR UPDATE
    USING (recipient_id = auth.uid());

-- =============================================
-- ACTIVITY LOG POLICIES
-- =============================================

CREATE POLICY "Staff can view activity in their workspace"
    ON activity_log FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "System can insert activity"
    ON activity_log FOR INSERT
    WITH CHECK (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STORAGE BUCKETS (Run this in Supabase Dashboard)
-- =============================================

-- Create storage bucket for files
-- INSERT INTO storage.buckets (id, name, public) VALUES ('matter-files', 'matter-files', false);

-- Storage policies (apply in Supabase Dashboard)
-- CREATE POLICY "Staff can upload files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'matter-files' AND
--     auth.uid() IN (
--         SELECT id FROM profiles WHERE role IN ('admin', 'staff')
--     )
-- );

-- CREATE POLICY "Staff can view all files"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'matter-files' AND
--     auth.uid() IN (
--         SELECT id FROM profiles WHERE role IN ('admin', 'staff')
--     )
-- );

-- CREATE POLICY "Clients can view their files"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'matter-files' AND
--     -- Add logic to check if file belongs to client's matter
--     true
-- );
