"use client"

import { useEffect, useState } from "react"
import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Download,
  CheckCircle2,
  FilePenLine,
  Send,
  XCircle,
  Link as LinkIcon
} from "lucide-react"
import { toast } from "sonner"
import EditMetadataRecordDialog from "./edit-metadata-record-dialog"
import { deleteMetadataRecordAction } from "@/actions/db/metadata-records-actions"
import {
  approveMetadataAction,
  rejectMetadataAction,
  submitForValidationAction,
  resubmitRevisedMetadataAction
} from "@/actions/db/metadata-workflow-actions"
import { Suspense } from "react"
import { trackAnalyticsEventAction } from "@/actions/db/enhanced-metadata-workflow-actions"
import EnhancedPublicMetadataViewer from "./enhanced-public-viewer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

// unified public viewer; map rendering is handled within that component

interface ViewMetadataRecordProps {
  record: SelectMetadataRecord & { organization?: SelectOrganization | null }
  currentUserCanEdit: boolean // Simplified permission check for now
  currentUserCanDelete: boolean // Simplified permission check for now
  // Add more granular permissions as props if needed for workflow actions
  currentUserCanSubmitForValidation: boolean
  currentUserCanApproveReject: boolean
  currentUserCanResubmit: boolean
  analytics?: {
    views: number
    downloads: number
    shares: number
    bookmarks: number
    lastViewed?: string
  }
}

//

// Helper function from metadata-table-columns, consider moving to a shared utils file
async function handleAction(
  action: () => Promise<any>,
  router: ReturnType<typeof useRouter>,
  successMessage: string,
  errorMessage: string,
  redirectPath?: string
) {
  toast.loading("Processing action...")
  const result = await action()
  toast.dismiss()
  if (result.isSuccess) {
    toast.success(successMessage)
    if (redirectPath) {
      router.push(redirectPath)
    } else {
      router.refresh()
    }
  } else {
    toast.error(errorMessage + (result.message ? `: ${result.message}` : ""))
  }
}

