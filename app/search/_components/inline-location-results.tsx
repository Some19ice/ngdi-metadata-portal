import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, AlertCircle, Navigation } from "lucide-react"
import Link from "next/link"
import { geocodeLocationAction } from "@/actions/map-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { GeocodingFeature } from "@/types"

interface InlineLocationResultsProps {
  query: string
  showTitle?: boolean
  maxResults?: number
}

export default function InlineLocationResults({
  query,
  showTitle = true,
  maxResults = 5
}: InlineLocationResultsProps) {
  return (
    <Suspense fallback={<LocationResultsSkeleton showTitle={showTitle} />}>
      <LocationResultsFetcher
        query={query}
        showTitle={showTitle}
        maxResults={maxResults}
      />
    </Suspense>
  )
}

async function LocationResultsFetcher({
  query,
  showTitle,
  maxResults = 5
}: InlineLocationResultsProps) {
  try {
    // Validate inputs
    if (!query?.trim()) {
      return (
        <Card>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Results
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="text-center text-muted-foreground">
              Enter a location to search
            </div>
          </CardContent>
        </Card>
      )
    }

    const result = await geocodeLocationAction({
      searchText: query.trim(),
      limit: Math.min(Math.max(1, maxResults), 10), // Clamp between 1 and 10
      autocomplete: false, // For search results, use full geocoding
      country: "NG" // Limit to Nigeria for this portal
    })

    if (!result.isSuccess) {
      return (
        <Card>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Results
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to search locations: {result.message}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }

    const features = result.data

    if (!features || features.length === 0) {
      return (
        <Card>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Results
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No locations found for "{query}"
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Try searching with different location terms or explore the map
                </p>
                <Button asChild variant="outline">
                  <Link href="/map">
                    <MapPin className="h-4 w-4 mr-2" />
                    Explore Map
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Results ({features.length})
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/map?search=${encodeURIComponent(query)}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Map
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {features.map((feature, index) => (
            <LocationFeatureCard
              key={`${feature.id}-${index}`}
              feature={feature}
            />
          ))}

          {features.length >= maxResults && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/map?search=${encodeURIComponent(query)}`}>
                    <Navigation className="h-4 w-4 mr-2" />
                    View More Results on Map
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("Error in LocationResultsFetcher:", error)

    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Results
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An unexpected error occurred while searching locations. Please try
              again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
}

function LocationFeatureCard({ feature }: { feature: GeocodingFeature }) {
  const coordinates = feature.center
  const [longitude, latitude] = coordinates || []

  const formatCoordinate = (coord: number): string => {
    return coord?.toFixed(6) || "0.000000"
  }

  const getPlaceType = (feature: GeocodingFeature): string => {
    // Extract place type from properties or place_type
    if (feature.properties?.type) {
      return feature.properties.type
    }

    // Try to infer from place_type if available
    if (feature.place_type && feature.place_type.length > 0) {
      return feature.place_type[0]
    }

    // Default fallback
    return "place"
  }

  const getRegionInfo = (feature: GeocodingFeature): string[] => {
    const info: string[] = []

    // Try to extract hierarchical location info from properties
    if (
      feature.properties?.address &&
      feature.properties.address !== feature.text
    ) {
      info.push(feature.properties.address)
    }

    if (
      feature.properties?.state &&
      feature.properties.state !== feature.text
    ) {
      info.push(feature.properties.state)
    }

    if (
      feature.properties?.country &&
      feature.properties.country !== feature.text
    ) {
      info.push(feature.properties.country)
    }

    return info
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium mb-2 truncate" title={feature.place_name}>
            {feature.place_name || feature.text || "Unknown Location"}
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="text-xs capitalize">
              {getPlaceType(feature)}
            </Badge>
            {coordinates && (
              <Badge variant="outline" className="text-xs font-mono">
                {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
              </Badge>
            )}
          </div>

          {/* Show hierarchical location info */}
          {getRegionInfo(feature).length > 0 && (
            <p className="text-sm text-muted-foreground mb-2">
              {getRegionInfo(feature).join(" • ")}
            </p>
          )}

          {coordinates && (
            <div className="text-xs text-muted-foreground">
              Coordinates: {formatCoordinate(latitude)},{" "}
              {formatCoordinate(longitude)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {coordinates && (
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/map?center=${longitude},${latitude}&location=${encodeURIComponent(
                  feature.place_name || feature.text || "Location"
                )}&zoom=12`}
              >
                <MapPin className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function LocationResultsSkeleton({ showTitle }: { showTitle: boolean }) {
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
