"use server"

import { Suspense } from "react"
import MapWrapper from "./_components/map-wrapper"

export default async function MapPage() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Interactive Map</h1>
        <MapWrapper />
      </div>
    </Suspense>
  )
}
