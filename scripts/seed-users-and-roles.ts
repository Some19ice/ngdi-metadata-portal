/*
 * This script seeds the database with roles and adds test users with those roles
 * It can be used to initialize a fresh database or add test users
 * Run with: npx tsx scripts/seed-users-and-roles.ts
 */

import { db } from "@/db/db"
import {
  rolesTable,
  roleEnum,
  userRolesTable,
  permissionsTable,
  rolePermissionsTable
} from "@/db/schema"
import { clerkClient as getClerkClient } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { config } from "dotenv"

// Ensure environment variables are loaded
config({ path: ".env.local" })

// Initialize Clerk API key from environment
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  console.error(
    "CLERK_SECRET_KEY is not set in the environment. Please set it in .env.local"
  )
  process.exit(1)
}

// Define roles with descriptions
const roles = [
  { name: "System Administrator", description: "Full control over the system" },
  {
    name: "Node Officer",
    description: "Manages an organization, its users, and metadata workflow"
  },
  {
    name: "Metadata Creator",
    description: "Can create and manage metadata within their organization"
  },
  {
    name: "Metadata Approver",
    description:
      "Can review and approve/reject metadata within their organization"
  },
  { name: "Registered User", description: "Standard authenticated user" }
]

// Define basic permissions - extend these based on your specific needs
const permissions = [
  {
    action: "manage",
    subject: "users",
    description: "Full control over users"
  },
  { action: "view", subject: "users", description: "View user information" },
  { action: "manage", subject: "roles", description: "Can manage roles" },
  {
    action: "manage",
    subject: "organizations",
    description: "Can manage organizations"
  },
  {
    action: "view",
    subject: "organizations",
    description: "Can view organizations"
  },
  {
    action: "manage",
    subject: "metadata",
    description: "Full control over metadata"
  },
  { action: "create", subject: "metadata", description: "Can create metadata" },
  { action: "view", subject: "metadata", description: "Can view metadata" },
  {
    action: "approve",
    subject: "metadata",
    description: "Can approve metadata"
  },
  { action: "view", subject: "auditLogs", description: "Can view audit logs" },
  {
    action: "access",
    subject: "admin_dashboard",
    description: "Can access the admin dashboard"
  }
]

// Define role-permission relationships
const rolePermissions = {
  "System Administrator": [
    "manage:users",
    "view:users",
    "manage:roles",
    "manage:organizations",
    "view:organizations",
    "manage:metadata",
    "create:metadata",
    "view:metadata",
    "approve:metadata",
    "view:auditLogs",
    "access:admin_dashboard"
  ],
  "Node Officer": [
    "view:users",
    "view:organizations",
    "manage:organizations",
    "view:metadata",
    "approve:metadata"
  ],
  "Metadata Creator": ["create:metadata", "view:metadata"],
  "Metadata Approver": ["view:metadata", "approve:metadata"],
  "Registered User": ["view:metadata", "view:organizations"]
}

// Test users to create
const testUsers = [
  {
    email: "admin@example.com",
    password: "S3cur3@dm1nP@55w0rd!",
    firstName: "Admin",
    lastName: "User",
    role: "System Administrator",
    username: "admin"
  },
  {
    email: "nodeofficer@example.com",
    password: "N0d3Off1c3r@2024!",
    firstName: "Node",
    lastName: "Officer",
    role: "Node Officer",
    username: "nodeofficer"
  },
  {
    email: "creator@example.com",
    password: "Cr3@t0rP@55w0rd!2024",
    firstName: "Metadata",
    lastName: "Creator",
    role: "Metadata Creator",
    username: "creator"
  },
  {
    email: "approver@example.com",
    password: "@ppr0v3r$3cur3P@55!",
    firstName: "Metadata",
    lastName: "Approver",
    role: "Metadata Approver",
    username: "approver"
  },
  {
    email: "user@example.com",
    password: "R3gul@rUs3r!2024$",
    firstName: "Regular",
    lastName: "User",
    role: "Registered User",
    username: "user"
  }
]

async function seedRoles() {
  console.log("Seeding roles...")

  try {
    // Clear existing roles if needed (be careful in production)
    //await db.delete(rolesTable)

    // For each role in our predefined list
    for (const role of roles) {
      const roleName = role.name as (typeof roleEnum.enumValues)[number]

      // Check if role already exists
      const existingRole = await db
        .select()
        .from(rolesTable)
        .where(eq(rolesTable.name, roleName))
        .limit(1)

      if (existingRole.length === 0) {
        // Role doesn't exist, insert it
        await db.insert(rolesTable).values({
          name: roleName,
          description: role.description
        })
        console.log(`✅ Created role: ${role.name}`)
      } else {
        console.log(`ℹ️ Role already exists: ${role.name}`)
      }
    }

    console.log("✅ Roles seeded successfully")
  } catch (error) {
    console.error("❌ Error seeding roles:", error)
    throw error
  }
}

async function seedPermissions() {
  console.log("Seeding permissions...")

  try {
    // Clear existing permissions if needed (be careful in production)
    //await db.delete(permissionsTable)

    // For each permission in our predefined list
    for (const permission of permissions) {
      // Check if permission already exists
      const existingPermission = await db
        .select()
        .from(permissionsTable)
        .where(
          and(
            eq(permissionsTable.action, permission.action),
            eq(permissionsTable.subject, permission.subject)
          )
        )
        .limit(1)

      if (existingPermission.length === 0) {
        // Permission doesn't exist, insert it
        await db.insert(permissionsTable).values({
          action: permission.action,
          subject: permission.subject,
          description: permission.description
        })
        console.log(
          `✅ Created permission: ${permission.action}:${permission.subject}`
        )
      } else {
        console.log(
          `ℹ️ Permission already exists: ${permission.action}:${permission.subject}`
        )
      }
    }

    console.log("✅ Permissions seeded successfully")
  } catch (error) {
    console.error("❌ Error seeding permissions:", error)
    throw error
  }
}

