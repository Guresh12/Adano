-- =============================================
-- LAW FIRM DMS - USEFUL SQL QUERIES
-- Quick reference for common database operations
-- =============================================

-- =============================================
-- WORKSPACE SETUP
-- =============================================

-- Create a new workspace
INSERT INTO workspaces (name, slug, is_active)
VALUES ('My Law Firm', 'my-law-firm', true)
RETURNING id;

-- View all workspaces
SELECT * FROM workspaces ORDER BY created_at DESC;

-- =============================================
-- USER MANAGEMENT
-- =============================================

-- Assign user to workspace and set role
UPDATE profiles
SET 
    workspace_id = 'YOUR_WORKSPACE_ID',
    role = 'admin',  -- or 'staff' or 'client'
    full_name = 'User Name'
WHERE email = 'user@example.com';

-- View all users in a workspace
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY created_at DESC;

-- Change user role
UPDATE profiles
SET role = 'staff'
WHERE email = 'user@example.com';

-- =============================================
-- CLIENT MANAGEMENT
-- =============================================

-- Create a new client
INSERT INTO clients (workspace_id, name, email, company, phone, address)
VALUES (
    'YOUR_WORKSPACE_ID',
    'Acme Holdings Ltd',
    'legal@acme.test',
    'Acme Corporation',
    '+1-555-0123',
    '123 Business St, City, State 12345'
)
RETURNING id;

-- View all clients
SELECT * FROM clients
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY created_at DESC;

-- Link client to a user account
UPDATE clients
SET user_id = 'USER_ID'
WHERE id = 'CLIENT_ID';

-- =============================================
-- MATTER MANAGEMENT
-- =============================================

-- Create a new matter
INSERT INTO matters (
    workspace_id,
    client_id,
    reference,
    title,
    description,
    status,
    assigned_to,
    created_by
)
VALUES (
    'YOUR_WORKSPACE_ID',
    'CLIENT_ID',
    'ELC-2026-001',
    'Land Dispute - Plot 209/19860',
    'Client disputes ownership of Plot 209/19860 in Nairobi County',
    'active',
    'STAFF_USER_ID',
    'ADMIN_USER_ID'
)
RETURNING id;

-- View all matters
SELECT 
    m.id,
    m.reference,
    m.title,
    m.status,
    c.name as client_name,
    p.full_name as assigned_to_name,
    m.opened_at
FROM matters m
LEFT JOIN clients c ON m.client_id = c.id
LEFT JOIN profiles p ON m.assigned_to = p.id
WHERE m.workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY m.created_at DESC;

-- View matters by status
SELECT status, COUNT(*) as count
FROM matters
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY status;

-- Close a matter
UPDATE matters
SET 
    status = 'closed',
    closed_at = NOW()
WHERE id = 'MATTER_ID';

-- =============================================
-- DEADLINE MANAGEMENT
-- =============================================

-- Create a deadline
INSERT INTO deadlines (
    workspace_id,
    matter_id,
    title,
    description,
    due_date,
    priority,
    assigned_to,
    created_by
)
VALUES (
    'YOUR_WORKSPACE_ID',
    'MATTER_ID',
    'File court submissions',
    'Submit all required documents to court registry',
    '2026-02-10 09:00:00+00',
    'high',
    'STAFF_USER_ID',
    'ADMIN_USER_ID'
)
RETURNING id;

-- View upcoming deadlines (next 30 days)
SELECT 
    d.title,
    d.due_date,
    d.priority,
    m.reference as matter_ref,
    m.title as matter_title,
    p.full_name as assigned_to
FROM deadlines d
LEFT JOIN matters m ON d.matter_id = m.id
LEFT JOIN profiles p ON d.assigned_to = p.id
WHERE d.workspace_id = 'YOUR_WORKSPACE_ID'
    AND d.is_completed = false
    AND d.due_date >= NOW()
    AND d.due_date <= NOW() + INTERVAL '30 days'
ORDER BY d.due_date ASC;

-- Mark deadline as complete
UPDATE deadlines
SET 
    is_completed = true,
    completed_at = NOW()
WHERE id = 'DEADLINE_ID';

-- =============================================
-- FILE MANAGEMENT
-- =============================================

-- Create file metadata (after uploading to Storage)
INSERT INTO files (
    workspace_id,
    matter_id,
    name,
    category,
    mime_type,
    size_bytes,
    storage_path,
    uploaded_by,
    is_client_visible
)
VALUES (
    'YOUR_WORKSPACE_ID',
    'MATTER_ID',
    'Plaint.pdf',
    'pleadings',
    'application/pdf',
    1048576,
    'workspace-id/matter-id/plaint.pdf',
    'USER_ID',
    false
)
RETURNING id;

-- View all files for a matter
SELECT 
    f.name,
    f.category,
    f.size_bytes,
    f.uploaded_at,
    p.full_name as uploaded_by_name,
    f.is_client_visible
FROM files f
LEFT JOIN profiles p ON f.uploaded_by = p.id
WHERE f.matter_id = 'MATTER_ID'
ORDER BY f.uploaded_at DESC;

