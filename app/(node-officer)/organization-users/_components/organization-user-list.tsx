"use client"

import { useState, useTransition } from "react"
import { OrganizationUser } from "@/actions/db/node-officer-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit3, Trash2, Edit } from "lucide-react"
import { AddUserDialog } from "./add-user-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ManageOrganizationUserRolesDialog } from "./manage-organization-user-roles-dialog"
import { RemoveUserFromOrgDialog } from "./remove-user-from-org-dialog"

interface OrganizationUserListClientProps {
  initialUsers: OrganizationUser[]
  orgId: string
}

export default function OrganizationUserListClient({
  initialUsers,
  orgId
}: OrganizationUserListClientProps) {
  const [users, setUsers] = useState<OrganizationUser[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [selectedUserForRoles, setSelectedUserForRoles] =
    useState<OrganizationUser | null>(null)
  const [isManageRolesDialogOpen, setIsManageRolesDialogOpen] = useState(false)
  const [selectedUserForRemoval, setSelectedUserForRemoval] =
    useState<OrganizationUser | null>(null)
  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false)

  const handleDataRefresh = () => {
    startRefreshTransition(() => {
      router.refresh()
      // toast.info("User list is being refreshed...") // Let's remove this for now, can be too noisy
    })
  }

  const handleOpenManageRolesDialog = (user: OrganizationUser) => {
    setSelectedUserForRoles(user)
    setIsManageRolesDialogOpen(true)
  }

  const handleOpenRemoveUserDialog = (user: OrganizationUser) => {
    setSelectedUserForRemoval(user)
    setIsRemoveUserDialogOpen(true)
  }

  const filteredUsers = users.filter(
    user =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // This effect synchronizes the local 'users' state with 'initialUsers' prop.
  // It's important if the parent component can pass updated 'initialUsers'.
  if (JSON.stringify(initialUsers) !== JSON.stringify(users)) {
    setUsers(initialUsers)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <AddUserDialog orgId={orgId} onUserAdded={handleDataRefresh} />
      </div>

      {isRefreshing && (
        <p className="text-center text-slate-500 p-4">
          Refreshing user list...
        </p>
      )}

      {!isRefreshing && filteredUsers.length === 0 && searchTerm && (
        <p className="text-center text-slate-500">
          No users found matching your search term.
        </p>
      )}
      {!isRefreshing && initialUsers.length === 0 && !searchTerm && (
        <p className="text-center text-slate-500">
          This organization currently has no users.
        </p>
      )}

      {!isRefreshing && filteredUsers.length > 0 && (
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Org Role</TableHead>
                <TableHead>System Roles</TableHead>
                <TableHead>Joined Org At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.clerkId}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.imageUrl}
                          alt={user.firstName || "User"}
                        />
                        <AvatarFallback>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {user.clerkId}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {user.emailAddress}
                  </TableCell>
                  <TableCell>
                    {user.organizationRole ? (
                      <Badge variant="default">
                        {user.organizationRole
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className="capitalize"
                        >
                          {role.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <Badge variant="outline">No specific roles</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {user.joinedOrganizationAt
                      ? new Date(user.joinedOrganizationAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenManageRolesDialog(user)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Manage Roles (MC/MA)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 hover:!text-red-600 hover:!bg-red-50"
                          onClick={() => handleOpenRemoveUserDialog(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from Organization
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedUserForRoles && (
        <ManageOrganizationUserRolesDialog
          orgId={orgId}
          user={selectedUserForRoles}
          isOpen={isManageRolesDialogOpen}
          onOpenChange={setIsManageRolesDialogOpen}
          onRolesUpdated={() => {
            handleDataRefresh()
            setSelectedUserForRoles(null) // Clear selection after update
          }}
        />
      )}

      {selectedUserForRemoval && (
        <RemoveUserFromOrgDialog
          orgId={orgId}
          user={selectedUserForRemoval}
          isOpen={isRemoveUserDialogOpen}
          onOpenChange={setIsRemoveUserDialogOpen}
          onUserRemoved={() => {
            handleDataRefresh()
            setSelectedUserForRemoval(null)
          }}
        />
      )}
    </div>
  )
}
