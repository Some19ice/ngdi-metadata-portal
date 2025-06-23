export interface GeocodingFeature {
  id: string
  place_name: string
  center: [number, number]
  properties: Record<string, any>
  type: string
  place_type: string[]
  text: string
}

export interface GeocodingResponse {
  type: "FeatureCollection"
  query: string[]
  features: GeocodingFeature[]
  attribution: string
  warning?: string
}
