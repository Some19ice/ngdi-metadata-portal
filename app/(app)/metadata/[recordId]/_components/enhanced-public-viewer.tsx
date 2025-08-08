"use client"

import { useState } from "react"
import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Share2,
  Eye,
  Calendar,
  MapPin,
  Building,
  Tag,
  FileText,
  Database,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Heart,
  BookmarkPlus
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { transformDatabaseRecordToMapRecord } from "@/lib/map-utils"
import { MapErrorBoundary } from "@/components/ui/map/map-error-boundary"

// Lazy-load the map to avoid any SSR/hydration issues
const MetadataMapDisplay = dynamic(
  () => import("@/components/ui/map/metadata-map-display"),
  { ssr: false }
)

interface MetadataRecord extends SelectMetadataRecord {
  organization?: SelectOrganization | null
}

interface EnhancedPublicViewerProps {
  record: MetadataRecord
}

export default function EnhancedPublicMetadataViewer({
  record
}: EnhancedPublicViewerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isBookmarked, setIsBookmarked] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.share({
        title: record.title,
        text: record.abstract,
        url: window.location.href
      })
    } catch (error) {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(
      isBookmarked ? "Removed from bookmarks" : "Added to bookmarks"
    )
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success("URL copied to clipboard!")
  }

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Not specified"
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return format(date, "PPP")
  }

  const spatialInfo = record.spatialInfo as any
  const temporalInfo = record.temporalInfo as any
  const technicalInfo = record.technicalDetailsInfo as any
  const distributionInfo = record.distributionInfo as any
  const constraintsInfo = record.constraintsInfo as any
  const dataQualityInfo = record.dataQualityInfo as any
  const processingInfo = record.processingInfo as any

  // Prepare map-ready record (if spatial bounds exist)
  const mapRecord = transformDatabaseRecordToMapRecord(record)
  const mapRecords = mapRecord ? [mapRecord] : []

  // Derived display fields aligned with schema
  const formTypeFormat = record.formTypeDistributionFormat as {
    name?: string
    version?: string
  } | null
  const distributionFormatDisplay =
    distributionInfo?.distributionFormat ||
    (formTypeFormat?.name
      ? `${formTypeFormat.name} ${formTypeFormat.version || ""}`.trim()
      : null)

  const MetadataHeroSection = () => (
    <Card className="mb-6">
      <CardHeader className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {record.dataType}
              </Badge>
              <Badge
                variant={
                  record.status === "Published" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {record.status}
              </Badge>
              {record.frameworkType && (
                <Badge variant="secondary" className="text-xs">
                  {record.frameworkType}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {record.title}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {record.abstract}
            </p>
          </div>

          {/* Thumbnail */}
          {record.thumbnailUrl && (
            <div className="flex-shrink-0">
              <img
                src={record.thumbnailUrl}
                alt={`${record.title} thumbnail`}
                className="w-48 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {record.organization?.name || "Unknown Organization"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Updated {formatDate(record.updatedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">1,234 views</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {(distributionInfo?.downloadUrl || record.downloadUrl) && (
            <Button asChild>
              <Link
                href={(distributionInfo?.downloadUrl || record.downloadUrl)!}
                target="_blank"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Data
              </Link>
            </Button>
          )}

          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button variant="outline" onClick={handleBookmark}>
            {isBookmarked ? (
              <Heart className="h-4 w-4 mr-2 fill-current" />
            ) : (
              <BookmarkPlus className="h-4 w-4 mr-2" />
            )}
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </Button>

          <Button variant="outline" onClick={handleCopyUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </CardHeader>
    </Card>
  )

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Details */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Purpose
              </label>
              <p className="text-sm mt-1">
                {record.purpose || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Language
              </label>
              <p className="text-sm mt-1">{record.language || "English"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Version
              </label>
              <p className="text-sm mt-1">{record.version || "1.0"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Update Frequency
              </label>
              <p className="text-sm mt-1">
                {record.updateFrequency || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      {record.keywords && record.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {record.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">456</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm text-muted-foreground">Citations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">23</div>
              <div className="text-sm text-muted-foreground">Bookmarks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p className="text-sm mt-1">
              {record.contactName || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-sm mt-1">
              {record.contactEmail || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Phone
            </label>
            <p className="text-sm mt-1">
              {record.contactPhone || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Address
            </label>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {record.contactAddress || "Not specified"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              DOI
            </label>
            <p className="text-sm mt-1 break-all">
              {record.doi || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Licence
            </label>
            <p className="text-sm mt-1">{record.licence || "Not specified"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Internal Notes
            </label>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {record.internalNotes || "Not specified"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const SpatialTab = () => (
    <div className="space-y-6">
      {/* Spatial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Spatial Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Coordinate System
              </label>
              <p className="text-sm mt-1">
                {spatialInfo?.coordinateSystem || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Projection
              </label>
              <p className="text-sm mt-1">
                {spatialInfo?.projection || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Datum
              </label>
              <p className="text-sm mt-1">
                {spatialInfo?.datum || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Resolution/Scale
              </label>
              <p className="text-sm mt-1">
                {spatialInfo?.resolutionScale || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bounding Box */}
      {spatialInfo?.boundingBox && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Extent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  North
                </label>
                <p className="text-sm mt-1">
                  {spatialInfo.boundingBox.northBoundingCoordinate}°
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  South
                </label>
                <p className="text-sm mt-1">
                  {spatialInfo.boundingBox.southBoundingCoordinate}°
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  East
                </label>
                <p className="text-sm mt-1">
                  {spatialInfo.boundingBox.eastBoundingCoordinate}°
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  West
                </label>
                <p className="text-sm mt-1">
                  {spatialInfo.boundingBox.westBoundingCoordinate}°
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map</CardTitle>
        </CardHeader>
        <CardContent>
          {mapRecords.length > 0 ? (
            <div className="h-[500px] w-full rounded-lg overflow-hidden">
              <MapErrorBoundary level="section" showDetails={false}>
                <MetadataMapDisplay
                  key={`map-${record.id}`}
                  records={mapRecords}
                  showBoundingBoxes={true}
                />
              </MapErrorBoundary>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No spatial extent available
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const TechnicalTab = () => (
    <div className="space-y-6">
      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                File Format
              </label>
              <p className="text-sm mt-1">
                {technicalInfo?.fileFormat || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                File Size
              </label>
              <p className="text-sm mt-1">
                {technicalInfo?.fileSizeMB
                  ? `${technicalInfo.fileSizeMB} MB`
                  : "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Features/Layers
              </label>
              <p className="text-sm mt-1">
                {technicalInfo?.numFeaturesOrLayers || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Software Requirements
              </label>
              <p className="text-sm mt-1">
                {technicalInfo?.softwareHardwareRequirements || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality */}
      {dataQualityInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Data Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataQualityInfo.completenessReport && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Completeness
                </label>
                <p className="text-sm mt-1">
                  {dataQualityInfo.completenessReport}
                </p>
              </div>
            )}
            {dataQualityInfo.logicalConsistencyReport && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Logical Consistency
                </label>
                <p className="text-sm mt-1">
                  {dataQualityInfo.logicalConsistencyReport}
                </p>
              </div>
            )}
            {dataQualityInfo.attributeAccuracyReport && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Attribute Accuracy
                </label>
                <p className="text-sm mt-1">
                  {dataQualityInfo.attributeAccuracyReport}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const AccessTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribution Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {distributionFormatDisplay || "Not specified"}
          </p>
        </CardContent>
      </Card>
      {/* Access Information */}
      <Card>
        <CardHeader>
          <CardTitle>Data Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(distributionInfo?.downloadUrl || record.downloadUrl) && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Direct Download</h4>
                <p className="text-sm text-muted-foreground">
                  Download the complete dataset
                </p>
              </div>
              <Button asChild>
                <Link
                  href={(distributionInfo?.downloadUrl || record.downloadUrl)!}
                  target="_blank"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Link>
              </Button>
            </div>
          )}

          {(distributionInfo?.apiEndpoint || record.apiEndpoint) && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">API Access</h4>
                <p className="text-sm text-muted-foreground">
                  Access data via API endpoint
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link
                  href={(distributionInfo?.apiEndpoint || record.apiEndpoint)!}
                  target="_blank"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  API Docs
                </Link>
              </Button>
            </div>
          )}

          {!distributionInfo?.downloadUrl && !distributionInfo?.apiEndpoint && (
            <div className="text-center p-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2" />
              <p>Access information not available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Licensing & Constraints */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Rights & Constraints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(distributionInfo?.licenseInfo?.licenseType ||
            record.licenseType) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                License
              </label>
              <p className="text-sm mt-1">
                {distributionInfo?.licenseInfo?.licenseType ||
                  record.licenseType}
              </p>
            </div>
          )}
          {(distributionInfo?.licenseInfo?.usageTerms || record.usageTerms) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Usage Terms
              </label>
              <p className="text-sm mt-1">
                {distributionInfo?.licenseInfo?.usageTerms || record.usageTerms}
              </p>
            </div>
          )}
          {(distributionInfo?.licenseInfo?.accessRestrictions ||
            record.accessRestrictions) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Access Restrictions
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Array.isArray(
                  distributionInfo?.licenseInfo?.accessRestrictions
                )
                  ? distributionInfo!.licenseInfo!.accessRestrictions!.map(
                      (r: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {r}
                        </Badge>
                      )
                    )
                  : Array.isArray(record.accessRestrictions)
                    ? (record.accessRestrictions as unknown as string[]).map(
                        (r: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {r}
                          </Badge>
                        )
                      )
                    : null}
              </div>
            </div>
          )}
          {constraintsInfo?.accessConstraints && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Access Constraints
              </label>
              <p className="text-sm mt-1">
                {constraintsInfo.accessConstraints}
              </p>
            </div>
          )}
          {constraintsInfo?.useConstraints && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Use Constraints
              </label>
              <p className="text-sm mt-1">{constraintsInfo.useConstraints}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const LineageTab = () => (
    <div className="space-y-6">
      {/* Processing Information */}
      {processingInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Processing History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processingInfo.processingStepsDescription && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Processing Steps
                </label>
                <p className="text-sm mt-1">
                  {processingInfo.processingStepsDescription}
                </p>
              </div>
            )}
            {processingInfo.softwareAndVersionUsed && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Software Used
                </label>
                <p className="text-sm mt-1">
                  {processingInfo.softwareAndVersionUsed}
                </p>
              </div>
            )}
            {processingInfo.processedDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Processing Date
                </label>
                <p className="text-sm mt-1">
                  {formatDate(processingInfo.processedDate)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Temporal Information */}
      {temporalInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Temporal Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temporalInfo.dateFrom && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </label>
                  <p className="text-sm mt-1">
                    {formatDate(temporalInfo.dateFrom)}
                  </p>
                </div>
              )}
              {temporalInfo.dateTo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    End Date
                  </label>
                  <p className="text-sm mt-1">
                    {formatDate(temporalInfo.dateTo)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Important Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Production Date
              </label>
              <p className="text-sm mt-1">
                {formatDate(record.productionDate)}
              </p>
            </div>
            {record.publicationDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Publication Date
                </label>
                <p className="text-sm mt-1">
                  {formatDate(record.publicationDate)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-sm mt-1">{formatDate(record.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="text-sm mt-1">{formatDate(record.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <MetadataHeroSection />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spatial">Spatial</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="access">Access & Use</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="spatial" className="mt-6">
          <SpatialTab />
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
          <TechnicalTab />
        </TabsContent>

        <TabsContent value="access" className="mt-6">
          <AccessTab />
        </TabsContent>

        <TabsContent value="lineage" className="mt-6">
          <LineageTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
