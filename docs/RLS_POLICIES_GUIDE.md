# 🔒 Row Level Security (RLS) Policies Guide

## Understanding RLS in NGDI Metadata Portal

This guide explains the Row Level Security policies implemented for each table.

---

## 🎯 Policy Overview

RLS policies control **who can access what data** at the database level. Even if your application code has bugs, RLS prevents unauthorized access.

### Policy Types

- **SELECT** - Who can read data
- **INSERT** - Who can create data
- **UPDATE** - Who can modify data
- **DELETE** - Who can remove data
- **ALL** - Combination of all operations

---

## 👥 User Roles

### 1. Anonymous (anon)

- Not logged in
- Can view published metadata
- Can subscribe to newsletter

### 2. Authenticated

- Logged in user
- Can view own data
- Can view published content

### 3. Metadata Creator

- Can create metadata records
- Can edit own draft records

### 4. Metadata Approver

- Can approve/reject records
- Can edit records in their org

### 5. Node Officer

- Manages organization
- All approver permissions
- Can manage org members

### 6. System Administrator

- Full access to everything
- Can manage users and roles
- Can view audit logs

### 7. Service Role

- Backend operations only
- Bypasses all RLS policies
- Never exposed to client

---

## 📊 Table-by-Table Policies

### 1. Users Table

**Who can do what:**

| Action | Who               | Policy                                     |
| ------ | ----------------- | ------------------------------------------ |
| SELECT | All authenticated | View all users (for mentions, assignments) |
| UPDATE | User themselves   | Update own profile only                    |
| ALL    | Service role      | Full access for system operations          |

**Example:**

```sql
-- ✅ Alice can view Bob's profile (for @mentions)
SELECT * FROM users WHERE email = 'bob@example.com';

-- ✅ Alice can update her own profile
UPDATE users SET first_name = 'Alice' WHERE id = auth.uid();

-- ❌ Alice cannot update Bob's profile
UPDATE users SET first_name = 'Hacked' WHERE email = 'bob@example.com';
```

---

### 2. Profiles Table

**Who can do what:**

| Action | Who             | Policy             |
| ------ | --------------- | ------------------ |
| SELECT | User themselves | View own profile   |
| UPDATE | User themselves | Update own profile |
| ALL    | Service role    | Full access        |

**Example:**

```sql
-- ✅ Alice can view her own profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- ❌ Alice cannot view Bob's profile
SELECT * FROM profiles WHERE user_id = 'bob-id';
```

---

### 3. Organizations Table

**Who can do what:**

| Action | Who               | Policy                    |
| ------ | ----------------- | ------------------------- |
| SELECT | All authenticated | View active organizations |
| UPDATE | Node officer      | Update their organization |
| ALL    | System admin      | Full access               |
| ALL    | Service role      | Full access               |

**Example:**

```sql
-- ✅ Anyone can view active organizations
SELECT * FROM organizations WHERE status = 'active';

-- ✅ Node officer can update their org
UPDATE organizations SET description = 'New desc'
WHERE node_officer_id = auth.uid();

-- ❌ Regular user cannot update any org
UPDATE organizations SET description = 'Hacked';
```

---

### 4. Metadata Records Table

**Who can do what:**

| Action | Who               | Policy                           |
| ------ | ----------------- | -------------------------------- |
| SELECT | Anyone            | View published metadata          |
| SELECT | Creator           | View own records                 |
| SELECT | Org members       | View org metadata                |
| INSERT | Metadata creators | Create records (as themselves)   |
| UPDATE | Creator           | Update own draft/pending records |
| UPDATE | Approvers         | Update org records               |
| ALL    | System admin      | Full access                      |
| ALL    | Service role      | Full access                      |

**Example:**

```sql
-- ✅ Anyone can view published metadata
SELECT * FROM metadata_records WHERE status = 'Published';

-- ✅ Alice can view her own draft
SELECT * FROM metadata_records
WHERE creator_user_id = auth.uid() AND status = 'Draft';

-- ✅ Org member can view org metadata
SELECT * FROM metadata_records mr
WHERE EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.organization_id = mr.organization_id
);

-- ❌ Alice cannot view Bob's draft
SELECT * FROM metadata_records
WHERE creator_user_id = 'bob-id' AND status = 'Draft';

-- ✅ Metadata creator can create record
INSERT INTO metadata_records (title, creator_user_id, ...)
VALUES ('New Record', auth.uid(), ...);

-- ❌ Cannot create record for someone else
INSERT INTO metadata_records (title, creator_user_id, ...)
VALUES ('New Record', 'bob-id', ...);
```

---

