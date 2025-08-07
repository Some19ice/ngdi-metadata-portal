"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
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
import { getOrganizationUsersForNOPaginatedAction } from "@/actions/db/node-officer-actions"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"

interface OrganizationUserListClientProps {
  initialUsers?: OrganizationUser[]
  orgId: string
}

export default function OrganizationUserListClient({
  initialUsers = [],
  orgId
}: OrganizationUserListClientProps) {
  const [users, setUsers] = useState<OrganizationUser[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [userCounts, setUserCounts] = useState({
    metadataCreator: 0,
    metadataApprover: 0,
    nodeOfficer: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedUserForRoles, setSelectedUserForRoles] =
    useState<OrganizationUser | null>(null)
  const [isManageRolesDialogOpen, setIsManageRolesDialogOpen] = useState(false)
  const [selectedUserForRemoval, setSelectedUserForRemoval] =
    useState<OrganizationUser | null>(null)
  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false)

  const pageSize = 10

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Load users with proper error handling and state management
  const loadUsers = useCallback(
    async (page: number = 1, searchQuery?: string) => {
      setIsLoading(true)
      try {
        const result = await getOrganizationUsersForNOPaginatedAction(
          orgId,
          page,
          pageSize,
          searchQuery
        )

        if (result.isSuccess && result.data) {
          setUsers(result.data.users)
          setTotalUsers(result.data.total)
          setTotalPages(Math.ceil(result.data.total / pageSize))
          setUserCounts(result.data.counts)
          setCurrentPage(page)
        } else {
          toast.error(result.message || "Failed to load users")
          // Don't clear existing data on error
        }
      } catch (error) {
        console.error("Error loading users:", error)
        toast.error("Failed to load users")
      } finally {
        setIsLoading(false)
      }
    },
    [orgId, pageSize]
  )

  // Load users when search term changes (reset to page 1)
  useEffect(() => {
    loadUsers(1, debouncedSearchTerm || undefined)
  }, [debouncedSearchTerm, loadUsers])

  // Load users when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadUsers(currentPage, debouncedSearchTerm || undefined)
    }
  }, [currentPage, loadUsers])

  // Initial load if no initial users provided
  useEffect(() => {
    if (initialUsers.length === 0) {
      loadUsers(1)
    } else {
      // Set initial state from props
      setUsers(initialUsers)
      setTotalUsers(initialUsers.length)
      setTotalPages(Math.ceil(initialUsers.length / pageSize))
    }
  }, [orgId, initialUsers, loadUsers])

  const handleDataRefresh = useCallback(() => {
    loadUsers(currentPage, debouncedSearchTerm || undefined)
  }, [loadUsers, currentPage, debouncedSearchTerm])

  const handleOpenManageRolesDialog = (user: OrganizationUser) => {
    setSelectedUserForRoles(user)
    setIsManageRolesDialogOpen(true)
  }

  const handleOpenRemoveUserDialog = (user: OrganizationUser) => {
    setSelectedUserForRemoval(user)
    setIsRemoveUserDialogOpen(true)
  }

  const handleCloseManageRolesDialog = useCallback(
    (wasUpdated = false) => {
      setSelectedUserForRoles(null)
      setIsManageRolesDialogOpen(false)

      // Only refresh if changes were made
      if (wasUpdated) {
        handleDataRefresh()
      }
    },
    [handleDataRefresh]
  )

  const handleCloseRemoveUserDialog = useCallback(
    (wasRemoved = false) => {
      setSelectedUserForRemoval(null)
      setIsRemoveUserDialogOpen(false)

      // Only refresh if a user was actually removed
      if (wasRemoved) {
        handleDataRefresh()
      }
    },
    [handleDataRefresh]
  )

  const handleUserAdded = useCallback(() => {
    // Refresh the user list when a new user is added
    handleDataRefresh()
  }, [handleDataRefresh])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-background border rounded-lg p-4">
          <div className="text-2xl font-bold">{userCounts.total}</div>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-2xl font-bold">{userCounts.metadataCreator}</div>
          <p className="text-xs text-muted-foreground">Metadata Creators</p>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {userCounts.metadataApprover}
          </div>
          <p className="text-xs text-muted-foreground">Metadata Approvers</p>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="text-2xl font-bold">{userCounts.nodeOfficer}</div>
          <p className="text-xs text-muted-foreground">Node Officers</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
          disabled={isLoading}
        />
        <AddUserDialog orgId={orgId} onUserAdded={handleUserAdded} />
      </div>

      {isLoading && users.length === 0 && (
        <p className="text-center text-slate-500 p-4">Loading users...</p>
      )}

      {!isLoading && users.length === 0 && searchTerm && (
        <p className="text-center text-slate-500">
          No users found matching your search term.
        </p>
      )}
      {!isLoading && users.length === 0 && !searchTerm && (
        <p className="text-center text-slate-500">
          This organization currently has no users.
        </p>
      )}

      {users.length > 0 && (
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
              {users.map(user => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <PaginationInfo
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalUsers}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            disabled={isLoading || isPending}
          />
        </div>
      )}

      {isLoading && users.length > 0 && (
        <div className="text-center py-2 text-muted-foreground text-sm">
          Loading...
        </div>
      )}

      {selectedUserForRoles && (
        <ManageOrganizationUserRolesDialog
          orgId={orgId}
          user={selectedUserForRoles}
          isOpen={isManageRolesDialogOpen}
          onOpenChange={setIsManageRolesDialogOpen}
          onRolesUpdated={() => {
            handleCloseManageRolesDialog(true)
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
            handleCloseRemoveUserDialog(true)
          }}
        />
      )}
    </div>
  )
}
