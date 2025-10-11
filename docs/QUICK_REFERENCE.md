# 🚀 Database Migration Quick Reference

## One-Page Guide for Execution

---

## ⚡ Quick Execute (3 Steps)

### 1. Backup (2 minutes)

```
Supabase Dashboard → Settings → Database → Backups → Create Backup
```

### 2. Execute (1 minute)

```
Supabase Dashboard → SQL Editor → New Query
→ Copy/Paste: db/migrations/fix_security_and_performance.sql
→ Run (Cmd/Ctrl + Enter)
```

### 3. Verify (2 minutes)

```sql
-- Check RLS enabled (should show 19 rows with true)
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- Check new indexes (should show 11 rows)
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

---

## 📋 What Gets Fixed

| Issue             | Count     | Fix                  |
| ----------------- | --------- | -------------------- |
| RLS Disabled      | 19 tables | ✅ Enable + Policies |
| Unindexed FKs     | 8         | ✅ Add Indexes       |
| Duplicate Indexes | 2         | ✅ Remove            |
| Unused Index      | 1         | ✅ Remove            |
| Function Security | 1         | ✅ Fix search_path   |

**Total Issues Fixed:** 32

---

## 🔍 Quick Verification Commands

```sql
-- 1. RLS Status (expect: all true)
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 2. New Indexes (expect: 11 rows)
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%';

-- 3. Removed Indexes (expect: 0 rows)
SELECT indexname FROM pg_indexes
WHERE indexname IN ('permissions_action_subject_idx', 'system_settings_key_idx', 'metadata_title_idx');

-- 4. Test User Access
SELECT * FROM metadata_records WHERE status = 'Published' LIMIT 1;
```

---

## 🧪 Quick Test Checklist

- [ ] Login works
- [ ] View published metadata
- [ ] Create metadata record
- [ ] View notifications
- [ ] Admin dashboard loads

---

## 🆘 Quick Troubleshooting

### Issue: "Permission Denied"

**Fix:** Check user has correct role

```sql
SELECT u.email, r.name FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

### Issue: "Slow Queries"

**Fix:** Run ANALYZE

```sql
ANALYZE;
```

### Issue: "Need to Rollback"

**Fix:** Restore from backup

```
Dashboard → Settings → Database → Backups → Restore
```

---

## 📊 Expected Results

### Before

- ❌ 20 critical security errors
- ⚠️ 11 performance warnings
- ⚠️ 1 function warning

### After

- ✅ 0 security errors
- ✅ 0 performance warnings
- ✅ 0 function warnings

---

## 🔗 Full Documentation

- **Detailed Guide:** `docs/database-security-migration-guide.md`
- **Checklist:** `docs/database-migration-checklist.md`
- **Technical Summary:** `docs/database-improvements-summary.md`
- **Status:** `docs/MIGRATION_STATUS.md`

---

## ⏱️ Time Estimate

| Task      | Time       |
| --------- | ---------- |
| Backup    | 2 min      |
| Execute   | 1 min      |
| Verify    | 2 min      |
| Test      | 5 min      |
| **Total** | **10 min** |

---

## 🎯 Success = All Green

```
✅ RLS enabled on 19 tables
✅ 11 new indexes created
✅ 3 old indexes removed
✅ Function security fixed
✅ Application works
✅ No errors in logs
```

---

## 📞 Need Help?

1. Check `docs/database-security-migration-guide.md` (troubleshooting section)
2. Review Supabase logs (Dashboard → Logs)
3. Restore from backup if needed
4. Contact team lead

---

**Ready to Execute?** → Follow the 3 steps at the top! 🚀

_Quick Reference v1.0 | 2025-01-11_