### 5. Notifications Table

**Who can do what:**

| Action | Who             | Policy                            |
| ------ | --------------- | --------------------------------- |
| SELECT | User themselves | View own notifications            |
| UPDATE | User themselves | Mark own notifications as read    |
| INSERT | System          | Create notifications for any user |
| ALL    | Service role    | Full access                       |

**Example:**

```sql
-- ✅ Alice can view her notifications
SELECT * FROM notifications WHERE user_id = auth.uid();

-- ✅ Alice can mark her notification as read
UPDATE notifications SET is_read = true
WHERE id = 'notif-id' AND user_id = auth.uid();

-- ❌ Alice cannot view Bob's notifications
SELECT * FROM notifications WHERE user_id = 'bob-id';
```

---

### 6. User Organizations Table

**Who can do what:**

| Action | Who             | Policy                 |
| ------ | --------------- | ---------------------- |
| SELECT | User themselves | View own memberships   |
| SELECT | Node officer    | View org members       |
| ALL    | System admin    | Manage all memberships |
| ALL    | Service role    | Full access            |

**Example:**

```sql
-- ✅ Alice can view her organization memberships
SELECT * FROM user_organizations WHERE user_id = auth.uid();

-- ✅ Node officer can view their org members
SELECT * FROM user_organizations uo
WHERE EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = uo.organization_id
    AND o.node_officer_id = auth.uid()
);

-- ❌ Regular user cannot view other org members
SELECT * FROM user_organizations WHERE organization_id = 'some-org-id';
```

---

### 7. Roles & Permissions Tables

**Who can do what:**

| Action | Who               | Policy                       |
| ------ | ----------------- | ---------------------------- |
| SELECT | All authenticated | View roles and permissions   |
| ALL    | System admin      | Modify roles and permissions |
| ALL    | Service role      | Full access                  |

**Example:**

```sql
-- ✅ Anyone can view available roles
SELECT * FROM roles;

-- ✅ Anyone can view permissions
SELECT * FROM permissions;

-- ❌ Regular user cannot create new role
INSERT INTO roles (name) VALUES ('Super User');

-- ✅ System admin can create new role
-- (if they have System Administrator role)
```

---

### 8. User Roles Table

**Who can do what:**

| Action | Who             | Policy              |
| ------ | --------------- | ------------------- |
| SELECT | User themselves | View own roles      |
| SELECT | System admin    | View all user roles |
| ALL    | System admin    | Manage user roles   |
| ALL    | Service role    | Full access         |

**Example:**

```sql
-- ✅ Alice can view her own roles
SELECT r.name FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();

-- ❌ Alice cannot view Bob's roles
SELECT r.name FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'bob-id';

-- ✅ System admin can view all roles
-- (if they have System Administrator role)
```

---

### 9. Audit Logs Table

**Who can do what:**

| Action | Who          | Policy               |
| ------ | ------------ | -------------------- |
| SELECT | System admin | View all audit logs  |
| INSERT | System       | Create audit entries |
| ALL    | Service role | Full access          |

**Example:**

```sql
-- ❌ Regular user cannot view audit logs
SELECT * FROM audit_logs;

-- ✅ System admin can view audit logs
-- (if they have System Administrator role)

-- ✅ System can insert audit logs
INSERT INTO audit_logs (user_id, action_type, ...)
VALUES (auth.uid(), 'Login', ...);
```

---

### 10. System Settings Table

**Who can do what:**

| Action | Who               | Policy          |
| ------ | ----------------- | --------------- |
| SELECT | All authenticated | View settings   |
| ALL    | System admin      | Modify settings |
| ALL    | Service role      | Full access     |

**Example:**

```sql
-- ✅ Anyone can view system settings
SELECT * FROM system_settings;

-- ❌ Regular user cannot modify settings
UPDATE system_settings SET value = 'hacked' WHERE key = 'site_name';

-- ✅ System admin can modify settings
-- (if they have System Administrator role)
```

---

### 11. Metadata Analytics Tables

**Who can do what:**

| Action        | Who          | Policy             |
| ------------- | ------------ | ------------------ |
| SELECT        | Org members  | View org analytics |
| SELECT        | System admin | View all analytics |
| INSERT/UPDATE | System       | Track analytics    |
| ALL           | Service role | Full access        |

**Example:**

```sql
-- ✅ Org member can view their org's analytics
SELECT * FROM metadata_analytics_summary mas
WHERE EXISTS (
    SELECT 1 FROM metadata_records mr
    JOIN user_organizations uo ON uo.organization_id = mr.organization_id
    WHERE mr.id = mas.metadata_record_id
    AND uo.user_id = auth.uid()
);

-- ❌ Regular user cannot view other org analytics
SELECT * FROM metadata_analytics_summary;

-- ✅ System admin can view all analytics
-- (if they have System Administrator role)
```

