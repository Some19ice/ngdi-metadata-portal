"use client"

import { useState, useTransition } from "react"
import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { PlusCircle, Eye, Edit2, MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"
import { deleteMetadataRecordAction } from "@/actions/db/metadata-records-actions"
import EditMetadataRecordDialog from "../[recordId]/_components/edit-metadata-record-dialog"

interface MetadataRecordWithOptionalOrganization extends SelectMetadataRecord {
  organization?: SelectOrganization | null
}

interface MetadataListClientProps {
  initialRecords: MetadataRecordWithOptionalOrganization[]
  errorLoading?: boolean
}

export default function MetadataListClient({
  initialRecords,
  errorLoading = false
}: MetadataListClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isPending, startTransition] = useTransition()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] =
    useState<MetadataRecordWithOptionalOrganization | null>(null)

  const filteredRecords = initialRecords.filter(
    record =>
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.abstract &&
        record.abstract.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateNew = () => {
    router.push("/metadata/create")
  }

  const handleViewRecord = (recordId: string) => {
    router.push(`/metadata/${recordId}`)
  }

  const handleOpenEditDialog = (
    record: MetadataRecordWithOptionalOrganization
  ) => {
    setSelectedRecord(record)
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (
    record: MetadataRecordWithOptionalOrganization
  ) => {
    setSelectedRecord(record)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedRecord) return

    startTransition(async () => {
      const promise = deleteMetadataRecordAction(selectedRecord.id)

      toast.promise(promise, {
        loading: "Deleting metadata record...",
        success: result => {
          setIsDeleteDialogOpen(false)
          setSelectedRecord(null)
          if (result.isSuccess) {
            router.refresh()
            return "Metadata record deleted successfully!"
          } else {
            throw new Error(result.message || "Failed to delete.")
          }
        },
        error: err => {
          return err.message || "An unexpected error occurred."
        }
      })
    })
  }

  if (errorLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive text-lg">
          Failed to load metadata records.
        </p>
        <p className="text-muted-foreground">
          There was an error fetching the data. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search by title, abstract, or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Record
          </Button>
        </div>

        {filteredRecords.length === 0 && !errorLoading && (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">
              No metadata records found.
            </p>
            {initialRecords.length > 0 && searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search term.
              </p>
            )}
            {initialRecords.length === 0 && !searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating a new metadata record.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecords.map(record => (
            <Card key={record.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {record.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewRecord(record.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenEditDialog(record)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenDeleteDialog(record)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-xs text-muted-foreground pt-1">
                  ID: {record.id.substring(0, 8)}...
                  {record.organization?.name && (
                    <>
                      {" "}
                      / Org: {record.organization.name.substring(0, 15)}
                      {record.organization.name.length > 15 ? "..." : ""}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Status: </span>
                  <Badge
                    variant={
                      record.status === "Published"
                        ? "default"
                        : record.status === "Draft"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
                {record.organizationId && (
                  <div>
                    <span className="font-semibold">Organization ID: </span>
                    {record.organizationId.substring(0, 8)}...
                  </div>
                )}
                <div>
                  <span className="font-semibold">Last Updated: </span>
                  {new Date(record.updatedAt).toLocaleDateString()}
                </div>
                {record.abstract && (
                  <p className="text-muted-foreground line-clamp-3 pt-1">
                    {record.abstract}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewRecord(record.id)}
                >
                  <Eye className="mr-2 h-3 w-3" /> View Details
                </Button>
                {(record.status === "Draft" ||
                  record.status === "Needs Revision") && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenEditDialog(record)}
                  >
                    <Edit2 className="mr-2 h-3 w-3" /> Edit
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {selectedRecord && isEditDialogOpen && (
        <EditMetadataRecordDialog
          record={selectedRecord}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            router.refresh()
            setSelectedRecord(null)
          }}
        />
      )}

      {selectedRecord && isDeleteDialogOpen && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                metadata record "<strong>{selectedRecord.title}</strong>".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedRecord(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
