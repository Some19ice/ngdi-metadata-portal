import { SelectUserRole, InsertUserRole } from "@/db/schema"
import { SelectRole, InsertRole } from "@/db/schema"
import { SelectPermission, InsertPermission } from "@/db/schema"

// Re-export database types for convenience
export type { SelectUserRole, InsertUserRole }
export type { SelectRole, InsertRole }
export type { SelectPermission, InsertPermission }

// User status types
export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification"

// User with role and organization information
export interface SystemUser {
  id: string // Clerk user ID
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  status: UserStatus
  lastSignIn?: Date | null
  createdAt: Date
  updatedAt: Date
  roles: SystemUserRole[]
  organizations: SystemUserOrganization[]
  permissions: string[]
}

// User role information
export interface SystemUserRole {
  roleId: string
  roleName: string
  assignedAt: Date
  assignedBy?: string | null
}

// User organization information
export interface SystemUserOrganization {
  organizationId: string
  organizationName: string
  role: string
  joinedAt: Date
  isNodeOfficer: boolean
}

// User search and filter types
export interface UserSearchParams {
  query?: string
  role?: string
  status?: UserStatus
  organizationId?: string
  sortBy?: "email" | "firstName" | "lastName" | "createdAt" | "lastSignIn"
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

// User list item for admin interface
export interface UserListItem {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  status: UserStatus
  lastSignIn?: Date | null
  roleCount: number
  organizationCount: number
  primaryRole?: string | null
  primaryOrganization?: string | null
}

// User invitation data
export interface UserInvitation {
  email: string
  firstName?: string
  lastName?: string
  roleIds: string[]
  organizationId?: string
  organizationRole?: string
  message?: string
}

// User role assignment
export interface UserRoleAssignment {
  userId: string
  roleId: string
  assignedBy: string
  expiresAt?: Date | null
}

// User management statistics
export interface UserManagementStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  suspendedUsers: number
  pendingUsers: number
  usersLastWeek: number
  usersLastMonth: number
}

// User activity log
export interface UserActivity {
  id: string
  userId: string
  action: string
  resource?: string | null
  resourceId?: string | null
  details?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
}

// User permission check result
export interface UserPermissionCheck {
  hasPermission: boolean
  reason?: string
  requiredRole?: string
  requiredPermission?: string
}
