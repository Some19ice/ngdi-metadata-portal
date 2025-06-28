"use server"

import { notFound } from "next/navigation"
import { clerkClient } from "@clerk/nextjs/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  CalendarDays,
  Mail,
  Shield,
  Building2,
  CheckCircle,
  XCircle
} from "lucide-react"
import { getUserRoles } from "@/lib/rbac"
import { db } from "@/db/db"
import { userOrganizationsTable } from "@/db/schema"
import { eq } from "drizzle-orm"

interface UserDetailsContentProps {
  userId: string
}

export default async function UserDetailsContent({
  userId
}: UserDetailsContentProps) {
  let user
  let userRoles: string[] = []
  let userOrganizations: any[] = []

  try {
    // Get user data from Clerk
    const clerk = await clerkClient()
    user = await clerk.users.getUser(userId)

    // Get user roles from database
    userRoles = await getUserRoles(userId)

    // Get user organizations
    userOrganizations = await db.query.userOrganizations.findMany({
      where: eq(userOrganizationsTable.userId, userId),
      with: {
        organization: true
      }
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    notFound()
  }

  if (!user) {
    notFound()
  }

  const primaryEmail = user.emailAddresses.find(
    email => email.id === user.primaryEmailAddressId
  )
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim()
  const displayName = fullName || primaryEmail?.emailAddress || "Unknown User"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.imageUrl} alt={fullName} />
          <AvatarFallback className="text-lg">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">{primaryEmail?.emailAddress}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="font-medium">{fullName || "Not provided"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <p className="font-medium">{user.username || "Not set"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User ID
                  </label>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Sign In
                  </label>
                  <p className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Verified
                  </label>
                  <p className="flex items-center gap-1">
                    {primaryEmail?.verification?.status === "verified" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        Not Verified
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Email Addresses */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email Addresses
                </label>
                <div className="space-y-2 mt-1">
                  {user.emailAddresses.map(email => (
                    <div
                      key={email.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {email.emailAddress}
                      </span>
                      <div className="flex gap-2">
                        {email.id === user.primaryEmailAddressId && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                        {email.verification?.status === "verified" ? (
                          <Badge variant="default">Verified</Badge>
                        ) : (
                          <Badge variant="destructive">Unverified</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Roles Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userRoles.length > 0 ? (
                <div className="space-y-2">
                  {userRoles.map(role => (
                    <Badge key={role} variant="outline" className="block w-fit">
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No roles assigned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userOrganizations.length > 0 ? (
                <div className="space-y-3">
                  {userOrganizations.map(userOrg => (
                    <div key={userOrg.organizationId} className="space-y-1">
                      <p className="font-medium">
                        {userOrg.organization?.name || "Unknown Organization"}
                      </p>
                      {userOrg.role && (
                        <Badge variant="secondary" className="text-xs">
                          {userOrg.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No organization memberships
                </p>
              )}
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                {user.banned ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Banned</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Active</span>
                  </>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Updated: {new Date(user.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
