"use client"

import { useState } from "react"
import { AdminOrganizationView } from "@/db/schema/organizations-schema"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Users,
  FileEdit
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { deleteOrganizationAction } from "@/actions/db/organizations-actions"
import EditOrganizationDialog from "../edit-organization-dialog"
import AssignNodeOfficerDialog from "./assign-node-officer-dialog"
import StatusBadge from "./status-badge"

interface OrganizationDataTableProps {
  organizations: AdminOrganizationView[]
  className?: string
}

export default function OrganizationDataTable({
  organizations,
  className
}: OrganizationDataTableProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State for dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNodeOfficerDialogOpen, setIsNodeOfficerDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] =
    useState<AdminOrganizationView | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)

  // Handle row selection
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(organizations.map(org => org.id))
    }
    setIsAllSelected(!isAllSelected)
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const newIds = prev.filter(orgId => orgId !== id)
        setIsAllSelected(false)
        return newIds
      } else {
        const newIds = [...prev, id]
        setIsAllSelected(newIds.length === organizations.length)
        return newIds
      }
    })
  }

  // Edit organization
  const handleEdit = (organization: AdminOrganizationView) => {
    setSelectedOrganization(organization)
    setIsEditDialogOpen(true)
  }

  // Assign Node Officer
  const handleAssignNodeOfficer = (organization: AdminOrganizationView) => {
    setSelectedOrganization(organization)
    setIsNodeOfficerDialogOpen(true)
  }

  // Delete organization
  const handleDeleteClick = (organization: AdminOrganizationView) => {
    setSelectedOrganization(organization)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedOrganization) return

    const result = await deleteOrganizationAction(selectedOrganization.id)
    if (result.isSuccess) {
      toast({
        title: "Success",
        description: result.message
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }
    setSelectedOrganization(null)
    setDeleteConfirmOpen(false)
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) {
      toast({
        title: "No organizations selected",
        description: "Please select at least one organization.",
        variant: "destructive"
      })
      return
    }

    // Demo implementation - would connect to actual bulk actions
    toast({
      title: `${action} requested`,
      description: `Action would affect ${selectedIds.length} selected organizations.`
    })

    // Reset selection
    setSelectedIds([])
    setIsAllSelected(false)
  }

  // Success handlers for dialogs
  const handleEditSuccess = () => {
    router.refresh()
    setIsEditDialogOpen(false)
    setSelectedOrganization(null)
  }

  const handleNodeOfficerSuccess = () => {
    router.refresh()
    setIsNodeOfficerDialogOpen(false)
    setSelectedOrganization(null)
  }

  if (!organizations.length) {
    return (
      <div className={`rounded-md border p-8 text-center ${className}`}>
        <Building className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No Organizations Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No organizations match your current filter criteria.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-md border ${className}`}>
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedIds.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedIds([])
                setIsAllSelected(false)
              }}
            >
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("Export")}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction("Delete")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all organizations"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Node Officer</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map(org => (
            <TableRow
              key={org.id}
              className={selectedIds.includes(org.id) ? "bg-muted/50" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(org.id)}
                  onCheckedChange={() => toggleSelectRow(org.id)}
                  aria-label={`Select ${org.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">{org.name}</div>
                {org.description && (
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {org.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={org.status} />
              </TableCell>
              <TableCell>
                <div className="text-sm">{org.primaryContactName || "N/A"}</div>
                {org.primaryContactEmail && (
                  <div className="text-xs text-muted-foreground">
                    {org.primaryContactEmail}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{org.memberCount || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                {org.nodeOfficerName ? (
                  <div className="text-sm">{org.nodeOfficerName}</div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Not Assigned
                  </div>
                )}
              </TableCell>
              <TableCell>
                {new Date(org.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(org)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAssignNodeOfficer(org)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Node Officer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/admin/organizations/${org.id}`)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(org)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Organization Dialog */}
      {selectedOrganization && isEditDialogOpen && (
        <EditOrganizationDialog
          organization={selectedOrganization}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Assign Node Officer Dialog */}
      {selectedOrganization && isNodeOfficerDialogOpen && (
        <AssignNodeOfficerDialog
          organization={selectedOrganization}
          open={isNodeOfficerDialogOpen}
          onOpenChange={setIsNodeOfficerDialogOpen}
          onRefresh={handleNodeOfficerSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {selectedOrganization && (
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the organization &quot;
                {selectedOrganization.name}&quot; and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
