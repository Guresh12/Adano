# Law Firm Document Management System (DMS)

A modern, production-ready document management system built specifically for law firms, featuring multi-tenant workspaces, secure file storage, client portals, and comprehensive audit logging.

## 🚀 Features

### Core Functionality
- ✅ **Multi-tenant Workspaces** - Isolated data per law firm
- ✅ **Role-Based Access Control** - Admin, Staff, and Client roles
- ✅ **Matter Management** - Track cases with references, statuses, and assignments
- ✅ **Secure File Storage** - Supabase Storage with Row Level Security
- ✅ **Client Portal** - Secure messaging and file sharing
- ✅ **Deadline Tracking** - Calendar integration with priority levels
- ✅ **Activity Logging** - Complete audit trail for compliance
- ✅ **Real-time Updates** - Supabase Realtime subscriptions
- ✅ **Search & Filtering** - Fast full-text search across all entities
- ✅ **Dark/Light Themes** - Modern, accessible UI

### Security Features
- 🔒 Row Level Security (RLS) policies
- 🔒 Encrypted file storage
- 🔒 Audit logging for all actions
- 🔒 Session management
- 🔒 Workspace isolation

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styling**: Modern CSS with design system
- **Routing**: React Router v6
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd law-firm-dms
npm install
```

### 2. Set Up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Run the SQL script

3. **Create Storage Bucket**:
   - Go to Storage in Supabase dashboard
   - Create a new bucket called `matter-files`
   - Set it to **Private** (not public)
   - Apply the storage policies from the schema file

4. **Get your credentials**:
   - Go to Project Settings > API
   - Copy your `Project URL` and `anon/public` key

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Create Initial Workspace & Admin User

Run this SQL in Supabase SQL Editor to create your first workspace and admin:

```sql
-- Create workspace
INSERT INTO workspaces (name, slug) 
VALUES ('My Law Firm', 'my-law-firm')
RETURNING id;

-- Note the workspace ID from above, then create admin user
-- First sign up through the app, then run:
UPDATE profiles 
SET workspace_id = 'YOUR_WORKSPACE_ID', 
    role = 'admin',
    full_name = 'Admin User'
WHERE email = 'admin@yourlawfirm.com';
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
law-firm-dms/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── matters/        # Matter management
│   │   ├── files/          # File management
│   │   ├── clients/        # Client portal
│   │   ├── deadlines/      # Deadline tracking
│   │   └── shared/         # Shared UI components
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/                # Utilities and configs
│   │   ├── supabase.ts     # Supabase client
│   │   └── database.types.ts # TypeScript types
│   ├── pages/              # Page components
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── supabase-schema.sql     # Database schema
├── .env.example            # Environment template
└── README.md               # This file
```

## 🗄️ Database Schema

### Core Tables

- **workspaces** - Multi-tenant isolation
- **profiles** - Extended user data with roles
- **clients** - Client information
- **matters** - Legal cases/matters
- **deadlines** - Important dates and tasks
- **files** - File metadata (actual files in Storage)
- **messages** - Client-staff communication
- **activity_log** - Audit trail

### Enums

- `user_role`: admin, staff, client
- `matter_status`: active, pending, closed, archived
- `file_category`: pleadings, evidence, client_communication, research, internal, contracts, correspondence
- `activity_type`: Various activity types for logging

## 🔐 Security Model

### Row Level Security (RLS)

All tables have RLS enabled with policies that:

1. **Staff** can view/edit all data in their workspace
2. **Clients** can only view their own matters and files
3. **Activity logs** are append-only
4. **Workspaces** are completely isolated

### File Storage

- Files stored in Supabase Storage with encryption
- Access controlled via RLS policies
- Clients can only access files marked `is_client_visible`
- All file access is logged

## 🎨 Customization

### Branding

Edit `src/index.css` to customize:
- Colors (`:root` CSS variables)
- Fonts
- Spacing
- Shadows and effects

### Logo

Replace the logo component in `src/components/shared/Logo.tsx`

## 📱 User Roles

### Admin
- Full access to workspace
- Can create/edit/delete all entities
- Can invite users and assign roles
- Access to all reports and analytics

### Staff
- Can create/edit matters and files
- Can communicate with clients
- Can view all workspace data
- Cannot manage users

### Client
- Can view their own matters
- Can view files marked as client-visible
- Can send messages to staff
- Cannot create matters or upload files

## 🧪 Testing

### Create Test Data

Use the seed data function in the dashboard or run:

```sql
-- Create test client
INSERT INTO clients (workspace_id, name, email, company)
VALUES ('YOUR_WORKSPACE_ID', 'Acme Holdings Ltd', 'legal@acme.test', 'Acme Corp');

-- Create test matter
INSERT INTO matters (workspace_id, client_id, reference, title, status)
VALUES (
  'YOUR_WORKSPACE_ID',
  'CLIENT_ID_FROM_ABOVE',
  'ELC-2026-001',
  'Land Dispute - Plot 209/19860',
  'active'
);
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy the dist/ folder to Vercel
```

### Environment Variables

Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📊 Monitoring & Analytics

### Activity Logs

All user actions are logged in `activity_log` table:
- User who performed action
- Timestamp
- Action type
- Entity affected
- IP address and user agent

### Queries for Reports

```sql
-- Recent activity
SELECT * FROM activity_log 
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY created_at DESC 
LIMIT 50;

-- Matters by status
SELECT status, COUNT(*) 
FROM matters 
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY status;

-- Upcoming deadlines
SELECT * FROM deadlines
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND due_date > NOW()
  AND is_completed = false
ORDER BY due_date ASC;
```

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists and has correct values
- Restart dev server after changing `.env`

### "Row Level Security policy violation"
- Ensure user has correct role in `profiles` table
- Verify workspace_id is set for the user
- Check RLS policies in Supabase dashboard

### Files not uploading
- Verify `matter-files` bucket exists
- Check storage policies are applied
- Ensure file size is under limit (default 50MB)

## 📝 License

MIT License - feel free to use for your law firm!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check Supabase documentation
- Review the code comments

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Document version control
- [ ] E-signature integration
- [ ] Time tracking
- [ ] Billing integration
- [ ] Mobile app
- [ ] Advanced search with filters
- [ ] Document templates
- [ ] Calendar sync (Google/Outlook)
- [ ] Two-factor authentication

---

Built with ❤️ for modern law firms