---

### 12. Newsletter Subscriptions Table

**Who can do what:**

| Action | Who                | Policy                  |
| ------ | ------------------ | ----------------------- |
| INSERT | Anyone (anon/auth) | Subscribe to newsletter |
| SELECT | System admin       | View all subscriptions  |
| ALL    | Service role       | Full access             |

**Example:**

```sql
-- ✅ Anyone can subscribe (even not logged in)
INSERT INTO newsletter_subscriptions (email, source)
VALUES ('user@example.com', 'footer');

-- ❌ Regular user cannot view subscriptions
SELECT * FROM newsletter_subscriptions;

-- ✅ System admin can view subscriptions
-- (if they have System Administrator role)
```

---

## 🔧 Helper Functions

Three helper functions make policies easier to write:

### 1. is_system_admin(user_id)

```sql
-- Check if user is system administrator
SELECT is_system_admin(auth.uid()::text);
```

### 2. is_node_officer(user_id, org_id)

```sql
-- Check if user is node officer for an organization
SELECT is_node_officer(auth.uid()::text, 'org-uuid');
```

### 3. is_org_member(user_id, org_id)

```sql
-- Check if user is member of an organization
SELECT is_org_member(auth.uid()::text, 'org-uuid');
```

---

## 🧪 Testing RLS Policies

### Test as Specific User

```sql
-- Set role to authenticated
SET ROLE authenticated;

-- Set user ID
SET request.jwt.claims.sub = 'user-id-here';

-- Run your query
SELECT * FROM metadata_records;

-- Reset
RESET ROLE;
```

### Test Policy Effectiveness

```sql
-- This should return only data the user can access
SELECT * FROM metadata_records;

-- This should fail if user doesn't have permission
UPDATE metadata_records SET title = 'Hacked' WHERE id = 'some-id';
```

---

## 🚨 Common Issues & Solutions

### Issue: "Permission Denied"

**Cause:** User doesn't have required role or membership

**Solution:** Check user roles and organization membership

```sql
-- Check user roles
SELECT r.name FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'user-id';

-- Check org membership
SELECT o.name FROM user_organizations uo
JOIN organizations o ON uo.organization_id = o.id
WHERE uo.user_id = 'user-id';
```

### Issue: "No Data Returned"

**Cause:** RLS policy filtering out data

**Solution:** Verify user has access

```sql
-- Check if metadata is published
SELECT status FROM metadata_records WHERE id = 'record-id';

-- Check if user is creator
SELECT creator_user_id FROM metadata_records WHERE id = 'record-id';

-- Check if user is in org
SELECT organization_id FROM metadata_records WHERE id = 'record-id';
```

### Issue: "Service Role Queries Failing"

**Cause:** Using anon key instead of service role key

**Solution:** Use service role key in server-side code

```typescript
// ❌ Wrong - uses anon key
const supabase = createClient(url, anonKey)

// ✅ Correct - uses service role key (server-side only!)
const supabase = createClient(url, serviceRoleKey)
```

---

## 📊 Policy Decision Flow

```
User makes request
    ↓
Is user authenticated?
    ↓ No → Use anon policies
    ↓ Yes
    ↓
Check applicable policies:
    ↓
1. Is data public? (e.g., published metadata)
    ↓ Yes → Allow
    ↓ No
    ↓
2. Is user the owner? (e.g., creator_user_id = user_id)
    ↓ Yes → Allow
    ↓ No
    ↓
3. Is user in same organization?
    ↓ Yes → Allow (if org member policy exists)
    ↓ No
    ↓
4. Is user system admin?
    ↓ Yes → Allow
    ↓ No
    ↓
5. Is this service role?
    ↓ Yes → Allow
    ↓ No
    ↓
Deny access
```

---

## 🎯 Best Practices

### 1. Always Use Service Role for Backend Operations

```typescript
// Server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role
)
```

### 2. Use Anon/Auth Key for Client Operations

```typescript
// Client-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Anon key
)
```

### 3. Test Policies Thoroughly

- Test as different user roles
- Test with different data ownership
- Test edge cases

### 4. Monitor Policy Performance

```sql
-- Check if policies are causing slowdowns
SELECT schemaname, tablename, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Migration Guide](./database-security-migration-guide.md)
- [Quick Reference](./QUICK_REFERENCE.md)

---

_RLS Policies Guide v1.0 | 2025-01-11_
