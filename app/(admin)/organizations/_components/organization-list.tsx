"use client"

import { useState } from "react"
import { SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import EditOrganizationDialog from "./edit-organization-dialog"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { deleteOrganizationAction } from "@/actions/db/organizations-actions"
import { useToast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"

interface OrganizationListProps {
  organizations: SelectOrganization[]
  className?: string
}

export default function OrganizationList({
  organizations,
  className
}: OrganizationListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] =
    useState<SelectOrganization | null>(null)
  const [deletingOrganization, setDeletingOrganization] =
    useState<SelectOrganization | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const handleEditClick = (organization: SelectOrganization) => {
    setEditingOrganization(organization)
    setIsEditDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsEditDialogOpen(false)
    setEditingOrganization(null)
  }

  const handleEditSuccess = () => {
    router.refresh()
    handleDialogClose()
  }

  const handleDeleteClick = (organization: SelectOrganization) => {
    setDeletingOrganization(organization)
  }

  const confirmDelete = async () => {
    if (!deletingOrganization) return

    const result = await deleteOrganizationAction(deletingOrganization.id)
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
    setDeletingOrganization(null) // Close dialog
  }

  if (organizations.length === 0) {
    return <p className={className}>No organizations found.</p>
  }

  return (
    <>
      <ul className={`space-y-4 ${className}`}>
        {organizations.map(org => (
          <li
            key={org.id}
            className="flex items-center justify-between rounded-md border bg-white p-4 shadow-sm"
          >
            <div className="flex-grow">
              <h3 className="font-semibold">{org.name}</h3>
              <p className="text-sm text-gray-600">
                ID: {org.id} | Contact: {org.primaryContactName || "N/A"} (
                {org.primaryContactEmail || "N/A"})
              </p>
              <p className="text-sm text-gray-500">
                Phone: {org.primaryContactPhone || "N/A"}
              </p>
            </div>
            <div className="ml-4 flex flex-shrink-0 items-center space-x-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${org.status === "active" ? "bg-green-100 text-green-700" : org.status === "pending_approval" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
              >
                {org.status
                  ? org.status.charAt(0).toUpperCase() +
                    org.status.slice(1).replace("_", " ")
                  : "N/A"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditClick(org)}
              >
                Edit
              </Button>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(org)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
            </div>
          </li>
        ))}
      </ul>

      {editingOrganization && (
        <EditOrganizationDialog
          organization={editingOrganization}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingOrganization && (
        <AlertDialog
          open={!!deletingOrganization}
          onOpenChange={isOpen => !isOpen && setDeletingOrganization(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                organization "{deletingOrganization.name}" and all associated
                data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingOrganization(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
