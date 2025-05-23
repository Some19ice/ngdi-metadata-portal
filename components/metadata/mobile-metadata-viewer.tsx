"use client"

import { useState } from "react"
import { SelectMetadataRecord, SelectOrganization } from "@/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  ExternalLink,
  Copy,
  Heart,
  BookmarkPlus,
  ChevronRight,
  Info,
  Map as MapIcon,
  Settings,
  Clock,
  Shield
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MetadataRecord extends SelectMetadataRecord {
  organization?: SelectOrganization | null
}

interface MobileMetadataViewerProps {
  record: MetadataRecord
  className?: string
}

export default function MobileMetadataViewer({
  record,
  className
}: MobileMetadataViewerProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic"])

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Not specified"
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return format(date, "MMM dd, yyyy")
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: record.title,
          text: record.abstract,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast.error("Failed to share")
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(
      isBookmarked ? "Removed from bookmarks" : "Added to bookmarks"
    )
  }

  const handleDownload = (url: string) => {
    if (url) {
      window.open(url, "_blank")
      toast.success("Download started")
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const spatialInfo = record.spatialInfo as any
  const temporalInfo = record.temporalInfo as any
  const technicalInfo = record.technicalDetailsInfo as any
  const distributionInfo = record.distributionInfo as any
  const constraintsInfo = record.constraintsInfo as any
  const dataQualityInfo = record.dataQualityInfo as any
  const processingInfo = record.processingInfo as any

  // Mobile-specific components
  const QuickActions = () => (
    <div className="grid grid-cols-2 gap-2 p-4 bg-muted/30">
      {distributionInfo?.downloadUrl && (
        <Button
          variant="default"
          size="sm"
          className="h-12"
          onClick={() => handleDownload(distributionInfo.downloadUrl)}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-12"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-12"
        onClick={handleBookmark}
      >
        {isBookmarked ? (
          <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
        ) : (
          <BookmarkPlus className="h-4 w-4 mr-2" />
        )}
        {isBookmarked ? "Saved" : "Save"}
      </Button>

      <Button variant="outline" size="sm" className="h-12" asChild>
        <Link href={`/metadata/${record.id}/analytics`}>
          <Eye className="h-4 w-4 mr-2" />
          Stats
        </Link>
      </Button>
    </div>
  )

  const MetadataSection = ({
    id,
    title,
    icon,
    children,
    isEmpty = false
  }: {
    id: string
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    isEmpty?: boolean
  }) => {
    const isExpanded = expandedSections.includes(id)

    return (
      <Card className="border-0 shadow-none">
        <CardHeader
          className="py-3 px-4 cursor-pointer"
          onClick={() => !isEmpty && toggleSection(id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            {!isEmpty && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </div>
        </CardHeader>

        {!isEmpty && isExpanded && (
          <CardContent className="pt-0 px-4 pb-4">{children}</CardContent>
        )}

        {isEmpty && (
          <CardContent className="pt-0 px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              No information available
            </p>
          </CardContent>
        )}
      </Card>
    )
  }

  const InfoRow = ({
    label,
    value,
    className
  }: {
    label: string
    value: string | number | null
    className?: string
  }) => (
    <div
      className={cn(
        "flex justify-between items-start py-2 border-b border-border/40 last:border-0",
        className
      )}
    >
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-right max-w-[60%] break-words">
        {value || "Not specified"}
      </span>
    </div>
  )

  return (
    <div className={cn("bg-background", className)}>
      {/* Hero Section */}
      <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
        <div className="space-y-3">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {record.dataType}
            </Badge>
            <Badge
              variant={record.status === "Published" ? "default" : "secondary"}
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

          {/* Title */}
          <h1 className="text-xl font-bold leading-tight text-foreground">
            {record.title}
          </h1>

          {/* Organization & Date */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span>{record.organization?.name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(record.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1">
          {/* Basic Information */}
          <MetadataSection
            id="basic"
            title="Basic Information"
            icon={<Info className="h-4 w-4" />}
          >
            <div className="space-y-0">
              <InfoRow label="Abstract" value={record.abstract} />
              <InfoRow label="Purpose" value={record.purpose} />
              <InfoRow label="Language" value={record.language || "English"} />
              <InfoRow label="Version" value={record.version || "1.0"} />
              <InfoRow
                label="Update Frequency"
                value={record.updateFrequency}
              />
            </div>

            {/* Keywords */}
            {record.keywords && record.keywords.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {record.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </MetadataSection>

          <Separator />

          {/* Spatial Information */}
          <MetadataSection
            id="spatial"
            title="Spatial Coverage"
            icon={<MapIcon className="h-4 w-4" />}
            isEmpty={!spatialInfo}
          >
            {spatialInfo && (
              <div className="space-y-0">
                <InfoRow
                  label="Coordinate System"
                  value={spatialInfo.coordinateSystem}
                />
                <InfoRow label="Projection" value={spatialInfo.projection} />
                <InfoRow label="Datum" value={spatialInfo.datum} />
                <InfoRow
                  label="Resolution/Scale"
                  value={spatialInfo.resolutionScale}
                />

                {spatialInfo.boundingBox && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      Geographic Bounds
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground">North:</span>{" "}
                        {spatialInfo.boundingBox.northBoundingCoordinate}°
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground">South:</span>{" "}
                        {spatialInfo.boundingBox.southBoundingCoordinate}°
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground">East:</span>{" "}
                        {spatialInfo.boundingBox.eastBoundingCoordinate}°
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground">West:</span>{" "}
                        {spatialInfo.boundingBox.westBoundingCoordinate}°
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </MetadataSection>

          <Separator />

          {/* Temporal Information */}
          <MetadataSection
            id="temporal"
            title="Temporal Coverage"
            icon={<Clock className="h-4 w-4" />}
            isEmpty={!temporalInfo}
          >
            {temporalInfo && (
              <div className="space-y-0">
                <InfoRow
                  label="Start Date"
                  value={formatDate(temporalInfo.dateFrom)}
                />
                <InfoRow
                  label="End Date"
                  value={formatDate(temporalInfo.dateTo)}
                />
                <InfoRow
                  label="Production Date"
                  value={formatDate(record.productionDate)}
                />
                <InfoRow
                  label="Publication Date"
                  value={formatDate(record.publicationDate)}
                />
              </div>
            )}
          </MetadataSection>

          <Separator />

          {/* Technical Details */}
          <MetadataSection
            id="technical"
            title="Technical Specifications"
            icon={<Settings className="h-4 w-4" />}
            isEmpty={!technicalInfo}
          >
            {technicalInfo && (
              <div className="space-y-0">
                <InfoRow label="File Format" value={technicalInfo.fileFormat} />
                <InfoRow
                  label="File Size"
                  value={
                    technicalInfo.fileSizeMB
                      ? `${technicalInfo.fileSizeMB} MB`
                      : null
                  }
                />
                <InfoRow
                  label="Features/Layers"
                  value={technicalInfo.numFeaturesOrLayers}
                />
                <InfoRow
                  label="Software Requirements"
                  value={technicalInfo.softwareHardwareRequirements}
                />
              </div>
            )}
          </MetadataSection>

          <Separator />

          {/* Access & Rights */}
          <MetadataSection
            id="access"
            title="Access & Rights"
            icon={<Shield className="h-4 w-4" />}
            isEmpty={!distributionInfo && !constraintsInfo}
          >
            {(distributionInfo || constraintsInfo) && (
              <div className="space-y-4">
                {distributionInfo && (
                  <div className="space-y-0">
                    <InfoRow
                      label="License"
                      value={distributionInfo.licenseInfo}
                    />
                    <InfoRow
                      label="Access Method"
                      value={distributionInfo.accessMethod}
                    />

                    {distributionInfo.downloadUrl && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            handleDownload(distributionInfo.downloadUrl)
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Dataset
                        </Button>
                      </div>
                    )}

                    {distributionInfo.apiEndpoint && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link
                            href={distributionInfo.apiEndpoint}
                            target="_blank"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            API Access
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {constraintsInfo && (
                  <div className="space-y-0">
                    <InfoRow
                      label="Access Constraints"
                      value={constraintsInfo.accessConstraints}
                    />
                    <InfoRow
                      label="Use Constraints"
                      value={constraintsInfo.useConstraints}
                    />
                  </div>
                )}
              </div>
            )}
          </MetadataSection>

          <Separator />

          {/* Data Quality */}
          <MetadataSection
            id="quality"
            title="Data Quality"
            icon={<Database className="h-4 w-4" />}
            isEmpty={!dataQualityInfo}
          >
            {dataQualityInfo && (
              <div className="space-y-0">
                <InfoRow
                  label="Completeness"
                  value={dataQualityInfo.completenessReport}
                />
                <InfoRow
                  label="Logical Consistency"
                  value={dataQualityInfo.logicalConsistencyReport}
                />
                <InfoRow
                  label="Attribute Accuracy"
                  value={dataQualityInfo.attributeAccuracyReport}
                />
              </div>
            )}
          </MetadataSection>
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-4 border-t bg-background/95 backdrop-blur">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/metadata/search">
              <Tag className="h-4 w-4 mr-2" />
              More Like This
            </Link>
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Export Options</DrawerTitle>
                <DrawerDescription>
                  Choose a format to export this metadata record
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/api/metadata/${record.id}?format=json`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/api/metadata/${record.id}?format=xml`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as XML
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/api/metadata/${record.id}?format=csv`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/api/metadata/${record.id}?format=iso19139`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as ISO 19139
                  </Link>
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  )
}