export default function ViewMetadataRecord({
  record,
  currentUserCanEdit,
  currentUserCanDelete,
  currentUserCanSubmitForValidation,
  currentUserCanApproveReject,
  currentUserCanResubmit,
  analytics
}: ViewMetadataRecordProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [localAnalytics, setLocalAnalytics] = useState(
    analytics || { views: 0, downloads: 0, shares: 0, bookmarks: 0 }
  )
  // unified view only

  //

  const handleEdit = () => {
    setIsEditDialogOpen(true)
  }

  const handleDelete = async () => {
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    const promise = deleteMetadataRecordAction(record.id)

    toast.promise(promise, {
      loading: "Deleting metadata record...",
      success: result => {
        setIsDeleting(false)
        if (result.isSuccess) {
          setIsDeleteDialogOpen(false)
          router.push("/metadata")
          router.refresh()
          return "Metadata record deleted successfully!"
        } else {
          throw new Error(result.message)
        }
      },
      error: err => {
        setIsDeleting(false)
        return err.message || "Failed to delete metadata record."
      }
    })
  }

  //

  // Track a view on mount (best-effort)
  useEffect(() => {
    ;(async () => {
      try {
        await trackAnalyticsEventAction({
          recordId: record.id,
          eventType: "view"
        })
        setLocalAnalytics(prev => ({ ...prev, views: (prev.views || 0) + 1 }))
      } catch (e) {
        // Ignore failures silently
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id])

  // Unified export/download helper
  async function handleExport(format: "json" | "xml" | "csv" | "iso19139") {
    try {
      const res = await fetch(`/api/metadata/${record.id}?format=${format}`)
      if (!res.ok) throw new Error("Export failed")

      if (format === "json") {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json"
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `metadata-${record.id}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const text = await res.text()
        const mime =
          format === "xml" || format === "iso19139"
            ? "application/xml"
            : "text/csv"
        const blob = new Blob([text], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `metadata-${record.id}.${
          format === "iso19139" ? "xml" : format
        }`
        a.click()
        URL.revokeObjectURL(url)
      }

      await trackAnalyticsEventAction({
        recordId: record.id,
        eventType: "export",
        metadata: { format }
      })
    } catch (e) {
      toast.error("Failed to export")
    }
  }

  //

  const renderWorkflowActions = () => {
    switch (record.status) {
      case "Draft":
      case "Needs Revision":
        if (currentUserCanSubmitForValidation || currentUserCanResubmit) {
          const actionToCall =
            record.status === "Draft"
              ? submitForValidationAction
              : resubmitRevisedMetadataAction
          const buttonText =
            record.status === "Draft"
              ? "Submit for Validation"
              : "Resubmit Revision"
          const Icon = record.status === "Draft" ? Send : FilePenLine
          return (
            <Button
              onClick={() =>
                handleAction(
                  () => actionToCall(record.id),
                  router,
                  `Record ${record.status === "Draft" ? "submitted" : "resubmitted"} successfully.`,
                  `Failed to ${record.status === "Draft" ? "submit" : "resubmit"} record.`
                )
              }
              variant="outline"
              className="mr-2"
            >
              <Icon className="mr-2 h-4 w-4" /> {buttonText}
            </Button>
          )
        }
        return null
      case "Pending Validation":
        if (currentUserCanApproveReject) {
          return (
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  // TODO: Implement dialog for approval notes
                  handleAction(
                    () => approveMetadataAction(record.id, "Approved via UI."), // Placeholder notes
                    router,
                    "Record approved successfully.",
                    "Failed to approve record."
                  )
                }}
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                onClick={() => {
                  const reason = prompt(
                    "Please provide a reason for rejection:"
                  )
                  if (reason !== null && reason.trim() !== "") {
                    handleAction(
                      () => rejectMetadataAction(record.id, reason),
                      router,
                      "Record rejected and sent for revision.",
                      "Failed to reject record."
                    )
                  }
                }}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          )
        }
        return null
      default:
        return null
    }
  }

  //

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <div className="flex items-center gap-2">
            {/* TODO: Add RBAC check for edit button visibility/disabled state */}
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            {/* TODO: Add RBAC check for delete button visibility/disabled state */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />{" "}
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the metadata record "<strong>{record.title}</strong>".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete record"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Top Bar: Quick actions and analytics badges */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {record.downloadUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  try {
                    await trackAnalyticsEventAction({
                      recordId: record.id,
                      eventType: "download"
                    })
                    setLocalAnalytics(prev => ({
                      ...prev,
                      downloads: (prev.downloads || 0) + 1
                    }))
                    window.open(record.downloadUrl!, "_blank")
                  } catch (e) {
                    window.open(record.downloadUrl!, "_blank")
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: record.title,
                      url: window.location.href
                    })
                  } else {
                    await navigator.clipboard.writeText(window.location.href)
                    toast.success("Link copied to clipboard!")
                  }
                  await trackAnalyticsEventAction({
                    recordId: record.id,
                    eventType: "share"
                  })
                  setLocalAnalytics(prev => ({
                    ...prev,
                    shares: (prev.shares || 0) + 1
                  }))
                } catch (e) {
                  // ignore
                }
              }}
            >
              <Globe className="mr-2 h-4 w-4" /> Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href)
                toast.success("URL copied")
              }}
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FilePenLine className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xml")}>
                  XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("iso19139")}>
                  ISO 19139
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              Views: {localAnalytics.views || 0}
            </Badge>
            <Badge variant="secondary">
              Downloads: {localAnalytics.downloads || 0}
            </Badge>
            <Badge variant="secondary">
              Shares: {localAnalytics.shares || 0}
            </Badge>
            <Badge variant="secondary">
              Bookmarks: {localAnalytics.bookmarks || 0}
            </Badge>
          </div>
        </div>

        <EnhancedPublicMetadataViewer record={record as any} />
        {renderWorkflowActions() && (
          <div className="flex justify-end">{renderWorkflowActions()}</div>
        )}
      </div>

      {record && (
        <EditMetadataRecordDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          record={record}
          onSuccess={() => {
            toast.success("Record updated. View will refresh.")
            // Refresh is handled by the dialog itself or here if preferred
            router.refresh()
          }}
        />
      )}
    </>
  )
}
