"use client"

import { useState } from "react"
import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Globe,
  Download,
  CheckCircle2,
  FilePenLine,
  Send,
  XCircle,
  MapPin,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import EditMetadataRecordDialog from "./edit-metadata-record-dialog"
import { deleteMetadataRecordAction } from "@/actions/db/metadata-records-actions"
import Link from "next/link"
import {
  approveMetadataAction,
  rejectMetadataAction,
  submitForValidationAction,
  resubmitRevisedMetadataAction
} from "@/actions/db/metadata-workflow-actions"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { LatLngBoundsExpression } from "leaflet"
import { Suspense } from "react"

// Dynamically import the map component
const BasicMapDisplay = dynamic(
  () => import("@/components/ui/basic-map-display"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-md" /> // Simple skeleton loader for the map
  }
)

interface ViewMetadataRecordProps {
  record: SelectMetadataRecord & { organization?: SelectOrganization | null }
  currentUserCanEdit: boolean // Simplified permission check for now
  currentUserCanDelete: boolean // Simplified permission check for now
  // Add more granular permissions as props if needed for workflow actions
  currentUserCanSubmitForValidation: boolean
  currentUserCanApproveReject: boolean
  currentUserCanResubmit: boolean
}

const DetailItem: React.FC<{
  label: string
  value?: string | number | null | string[]
  isBadge?: boolean
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  isList?: boolean
}> = ({ label, value, isBadge, badgeVariant = "secondary", isList }) => {
  if (value === null || typeof value === "undefined" || value === "")
    return null
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      {isBadge && typeof value === "string" ? (
        <Badge variant={badgeVariant}>{value}</Badge>
      ) : isList && Array.isArray(value) ? (
        <ul className="list-disc list-inside">
          {value.map((item, index) => (
            <li key={index} className="text-sm text-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground break-words">
          {typeof value === "number" ? value : String(value)}
        </p>
      )}
    </div>
  )
}

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
  currentUserCanResubmit
}: ViewMetadataRecordProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Extract spatial info once for reuse
  const spatialInfo = record.spatialInfo as any
  const boundingBox = spatialInfo?.boundingBox
  const temporalInfo = record.temporalInfo as any

  // Prepare display for formTypeDistributionFormat
  const formatInfo = record.formTypeDistributionFormat as {
    name?: string
    version?: string
  } | null
  const distributionFormatDisplay = formatInfo?.name
    ? `${formatInfo.name} ${formatInfo.version || ""}`.trim()
    : null

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

  const handleViewOnMap = () => {
    const sLat = parseFloat(boundingBox?.southBoundingCoordinate || "")
    const nLat = parseFloat(boundingBox?.northBoundingCoordinate || "")
    const wLng = parseFloat(boundingBox?.westBoundingCoordinate || "")
    const eLng = parseFloat(boundingBox?.eastBoundingCoordinate || "")

    if (!isNaN(sLat) && !isNaN(nLat) && !isNaN(wLng) && !isNaN(eLng)) {
      const mapUrl = `https://www.openstreetmap.org/#map=5/${(sLat + nLat) / 2}/${(wLng + eLng) / 2}&bbox=${wLng},${sLat},${eLng},${nLat}`
      window.open(mapUrl, "_blank")
    } else {
      toast.info("Spatial extent not fully defined or invalid for map view.")
    }
  }

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Published":
      case "Approved":
        return "default" // Visually, this is often the primary/positive color
      case "Pending Validation":
      case "Needs Revision":
        return "secondary" // A neutral or slightly warning tone
      case "Draft":
        return "outline"
      case "Archived":
        return "destructive"
      default:
        return "secondary"
    }
  }

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

  // Safely access nested properties for distribution format
  const distributionFormat = record.formTypeDistributionFormat as
    | { name?: string; version?: string }
    | undefined
  const distributionFormatName = distributionFormat?.name || "N/A"
  const distributionFormatVersion = distributionFormat?.version || "N/A"

  // Prepare bounds for the map
  let mapBounds: LatLngBoundsExpression | null = null

  if (boundingBox) {
    const sLat = parseFloat(boundingBox.southBoundingCoordinate || "")
    const nLat = parseFloat(boundingBox.northBoundingCoordinate || "")
    const wLng = parseFloat(boundingBox.westBoundingCoordinate || "")
    const eLng = parseFloat(boundingBox.eastBoundingCoordinate || "")

    if (!isNaN(sLat) && !isNaN(nLat) && !isNaN(wLng) && !isNaN(eLng)) {
      mapBounds = [
        [sLat, wLng],
        [nLat, eLng]
      ]
    }
  }

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

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <div>
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate">{record.title}</CardTitle>
                  {record.status && (
                    <Badge
                      variant={getStatusBadgeVariant(record.status)}
                      className="ml-2 whitespace-nowrap"
                    >
                      {record.status}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  ID: {record.id}
                </CardDescription>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 pt-1 md:pt-0 flex-shrink-0">
                {record.organization && (
                  <DetailItem
                    label="Organization"
                    value={record.organization.name}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            {/* Section: General Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3">
                General Information
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <DetailItem label="Abstract" value={record.abstract} />
                <DetailItem label="Purpose" value={record.purpose} />
                <DetailItem label="Dataset Type" value={record.dataType} />
                <DetailItem label="Author" value={record.author} />
                <DetailItem
                  label="Framework Type"
                  value={record.frameworkType}
                />
                <DetailItem
                  label="Keywords"
                  value={(record.keywords as string[] | null) ?? []}
                  isList={true}
                />
                <DetailItem label="Thumbnail URL" value={record.thumbnailUrl} />
                <DetailItem label="Image Name" value={record.imageName} />
                <DetailItem
                  label="Record Creator ID"
                  value={record.creatorUserId}
                />
              </div>
            </section>

            <Separator />

            {/* Section: Spatial Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Spatial Information
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <DetailItem
                  label="West Bound Longitude"
                  value={boundingBox?.westBoundingCoordinate}
                />
                <DetailItem
                  label="East Bound Longitude"
                  value={boundingBox?.eastBoundingCoordinate}
                />
                <DetailItem
                  label="South Bound Latitude"
                  value={boundingBox?.southBoundingCoordinate}
                />
                <DetailItem
                  label="North Bound Latitude"
                  value={boundingBox?.northBoundingCoordinate}
                />
                <DetailItem
                  label="Coordinate System"
                  value={spatialInfo?.coordinateSystem}
                />
                <DetailItem
                  label="Projection Name"
                  value={spatialInfo?.projectionName}
                />
                <DetailItem
                  label="Spatial Resolution"
                  value={spatialInfo?.spatialResolution}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewOnMap}
                className="mt-3"
                disabled={
                  !(
                    boundingBox?.westBoundingCoordinate &&
                    boundingBox?.eastBoundingCoordinate &&
                    boundingBox?.southBoundingCoordinate &&
                    boundingBox?.northBoundingCoordinate
                  )
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" /> View on OpenStreetMap
              </Button>
            </section>

            <Separator />

            {/* Section: Temporal Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Temporal Information
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <DetailItem
                  label="Production Date"
                  value={
                    record.productionDate
                      ? new Date(record.productionDate).toLocaleDateString()
                      : null
                  }
                />
                <DetailItem
                  label="Date From"
                  value={
                    temporalInfo?.dateFrom
                      ? new Date(temporalInfo.dateFrom).toLocaleDateString()
                      : null
                  }
                />
                <DetailItem
                  label="Date To"
                  value={
                    temporalInfo?.dateTo
                      ? new Date(temporalInfo.dateTo).toLocaleDateString()
                      : null
                  }
                />
                <DetailItem
                  label="Update Frequency"
                  value={record.updateFrequency}
                />
              </div>
            </section>

            <Separator />

            {/* Section: Distribution Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Distribution Information
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <DetailItem
                  label="Distribution Format"
                  value={distributionFormatDisplay}
                />
                <DetailItem label="Access Method" value={record.accessMethod} />
                <DetailItem label="Download URL" value={record.downloadUrl} />
                <DetailItem label="API Endpoint" value={record.apiEndpoint} />
                <DetailItem label="License Type" value={record.licenseType} />
                <DetailItem label="Usage Terms" value={record.usageTerms} />
                <DetailItem label="File Format" value={record.fileFormat} />
              </div>
              {record.downloadUrl && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(record.downloadUrl!, "_blank")}
                  className="mt-3"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Data
                </Button>
              )}
            </section>

            <Separator />

            {/* Section: Interactive Map */}
            {boundingBox &&
              boundingBox.westBoundingCoordinate &&
              boundingBox.eastBoundingCoordinate &&
              boundingBox.southBoundingCoordinate &&
              boundingBox.northBoundingCoordinate && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Spatial Extent</h3>
                  <div className="h-64 w-full rounded-md overflow-hidden border">
                    <Suspense fallback={<Skeleton className="h-full w-full" />}>
                      <BasicMapDisplay
                        bounds={mapBounds}
                        style={{ height: "350px", width: "100%" }}
                      />
                    </Suspense>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleViewOnMap}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on OpenStreetMap
                  </Button>
                </div>
              )}

            <Separator />

            <section>
              <h2 className="text-lg font-semibold mb-3">Administrative</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <DetailItem
                  label="Last Updated"
                  value={new Date(record.updatedAt).toLocaleString()}
                />
                <DetailItem
                  label="Created At"
                  value={new Date(record.createdAt).toLocaleString()}
                />
                {record.publicationDate && (
                  <DetailItem
                    label="Publication Date"
                    value={new Date(
                      record.publicationDate
                    ).toLocaleDateString()}
                  />
                )}
              </div>
            </section>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {renderWorkflowActions()}
          </CardFooter>
        </Card>
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
