"use client"

import React, { useState } from "react"
import { ClerkUser } from "@/actions/clerk-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  MoreHorizontal,
  Edit,
  Mail,
  UserX,
  ShieldAlert,
  Eye,
  CheckSquare,
  Download,
  Ban
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import EditUserRolesDialog from "./edit-user-roles-dialog"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { hasPermission } from "@/lib/rbac"
import { useToast } from "@/components/ui/use-toast"

interface UserListProps {
  users: ClerkUser[]
  className?: string
}

export default function UserList({ users, className }: UserListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ClerkUser | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)

  const handleEditRolesClick = (user: ClerkUser) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsEditDialogOpen(false)
    setSelectedUser(null)
  }

  const handleUpdateSuccess = () => {
    router.refresh()
    handleDialogClose()
  }

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map(user => user.id))
    }
    setIsAllSelected(!isAllSelected)
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        const newIds = prev.filter(id => id !== userId)
        setIsAllSelected(false)
        return newIds
      } else {
        const newIds = [...prev, userId]
        setIsAllSelected(newIds.length === users.length)
        return newIds
      }
    })
  }

  // Bulk actions - these would be connected to actual actions in a real implementation
  const handleBulkAction = (action: string) => {
    if (selectedUserIds.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to perform this action.",
        variant: "destructive"
      })
      return
    }

    // Demo implementation - would connect to actual actions
    toast({
      title: `${action} action requested`,
      description: `Action would affect ${selectedUserIds.length} selected users.`,
      variant: "default"
    })

    // Reset selection after action
    setSelectedUserIds([])
    setIsAllSelected(false)
  }

  if (!users || users.length === 0) {
    return (
      <div className={`text-center py-10 ${className}`}>
        <p className="text-muted-foreground">No users found.</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border shadow-sm ${className}`}>
      {selectedUserIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedUserIds.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUserIds([])
                setIsAllSelected(false)
              }}
            >
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("Export")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export selected user data</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("Email")}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Email selected users</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction("Suspend")}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    <span>Suspend</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Suspend selected users</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] pl-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all users"
              />
            </TableHead>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow
              key={user.id}
              className={selectedUserIds.includes(user.id) ? "bg-muted/50" : ""}
            >
              <TableCell className="pl-4">
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => toggleSelectUser(user.id)}
                  aria-label={`Select ${user.firstName} ${user.lastName}`}
                />
              </TableCell>
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.imageUrl}
                    alt={user.firstName || "User"}
                  />
                  <AvatarFallback>
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                {user.username && (
                  <div className="text-xs text-muted-foreground">
                    @{user.username}
                  </div>
                )}
              </TableCell>
              <TableCell>{user.emailAddress}</TableCell>
              <TableCell>
                {user.databaseRole ? (
                  <Badge variant="secondary">{user.databaseRole}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">User Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleEditRolesClick(user)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/system-users/${user.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Admin Actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem className="text-amber-600">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Force Password Reset
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <EditUserRolesDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}
