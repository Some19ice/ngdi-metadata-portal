-- ============================================================================
-- Database Security and Performance Improvements
-- ============================================================================
-- This migration addresses critical security and performance issues identified
-- by Supabase database linter
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================
-- These indexes will significantly improve query performance for joins and lookups

-- Metadata Analytics
CREATE INDEX IF NOT EXISTS idx_metadata_analytics_metadata_record_id 
ON metadata_analytics(metadata_record_id);

-- Metadata Change Logs
CREATE INDEX IF NOT EXISTS idx_metadata_change_logs_metadata_record_id 
ON metadata_change_logs(metadata_record_id);

-- Metadata Records
CREATE INDEX IF NOT EXISTS idx_metadata_records_organization_id 
ON metadata_records(organization_id);

CREATE INDEX IF NOT EXISTS idx_metadata_records_creator_user_id 
ON metadata_records(creator_user_id);

-- Metadata Validation Rules
CREATE INDEX IF NOT EXISTS idx_metadata_validation_rules_metadata_standard_id 
ON metadata_validation_rules(metadata_standard_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id 
ON notifications(organization_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications(is_read);

-- Role Permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id 
ON role_permissions(permission_id);

-- User Organizations
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id 
ON user_organizations(organization_id);

-- User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id 
ON user_roles(role_id);

-- ============================================================================
-- PART 2: REMOVE DUPLICATE INDEXES
-- ============================================================================

-- Permissions table: Keep unique_action_subject, drop permissions_action_subject_idx
DROP INDEX IF EXISTS permissions_action_subject_idx;

-- System Settings table: Keep primary key, drop redundant index
DROP INDEX IF EXISTS system_settings_key_idx;

-- ============================================================================
-- PART 3: REMOVE UNUSED INDEX
-- ============================================================================

-- Metadata table: Remove unused title index
DROP INDEX IF EXISTS metadata_title_idx;

-- ============================================================================
-- PART 4: FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Fix handle_new_user function to have immutable search_path
-- First, let's check if the function exists and recreate it with proper search_path
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) THEN
        -- Drop and recreate with proper search_path
        DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    END IF;
END $$;

-- Recreate the function with stable search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, image_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'image_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: CREATE RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users can view all users (for mentions, assignments, etc.)
CREATE POLICY "Users can view all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- Service role can do everything
CREATE POLICY "Service role has full access to users"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- PROFILES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view active organizations
CREATE POLICY "Anyone can view active organizations"
ON organizations FOR SELECT
TO authenticated
USING (status = 'active');

-- Node officers can update their organization
CREATE POLICY "Node officers can update their organization"
ON organizations FOR UPDATE
TO authenticated
USING (
    node_officer_id = auth.uid()::text
);

-- System admins can do everything
CREATE POLICY "System admins have full access to organizations"
ON organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to organizations"
ON organizations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- USER_ORGANIZATIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users can view their own organization memberships
CREATE POLICY "Users can view own organization memberships"
ON user_organizations FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Node officers can view their organization's members
CREATE POLICY "Node officers can view organization members"
ON user_organizations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
        AND o.node_officer_id = auth.uid()::text
    )
);

-- System admins can manage all memberships
CREATE POLICY "System admins can manage user organizations"
ON user_organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to user_organizations"
ON user_organizations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA_RECORDS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view published metadata
CREATE POLICY "Anyone can view published metadata"
ON metadata_records FOR SELECT
TO authenticated
USING (status = 'Published');

-- Users can view their own metadata records
CREATE POLICY "Users can view own metadata records"
ON metadata_records FOR SELECT
TO authenticated
USING (creator_user_id = auth.uid()::text);

-- Organization members can view their organization's metadata
CREATE POLICY "Organization members can view org metadata"
ON metadata_records FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.user_id = auth.uid()::text
        AND uo.organization_id = metadata_records.organization_id
    )
);

-- Metadata creators can create records
CREATE POLICY "Metadata creators can create records"
ON metadata_records FOR INSERT
TO authenticated
WITH CHECK (
    creator_user_id = auth.uid()::text
    AND (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()::text
            AND r.name IN ('Metadata Creator', 'Node Officer', 'System Administrator')
        )
    )
);

-- Users can update their own draft/pending records
CREATE POLICY "Users can update own draft records"
ON metadata_records FOR UPDATE
TO authenticated
USING (
    creator_user_id = auth.uid()::text
    AND status IN ('Draft', 'Pending Validation', 'Needs Revision')
);

-- Metadata approvers can update records in their organization
CREATE POLICY "Approvers can update org records"
ON metadata_records FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.user_id = auth.uid()::text
        AND uo.organization_id = metadata_records.organization_id
        AND uo.role IN ('Metadata Approver', 'Node Officer')
    )
);

-- System admins can do everything
CREATE POLICY "System admins have full access to metadata"
ON metadata_records FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata_records"
ON metadata_records FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA_CHANGE_LOGS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users can view change logs for metadata they can access
CREATE POLICY "Users can view change logs for accessible metadata"
ON metadata_change_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM metadata_records mr
        WHERE mr.id = metadata_change_logs.metadata_record_id
        AND (
            mr.status = 'Published'
            OR mr.creator_user_id = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM user_organizations uo
                WHERE uo.user_id = auth.uid()::text
                AND uo.organization_id = mr.organization_id
            )
        )
    )
);

