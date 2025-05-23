"use client"

import {
  MapContainer,
  TileLayer,
  Rectangle,
  Marker,
  Popup,
  useMap
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { LatLngExpression, LatLngBoundsExpression } from "leaflet"
import { useEffect, useRef } from "react"
import MapErrorBoundary from "./map/map-error-boundary"
import { useLeafletMapKey } from "@/hooks"

// Fix for default marker icon issue with webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
})

interface MarkerData {
  position: LatLngExpression
  popupContent?: React.ReactNode
}

interface BasicMapDisplayProps {
  center?: LatLngExpression
  zoom?: number
  bounds?: LatLngBoundsExpression | null // [[southLat, westLng], [northLat, eastLng]]
  markers?: MarkerData[]
  style?: React.CSSProperties
  className?: string
}

// Component to adjust map view when bounds change
const ChangeView = ({ bounds }: { bounds: LatLngBoundsExpression | null }) => {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      try {
        const leafletBounds =
          bounds instanceof L.LatLngBounds
            ? bounds
            : L.latLngBounds(bounds as L.LatLngBoundsLiteral)
        if (leafletBounds.isValid()) {
          map.fitBounds(leafletBounds, { padding: [10, 10] })
        } else {
          console.warn("Provided bounds are not valid:", bounds)
          // Fallback to a default view if bounds are invalid
          map.setView([0, 0], 2) // Default view if bounds are bad
        }
      } catch (e) {
        console.error("Error fitting bounds:", e, bounds)
        map.setView([0, 0], 2)
      }
    } else {
      // If no bounds, set a default view or use props.center/zoom
      // For now, let's assume if bounds is null, it relies on center/zoom from MapContainer
    }
  }, [map, bounds])
  return null
}

const BasicMapDisplay: React.FC<BasicMapDisplayProps> = ({
  center = [51.505, -0.09], // Default center
  zoom = 2, // Default zoom if no bounds
  bounds = null,
  markers = [],
  style = { height: "400px", width: "100%" },
  className = ""
}) => {
  // Use the custom hook for stable map key generation
  const mapKey = useLeafletMapKey("basic-map")

  // Determine initial center and zoom for MapContainer
  // If bounds are provided, MapContainer's center/zoom are less critical as fitBounds will take over.
  // However, providing a sensible initial center/zoom can prevent an initial flash or weird state.
  let initialCenter = center
  let initialZoom = zoom

  if (bounds) {
    try {
      const leafletBounds =
        bounds instanceof L.LatLngBounds
          ? bounds
          : L.latLngBounds(bounds as L.LatLngBoundsLiteral)
      if (leafletBounds.isValid()) {
        initialCenter = leafletBounds.getCenter()
        // Setting a zoom level when bounds are provided can be tricky;
        // fitBounds is better. So, zoom prop is more of a fallback here.
      } else {
        // Keep default center/zoom if provided bounds are invalid
      }
    } catch (e) {
      // Keep default center/zoom if bounds parsing fails
    }
  }

  // Create a stable key that includes bounds information
  const boundsKey = bounds
    ? Array.isArray(bounds)
      ? `${bounds[0]}-${bounds[1]}`
      : bounds instanceof L.LatLngBounds
        ? `${bounds.getSouth()}-${bounds.getWest()}-${bounds.getNorth()}-${bounds.getEast()}`
        : "bounds-object"
    : "no-bounds"

  return (
    <MapErrorBoundary>
      <MapContainer
        key={`${mapKey}-${boundsKey}`}
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={style}
        className={className}
        // whenCreated={(map) => { // Alternative way to fitBounds, but useMap hook is cleaner for components
        //   if (bounds) map.fitBounds(bounds, { padding: [10, 10] });
        // }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <ChangeView bounds={bounds} />}
        {bounds && (
          <Rectangle
            bounds={bounds as L.LatLngBoundsExpression}
            pathOptions={{ color: "blue", weight: 2, fillOpacity: 0.1 }}
          />
        )}
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            {marker.popupContent && <Popup>{marker.popupContent}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </MapErrorBoundary>
  )
}

export default BasicMapDisplay
