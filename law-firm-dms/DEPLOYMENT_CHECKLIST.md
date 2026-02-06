# Production Deployment Checklist

Use this checklist before deploying your Law Firm DMS to production.

## 🔐 Security

- [ ] **Email Verification Enabled**
  - Go to Supabase > Authentication > Providers > Email
  - Enable "Confirm email"
  
- [ ] **Strong Password Requirements**
  - Minimum 8 characters
  - Consider requiring special characters
  
- [ ] **Row Level Security (RLS) Verified**
  - All tables have RLS enabled
  - Test with different user roles
  - Verify workspace isolation
  
- [ ] **Storage Bucket is Private**
  - `matter-files` bucket is NOT public
  - Storage policies are applied
  
- [ ] **Environment Variables Secured**
  - Never commit `.env` to git
  - Use hosting platform's secret management
  
- [ ] **CORS Settings**
  - Add production domain to Supabase allowed origins
  - Authentication > URL Configuration
  
- [ ] **Rate Limiting**
  - Consider enabling Supabase rate limiting
  - Protect against brute force attacks

## 🗄️ Database

- [ ] **Backups Configured**
  - Supabase automatic backups enabled
  - Test restore procedure
  
- [ ] **Indexes Optimized**
  - Review query performance
  - Add indexes for slow queries
  
- [ ] **Data Migration Plan**
  - Document any schema changes
  - Have rollback plan
  
- [ ] **Seed Data Removed**
  - Remove demo/test data
  - Clean up development accounts

## 🚀 Application

- [ ] **Build Succeeds**
  ```bash
  npm run build
  ```
  - No TypeScript errors
  - No build warnings
  
- [ ] **Environment Variables Set**
  - `VITE_SUPABASE_URL` in production
  - `VITE_SUPABASE_ANON_KEY` in production
  
- [ ] **Error Handling**
  - User-friendly error messages
  - Error logging configured
  
- [ ] **Loading States**
  - Spinners for async operations
  - Skeleton screens where appropriate
  
- [ ] **Mobile Responsive**
  - Test on mobile devices
  - Touch-friendly buttons
  
- [ ] **Browser Compatibility**
  - Test on Chrome, Firefox, Safari, Edge
  - Check for console errors

## 📧 Email Configuration

- [ ] **Email Templates Customized**
  - Supabase > Authentication > Email Templates
  - Update confirmation email
  - Update password reset email
  - Add your branding
  
- [ ] **SMTP Configured (Optional)**
  - For custom email domain
  - Better deliverability
  
- [ ] **Email Rate Limits**
  - Understand Supabase email limits
  - Plan for high-volume scenarios

## 🎨 Branding

- [ ] **Logo Updated**
  - Replace default logo
  - Add favicon
  
- [ ] **Colors Customized**
  - Update CSS variables if needed
  - Match your firm's branding
  
- [ ] **Content Updated**
  - Update "Law Firm DMS" to your firm name
  - Update footer text
  - Update help/about content

## 📊 Monitoring

- [ ] **Error Tracking**
  - Consider Sentry or similar
  - Track JavaScript errors
  
- [ ] **Analytics**
  - Google Analytics or alternative
  - Track user behavior
  
- [ ] **Performance Monitoring**
  - Page load times
  - Database query performance
  
- [ ] **Uptime Monitoring**
  - Set up alerts
  - Monitor Supabase status

## 📱 Deployment

- [ ] **Hosting Platform Selected**
  - Vercel (recommended)
  - Netlify
  - Cloudflare Pages
  - Other static host
  
- [ ] **Domain Configured**
  - DNS records set
  - SSL certificate active
  
- [ ] **Redirect URLs Updated**
  - Supabase > Authentication > URL Configuration
  - Add production URL
  - Add redirect URLs
  
- [ ] **Build Command Configured**
  ```bash
  npm run build
  ```
  
- [ ] **Output Directory Set**
  ```
  dist/
  ```

## 👥 User Management

- [ ] **Admin Account Created**
  - First user assigned admin role
  - Workspace created and assigned
  
- [ ] **User Invitation Process**
  - Document how to invite users
  - Document role assignment
  
- [ ] **Client Onboarding**
  - Process for adding clients
  - Process for linking client accounts

## 📝 Documentation

- [ ] **User Guide Created**
  - How to create matters
  - How to upload files
  - How to use client portal
  
- [ ] **Admin Guide Created**
  - How to manage users
  - How to manage workspace
  - How to run reports
  
- [ ] **Support Contact**
  - Email or support system
  - Response time expectations

## 🧪 Testing

- [ ] **User Roles Tested**
  - Admin can do everything
  - Staff has correct permissions
  - Client can only see their data
  
- [ ] **File Upload Tested**
  - Various file types
  - Large files (test limits)
  - File download works
  
- [ ] **Search Tested**
  - Search finds correct results
  - Filters work correctly
  
- [ ] **Mobile Tested**
  - All features work on mobile
  - UI is usable on small screens

## 🔄 Backup & Recovery

- [ ] **Backup Strategy**
  - Supabase automatic backups
  - Export important data regularly
  
- [ ] **Recovery Tested**
  - Test restoring from backup
  - Document recovery procedure
  
- [ ] **Data Export**
  - Users can export their data
  - Compliance with data protection laws

## ⚖️ Legal & Compliance

- [ ] **Privacy Policy**
  - Create privacy policy
  - Link in footer
  
- [ ] **Terms of Service**
  - Create terms of service
  - Users accept on signup
  
- [ ] **Data Protection**
  - GDPR compliance (if applicable)
  - Data retention policy
  - Right to deletion
  
- [ ] **Audit Logging**
  - All actions logged
  - Logs are immutable
  - Retention period defined

## 📞 Support

- [ ] **Help Documentation**
  - FAQ section
  - Video tutorials
  
- [ ] **Support Email**
  - Dedicated support email
  - Auto-responder set up
  
- [ ] **Bug Reporting**
  - Process for users to report bugs
  - Issue tracking system

## 🎯 Post-Launch

- [ ] **Monitor First Week**
  - Watch for errors
  - Monitor performance
  - Gather user feedback
  
- [ ] **User Training**
  - Train staff on system
  - Train clients on portal
  
- [ ] **Feedback Collection**
  - Survey users
  - Iterate based on feedback
  
- [ ] **Performance Review**
  - Check database performance
  - Optimize slow queries
  - Review storage usage

---

## Quick Deploy Commands

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

---

## Emergency Contacts

- **Supabase Status**: https://status.supabase.com
- **Supabase Support**: support@supabase.io
- **Your Hosting Support**: [Add your hosting support contact]

---

## Notes

- Keep this checklist updated as you add features
- Review before each major deployment
- Share with your team
- Document any deviations

---

**Last Updated**: 2026-02-03
**Version**: 1.0