async function seedRolePermissions() {
  console.log("Seeding role-permission relationships...")

  try {
    // Get all roles and permissions to map IDs
    const dbRoles = await db.select().from(rolesTable)
    const dbPermissions = await db.select().from(permissionsTable)

    // Create a map for quick lookups
    const roleMap = new Map(dbRoles.map(role => [role.name, role.id]))
    const permissionMap = new Map(
      dbPermissions.map(perm => [`${perm.action}:${perm.subject}`, perm.id])
    )

    // For each role in our rolePermissions mapping
    for (const [roleName, permissionKeys] of Object.entries(rolePermissions)) {
      const roleId = roleMap.get(
        roleName as (typeof roleEnum.enumValues)[number]
      )

      if (!roleId) {
        console.warn(`⚠️ Role not found: ${roleName}, skipping permissions`)
        continue
      }

      // For each permission key assigned to this role
      for (const permKey of permissionKeys) {
        const permId = permissionMap.get(permKey)

        if (!permId) {
          console.warn(`⚠️ Permission not found: ${permKey}, skipping`)
          continue
        }

        // Check if relationship already exists
        const existingRelation = await db
          .select()
          .from(rolePermissionsTable)
          .where(
            and(
              eq(rolePermissionsTable.roleId, roleId),
              eq(rolePermissionsTable.permissionId, permId)
            )
          )
          .limit(1)

        if (existingRelation.length === 0) {
          // Relationship doesn't exist, create it
          await db.insert(rolePermissionsTable).values({
            roleId,
            permissionId: permId
          })
          console.log(`✅ Added permission ${permKey} to role ${roleName}`)
        } else {
          console.log(
            `ℹ️ Permission ${permKey} already assigned to role ${roleName}`
          )
        }
      }
    }

    console.log("✅ Role-permission relationships seeded successfully")
  } catch (error) {
    console.error("❌ Error seeding role-permissions:", error)
    throw error
  }
}

async function seedUsers() {
  console.log("Seeding test users...")

  try {
    // Initialize Clerk client
    const clerk = await getClerkClient()

    // Get all roles to map IDs
    const dbRoles = await db.select().from(rolesTable)
    const roleMap = new Map(dbRoles.map(role => [role.name, role.id]))

    // For each test user in our predefined list
    for (const user of testUsers) {
      const roleName = user.role as (typeof roleEnum.enumValues)[number]

      // Check if user exists in Clerk
      const existingUsers = await clerk.users.getUserList({
        emailAddress: [user.email]
      })

      let clerkUser

      if (existingUsers.data.length === 0) {
        // User doesn't exist, create in Clerk
        clerkUser = await clerk.users.createUser({
          emailAddress: [user.email],
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          publicMetadata: {
            role: user.role // Store role in metadata
          }
        })
        console.log(`✅ Created user in Clerk: ${user.email}`)
      } else {
        clerkUser = existingUsers.data[0]
        console.log(`ℹ️ User already exists in Clerk: ${user.email}`)

        // Update public metadata with role if needed
        if (
          !clerkUser.publicMetadata?.role ||
          clerkUser.publicMetadata.role !== user.role
        ) {
          await clerk.users.updateUserMetadata(clerkUser.id, {
            publicMetadata: {
              role: user.role
            }
          })
          console.log(`✅ Updated role for user ${user.email} to ${user.role}`)
        }
      }

      // Now handle the role assignment in our database
      const roleId = roleMap.get(roleName)

      if (!roleId) {
        console.warn(
          `⚠️ Role not found: ${user.role}, skipping role assignment`
        )
        continue
      }

      // Check if user role already exists in our DB
      const existingUserRole = await db
        .select()
        .from(userRolesTable)
        .where(eq(userRolesTable.userId, clerkUser.id))
        .limit(1)

      if (existingUserRole.length === 0) {
        // User role doesn't exist, create it
        await db.insert(userRolesTable).values({
          userId: clerkUser.id,
          roleId
        })
        console.log(
          `✅ Assigned role ${user.role} to user ${user.email} in database`
        )
      } else {
        // Update existing role if different
        if (existingUserRole[0].roleId !== roleId) {
          await db
            .update(userRolesTable)
            .set({ roleId })
            .where(eq(userRolesTable.userId, clerkUser.id))
          console.log(
            `✅ Updated role for user ${user.email} to ${user.role} in database`
          )
        } else {
          console.log(
            `ℹ️ User ${user.email} already has role ${user.role} in database`
          )
        }
      }
    }

    console.log("✅ Users seeded successfully")
  } catch (error) {
    console.error("❌ Error seeding users:", error)
    throw error
  }
}

async function main() {
  try {
    console.log("Starting database seeding...")

    // Seed in order: first roles, then permissions, then role-permission relationships, then users
    await seedRoles()
    await seedPermissions()
    await seedRolePermissions()
    await seedUsers()

    console.log("✅ Database seeding completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Database seeding failed:", error)
    process.exit(1)
  }
}

// Run the seed function
main()
