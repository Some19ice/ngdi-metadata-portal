# Database Migration Checklist

## Pre-Migration

- [ ] **Backup database** (Supabase Dashboard > Settings > Database > Backups)
- [ ] **Test in development** environment first
- [ ] **Review migration file** (`db/migrations/fix_security_and_performance.sql`)
- [ ] **Schedule maintenance window** (optional, < 1 min downtime)
- [ ] **Notify team** about upcoming changes

## Migration Execution

- [ ] **Open Supabase Dashboard** SQL Editor
- [ ] **Copy migration SQL** from `db/migrations/fix_security_and_performance.sql`
- [ ] **Paste and run** in SQL Editor
- [ ] **Wait for completion** (10-30 seconds)
- [ ] **Check for errors** in output

## Verification

### Database Structure

- [ ] **Verify RLS enabled** on all 19 tables
- [ ] **Verify 11 new indexes** created
- [ ] **Verify 3 indexes removed** (duplicates + unused)
- [ ] **Verify function fixed** (`handle_new_user`)

### Application Testing

- [ ] **User authentication** works
- [ ] **Create metadata record** works
- [ ] **View published metadata** works (public)
- [ ] **View org metadata** works (members only)
- [ ] **Update metadata** works (creators/approvers)
- [ ] **Notifications** display correctly
- [ ] **Admin dashboard** accessible
- [ ] **Organization management** works

### Security Advisors

- [ ] **Run Supabase Advisors** (Database > Advisors)
- [ ] **Verify RLS warnings** are gone (20 errors → 0)
- [ ] **Verify index warnings** are gone (8 warnings → 0)
- [ ] **Verify duplicate index warnings** are gone (2 warnings → 0)
- [ ] **Verify function warning** is gone (1 warning → 0)

## Additional Configuration

- [ ] **Enable leaked password protection** (Auth > Policies)
- [ ] **Enable additional MFA options** (Auth > Providers)
- [ ] **Move pg_trgm extension** to extensions schema
- [ ] **Schedule PostgreSQL upgrade** (Settings > Infrastructure)

## Post-Migration Monitoring

### First 24 Hours

- [ ] **Monitor error logs** (Dashboard > Logs)
- [ ] **Check query performance** (Database > Query Performance)
- [ ] **Monitor user reports** of access issues
- [ ] **Review RLS policy effectiveness**

### First Week

- [ ] **Analyze query patterns** with new indexes
- [ ] **Optimize slow queries** if needed
- [ ] **Document any policy adjustments**
- [ ] **Update team documentation**

## Rollback (If Needed)

- [ ] **Restore from backup** (last resort)
- [ ] **Disable RLS** on affected tables
- [ ] **Drop new policies** causing issues
- [ ] **Contact support** if needed

## Success Criteria

✅ All 20 RLS errors resolved
✅ All 8 unindexed foreign key warnings resolved  
✅ All 2 duplicate index warnings resolved
✅ Function search_path warning resolved
✅ Application functionality intact
✅ No performance degradation
✅ No user access issues

## Notes

**Date Executed:** **\*\***\_\_\_**\*\***
**Executed By:** **\*\***\_\_\_**\*\***
**Duration:** **\*\***\_\_\_**\*\***
**Issues Encountered:** **\*\***\_\_\_**\*\***
**Resolution:** **\*\***\_\_\_**\*\***

---

## Quick Commands

### Verify RLS Status

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Verify New Indexes

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename;
```

### Check User Roles

```sql
SELECT u.email, r.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;
```

### Test RLS Policy

```sql
-- As authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-id-here';
SELECT * FROM metadata_records;
RESET ROLE;
```
