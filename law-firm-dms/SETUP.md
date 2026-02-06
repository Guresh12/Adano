# Law Firm DMS - Setup Guide

## 🚀 Quick Setup (5 Minutes)

Follow these steps to get your Law Firm DMS up and running with Supabase.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Project Name**: `law-firm-dms`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

---

## Step 2: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

---

## Step 3: Create Storage Bucket

1. Go to **Storage** in the Supabase sidebar
2. Click "Create a new bucket"
3. Name it: `matter-files`
4. Set **Public bucket**: OFF (keep it private)
5. Click "Create bucket"

### Apply Storage Policies

Go to **SQL Editor** and run:

```sql
-- Allow staff to upload files
CREATE POLICY "Staff can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'matter-files' AND
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'staff')
    )
);

-- Allow staff to view all files
CREATE POLICY "Staff can view all files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'matter-files' AND
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'staff')
    )
);

-- Allow staff to delete files
CREATE POLICY "Staff can delete files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'matter-files' AND
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'staff')
    )
);
```

---

## Step 4: Get Your Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

---

## Step 5: Configure Your App

1. In the project folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## Step 6: Create Your First Workspace & Admin

### Option A: Using SQL (Recommended)

1. Go to **SQL Editor** in Supabase
2. Run this to create a workspace:

```sql
-- Create your law firm's workspace
INSERT INTO workspaces (name, slug, is_active)
VALUES ('My Law Firm', 'my-law-firm', true)
RETURNING id;
```

3. **Copy the workspace ID** from the result (looks like: `550e8400-e29b-41d4-a716-446655440000`)

4. Now sign up through your app (see Step 7), then come back and run:

```sql
-- Replace with your email and the workspace ID from above
UPDATE profiles
SET 
    workspace_id = 'YOUR_WORKSPACE_ID_HERE',
    role = 'admin',
    full_name = 'Admin User'
WHERE email = 'your-email@example.com';
```

### Option B: Manual Setup in Supabase Dashboard

1. Go to **Table Editor** > **workspaces**
2. Click "Insert row"
3. Fill in:
   - name: `My Law Firm`
   - slug: `my-law-firm`
   - is_active: `true`
4. Copy the generated `id`

5. After signing up (Step 7), go to **Table Editor** > **profiles**
6. Find your profile row and click to edit
7. Set:
   - workspace_id: (paste the workspace ID)
   - role: `admin`
   - full_name: Your name

---

## Step 7: Run the App

```bash
# Install dependencies (if you haven't already)
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Step 8: Sign Up & Login

1. Click "Need an account? Sign Up"
2. Enter your email and password
3. Check your email for the confirmation link
4. Click the link to verify your email
5. Go back to the app and sign in

**Important**: After signing up, you MUST run the SQL from Step 6 to assign yourself to a workspace and make yourself an admin!

---

## 🎉 You're Done!

You should now see the dashboard. Try:

1. Click "Seed Demo Data" to create sample matters and deadlines
2. Explore the different pages
3. Create your first real matter

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in the project root
- Check that the values are correct (no quotes needed)
- Restart the dev server: `Ctrl+C` then `npm run dev`

### "Row Level Security policy violation"
- Make sure you ran the SQL from Step 6 to assign workspace and role
- Check in Supabase Table Editor > profiles that your user has:
  - `workspace_id` set
  - `role` set to `admin`

### "No workspace assigned" warning
- You need to run the UPDATE query from Step 6
- Your profile needs a valid `workspace_id`

### Email confirmation not received
- Check spam folder
- In Supabase, go to **Authentication** > **Email Templates** and check settings
- For development, you can disable email confirmation in **Authentication** > **Providers** > **Email** > uncheck "Confirm email"

---

## 📊 Next Steps

### Add More Users

To invite staff or clients:

1. Have them sign up through the app
2. Go to Supabase **Table Editor** > **profiles**
3. Find their profile and set:
   - `workspace_id`: Your workspace ID
   - `role`: `staff` or `client`

### Create Clients

```sql
INSERT INTO clients (workspace_id, name, email, company)
VALUES (
    'YOUR_WORKSPACE_ID',
    'Acme Holdings Ltd',
    'legal@acme.test',
    'Acme Corporation'
);
```

### Create Matters

Use the app UI or SQL:

```sql
INSERT INTO matters (workspace_id, client_id, reference, title, status, created_by)
VALUES (
    'YOUR_WORKSPACE_ID',
    'CLIENT_ID_HERE',
    'ELC-2026-001',
    'Land Dispute - Plot 209/19860',
    'active',
    'YOUR_USER_ID'
);
```

---

## 🔐 Security Checklist

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Storage bucket is private (not public)
- ✅ Email confirmation enabled (for production)
- ✅ Strong passwords required
- ✅ Workspace isolation enforced
- ✅ Audit logging active

---

## 📱 Production Deployment

When ready to deploy:

1. Build the app: `npm run build`
2. Deploy the `dist/` folder to:
   - Vercel (recommended)
   - Netlify
   - Cloudflare Pages
   - Any static host

3. Set environment variables in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Update Supabase **Authentication** > **URL Configuration**:
   - Add your production URL to allowed redirect URLs

---

## 🆘 Need Help?

- Check the main [README.md](./README.md)
- Review Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Check the browser console for errors
- Verify RLS policies in Supabase dashboard

---

**Happy Document Managing! 📁✨**