-- Make file visible to client
UPDATE files
SET is_client_visible = true
WHERE id = 'FILE_ID';

-- =============================================
-- MESSAGING
-- =============================================

-- Send a message
INSERT INTO messages (
    workspace_id,
    matter_id,
    sender_id,
    recipient_id,
    subject,
    body
)
VALUES (
    'YOUR_WORKSPACE_ID',
    'MATTER_ID',
    'SENDER_USER_ID',
    'RECIPIENT_USER_ID',
    'Update on case progress',
    'Dear client, we have filed the necessary documents...'
)
RETURNING id;

-- View message thread for a matter
SELECT 
    m.subject,
    m.body,
    m.created_at,
    sender.full_name as sender_name,
    sender.role as sender_role,
    m.is_read
FROM messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
WHERE m.matter_id = 'MATTER_ID'
ORDER BY m.created_at ASC;

-- Mark message as read
UPDATE messages
SET 
    is_read = true,
    read_at = NOW()
WHERE id = 'MESSAGE_ID';

-- =============================================
-- ACTIVITY LOG & REPORTS
-- =============================================

-- View recent activity
SELECT 
    a.description,
    a.activity_type,
    a.created_at,
    p.full_name as user_name,
    p.role as user_role
FROM activity_log a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY a.created_at DESC
LIMIT 50;

-- Activity by user
SELECT 
    p.full_name,
    p.email,
    COUNT(*) as action_count,
    MAX(a.created_at) as last_activity
FROM activity_log a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY p.id, p.full_name, p.email
ORDER BY action_count DESC;

-- Activity by type
SELECT 
    activity_type,
    COUNT(*) as count
FROM activity_log
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY activity_type
ORDER BY count DESC;

-- =============================================
-- STATISTICS & ANALYTICS
-- =============================================

-- Dashboard statistics
SELECT 
    (SELECT COUNT(*) FROM matters WHERE workspace_id = 'YOUR_WORKSPACE_ID') as total_matters,
    (SELECT COUNT(*) FROM matters WHERE workspace_id = 'YOUR_WORKSPACE_ID' AND status = 'active') as active_matters,
    (SELECT COUNT(*) FROM files WHERE workspace_id = 'YOUR_WORKSPACE_ID') as total_files,
    (SELECT COUNT(*) FROM clients WHERE workspace_id = 'YOUR_WORKSPACE_ID') as total_clients,
    (SELECT COUNT(*) FROM deadlines WHERE workspace_id = 'YOUR_WORKSPACE_ID' AND is_completed = false AND due_date >= NOW()) as upcoming_deadlines;

-- Matters opened per month (last 6 months)
SELECT 
    DATE_TRUNC('month', opened_at) as month,
    COUNT(*) as matters_opened
FROM matters
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
    AND opened_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', opened_at)
ORDER BY month DESC;

-- Top clients by matter count
SELECT 
    c.name,
    c.email,
    COUNT(m.id) as matter_count
FROM clients c
LEFT JOIN matters m ON c.id = m.client_id
WHERE c.workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY c.id, c.name, c.email
ORDER BY matter_count DESC
LIMIT 10;

-- =============================================
-- MAINTENANCE & CLEANUP
-- =============================================

-- Find orphaned files (no associated matter)
SELECT * FROM files
WHERE matter_id NOT IN (SELECT id FROM matters);

-- Delete old activity logs (older than 1 year)
DELETE FROM activity_log
WHERE created_at < NOW() - INTERVAL '1 year';

-- Archive old closed matters
UPDATE matters
SET status = 'archived'
WHERE status = 'closed'
    AND closed_at < NOW() - INTERVAL '2 years';

-- =============================================
-- BACKUP & EXPORT
-- =============================================

-- Export all matters for a workspace (copy result to CSV)
SELECT 
    m.reference,
    m.title,
    m.status,
    c.name as client_name,
    m.opened_at,
    m.closed_at,
    p.full_name as assigned_to
FROM matters m
LEFT JOIN clients c ON m.client_id = c.id
LEFT JOIN profiles p ON m.assigned_to = p.id
WHERE m.workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY m.opened_at DESC;

-- =============================================
-- TROUBLESHOOTING
-- =============================================

-- Check RLS policies are enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View all policies on a table
SELECT * FROM pg_policies
WHERE tablename = 'matters';

-- Check user's current role
SELECT role FROM profiles
WHERE id = auth.uid();

-- Test if user can see data (run as that user)
SELECT COUNT(*) FROM matters;
-- If this returns 0 but you know there's data, RLS is blocking access

-- =============================================
-- NOTES
-- =============================================

-- Always replace placeholders:
-- - YOUR_WORKSPACE_ID
-- - USER_ID, CLIENT_ID, MATTER_ID, etc.
-- - Dates and times

-- To get IDs, use RETURNING id in INSERT statements
-- or query the table after creation

-- All timestamps are in UTC
-- Use NOW() for current timestamp

-- For production, consider:
-- - Regular backups
-- - Index optimization
-- - Query performance monitoring
-- - Archiving old data
