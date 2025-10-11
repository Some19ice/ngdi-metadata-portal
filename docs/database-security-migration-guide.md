# Database Security & Performance Migration Guide

## Overview

This guide walks you through implementing critical security and performance improvements for the NGDI Metadata Portal database.

## ⚠️ Important Pre-Migration Steps

### 1. Backup Your Database

Before running any migrations, create a backup:

```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Or from Supabase Dashboard:
# Settings > Database > Database Backups > Create Backup
```

### 2. Test in Development First

If you have a development/staging environment, test there first:

```bash
# Apply to development branch
supabase db push --db-url <your-dev-database-url>
```

## 📋 Migration Execution

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `db/migrations/fix_security_and_performance.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for completion (should take 10-30 seconds)

### Option 2: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Apply the migration
supabase db push
```

### Option 3: Using psql

```bash
psql <your-database-connection-string> -f db/migrations/fix_security_and_performance.sql
```

## ✅ Post-Migration Verification

### 1. Verify RLS is Enabled

Run this query in SQL Editor:

```sql
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rls_enabled = true`.

### 2. Verify Indexes Were Created

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

You should see 11 new indexes starting with `idx_`.

### 3. Verify Duplicate Indexes Were Removed

```sql
-- This should return 0 rows
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN ('permissions_action_subject_idx', 'system_settings_key_idx', 'metadata_title_idx');
```

### 4. Test Application Functionality

After migration, test these critical flows:

- [ ] User login and authentication
- [ ] Creating a new metadata record
- [ ] Viewing published metadata (as public user)
- [ ] Viewing organization metadata (as org member)
- [ ] Updating metadata records
- [ ] Viewing notifications
- [ ] Admin dashboard access
- [ ] Organization management

### 5. Run Supabase Advisors Again

Check if issues are resolved:

```bash
# Using MCP tools or Supabase Dashboard
# Navigate to: Database > Advisors
```

Expected results:

- ✅ All RLS warnings should be gone
- ✅ Unindexed foreign key warnings should be gone
- ✅ Duplicate index warnings should be gone
- ✅ Function search_path warning should be gone

## 🔧 Additional Configuration Steps

### 1. Enable Leaked Password Protection

1. Go to **Authentication > Policies** in Supabase Dashboard
2. Enable **Leaked Password Protection**
3. This checks passwords against HaveIBeenPwned database

### 2. Enable Additional MFA Options

1. Go to **Authentication > Providers**
2. Enable additional MFA methods:
   - TOTP (Time-based One-Time Password)
   - Phone (SMS)
   - WebAuthn (Hardware keys)

### 3. Move pg_trgm Extension

Run this in SQL Editor:

```sql
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Update search_path for your database
ALTER DATABASE postgres SET search_path TO public, extensions;
```

### 4. Upgrade PostgreSQL Version

1. Go to **Settings > Infrastructure**
2. Check for available PostgreSQL upgrades
3. Schedule upgrade during low-traffic period
4. Follow Supabase's upgrade wizard

## 🔍 Understanding the Changes

### Performance Improvements

**Added Indexes (11 total):**

- Foreign key indexes speed up JOIN operations
- Notification indexes speed up user notification queries
- These can improve query performance by 10-100x

**Removed Indexes (3 total):**

- Duplicate indexes waste storage and slow down writes
- Unused indexes provide no benefit

### Security Improvements

**Row Level Security (RLS):**

- Prevents unauthorized data access at the database level
- Works even if application code has bugs
- Policies enforce:
  - Users can only see their own data
  - Organization members can see org data
  - System admins have full access
  - Published metadata is public

**Function Security:**

- Fixed `handle_new_user` function to prevent SQL injection
- Set immutable search_path

## 🚨 Troubleshooting

### Issue: Policies Too Restrictive

If users can't access data they should:

1. Check user roles:

```sql
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

2. Check organization membership:

```sql
SELECT u.email, o.name as organization, uo.role
FROM users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email = 'user@example.com';
```

### Issue: Service Role Queries Failing

Make sure you're using the service role key for server-side operations:

```typescript
// Server-side only
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Not the anon key
)
```

### Issue: Performance Degradation

If queries are slower after migration:

1. Run ANALYZE to update statistics:

```sql
ANALYZE;
```

2. Check if indexes are being used:

```sql
EXPLAIN ANALYZE
SELECT * FROM metadata_records WHERE organization_id = 'some-uuid';
```

Look for "Index Scan" in the output.

## 📊 Monitoring

### Track Query Performance

```sql
-- Top 10 slowest queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Monitor RLS Policy Performance

```sql
-- Check if policies are causing slowdowns
SELECT
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```

High `seq_scan` values might indicate missing indexes.

## 🔄 Rollback Plan

If you need to rollback (not recommended, but possible):

```sql
-- Disable RLS on all tables
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE metadata DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Drop all policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
-- ... repeat for all policies

-- Drop new indexes
DROP INDEX IF EXISTS idx_metadata_analytics_metadata_record_id;
-- ... repeat for all new indexes
```

## 📞 Support

If you encounter issues:

1. Check Supabase logs: Dashboard > Logs
2. Review this guide's troubleshooting section
3. Check Supabase documentation: https://supabase.com/docs
4. Contact Supabase support if needed

## ✨ Next Steps

After successful migration:

1. Monitor application for 24-48 hours
2. Review query performance metrics
3. Update application code if needed for RLS
4. Document any custom policies added
5. Schedule regular security audits

---

**Migration Created:** $(date)
**Estimated Downtime:** < 1 minute
**Risk Level:** Low (with proper testing)