-- System can insert change logs
CREATE POLICY "System can insert change logs"
ON metadata_change_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata_change_logs"
ON metadata_change_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

-- System can create notifications
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to notifications"
ON notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- ROLES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view roles
CREATE POLICY "Anyone can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- Only system admins can modify roles
CREATE POLICY "System admins can manage roles"
ON roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to roles"
ON roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- PERMISSIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view permissions
CREATE POLICY "Anyone can view permissions"
ON permissions FOR SELECT
TO authenticated
USING (true);

-- Only system admins can modify permissions
CREATE POLICY "System admins can manage permissions"
ON permissions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to permissions"
ON permissions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- ROLE_PERMISSIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view role permissions
CREATE POLICY "Anyone can view role permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);

-- Only system admins can modify role permissions
CREATE POLICY "System admins can manage role permissions"
ON role_permissions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to role_permissions"
ON role_permissions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- USER_ROLES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- System admins can view all user roles
CREATE POLICY "System admins can view all user roles"
ON user_roles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Only system admins can modify user roles
CREATE POLICY "System admins can manage user roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to user_roles"
ON user_roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- AUDIT_LOGS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- System admins can view all audit logs
CREATE POLICY "System admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to audit_logs"
ON audit_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- SYSTEM_SETTINGS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view system settings
CREATE POLICY "Anyone can view system settings"
ON system_settings FOR SELECT
TO authenticated
USING (true);

-- Only system admins can modify system settings
CREATE POLICY "System admins can manage system settings"
ON system_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to system_settings"
ON system_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA_STANDARDS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view metadata standards
CREATE POLICY "Anyone can view metadata standards"
ON metadata_standards FOR SELECT
TO authenticated
USING (true);

-- Only system admins can modify metadata standards
CREATE POLICY "System admins can manage metadata standards"
ON metadata_standards FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata_standards"
ON metadata_standards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA_VALIDATION_RULES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can view validation rules
CREATE POLICY "Anyone can view validation rules"
ON metadata_validation_rules FOR SELECT
TO authenticated
USING (true);

-- Only system admins can modify validation rules
CREATE POLICY "System admins can manage validation rules"
ON metadata_validation_rules FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata_validation_rules"
ON metadata_validation_rules FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA_ANALYTICS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- System admins can view analytics
CREATE POLICY "System admins can view analytics"
ON metadata_analytics FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- System can insert analytics
CREATE POLICY "System can insert analytics"
ON metadata_analytics FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata_analytics"
ON metadata_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA_ANALYTICS_SUMMARY TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Organization members can view their metadata analytics
CREATE POLICY "Organization members can view org analytics"
ON metadata_analytics_summary FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM metadata_records mr
        JOIN user_organizations uo ON uo.organization_id = mr.organization_id
        WHERE mr.id = metadata_analytics_summary.metadata_record_id
        AND uo.user_id = auth.uid()::text
    )
);

-- System admins can view all analytics
CREATE POLICY "System admins can view all analytics"
ON metadata_analytics_summary FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- System can update analytics
CREATE POLICY "System can update analytics"
ON metadata_analytics_summary FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata_analytics_summary"
ON metadata_analytics_summary FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- METADATA TABLE POLICIES (Legacy table)
-- ----------------------------------------------------------------------------
-- Everyone can view metadata
CREATE POLICY "Anyone can view metadata"
ON metadata FOR SELECT
TO authenticated
USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to metadata"
ON metadata FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- NEWSLETTER_SUBSCRIPTIONS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscriptions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- System admins can view all subscriptions
CREATE POLICY "System admins can view subscriptions"
ON newsletter_subscriptions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()::text
        AND r.name = 'System Administrator'
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to newsletter_subscriptions"
ON newsletter_subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 7: CREATE HELPER FUNCTIONS FOR PERMISSION CHECKS
-- ============================================================================

-- Function to check if user is system admin
CREATE OR REPLACE FUNCTION is_system_admin(user_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id_param
        AND r.name = 'System Administrator'
    );
END;
$$;

-- Function to check if user is node officer for an organization
CREATE OR REPLACE FUNCTION is_node_officer(user_id_param TEXT, org_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organizations
        WHERE id = org_id_param
        AND node_officer_id = user_id_param
    );
END;
$$;

-- Function to check if user is member of an organization
CREATE OR REPLACE FUNCTION is_org_member(user_id_param TEXT, org_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_organizations
        WHERE user_id = user_id_param
        AND organization_id = org_id_param
    );
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 1. Added 11 indexes on foreign keys for better performance
-- 2. Removed 2 duplicate indexes
-- 3. Removed 1 unused index
-- 4. Fixed handle_new_user function search_path
-- 5. Enabled RLS on all 19 tables
-- 6. Created comprehensive RLS policies for all tables
-- 7. Created helper functions for permission checks
-- ============================================================================
