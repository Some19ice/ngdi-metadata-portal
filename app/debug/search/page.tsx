"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { geocodeLocationAction } from "@/actions/map-actions"
import { toast } from "sonner"

export default function SearchDebugPage() {
  const [query, setQuery] = useState("Lagos")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [serverInfo, setServerInfo] = useState<any>(null)

  const testGeocodingAction = async () => {
    setIsLoading(true)
    try {
      const result = await geocodeLocationAction({
        searchText: query,
        autocomplete: true,
        limit: 5,
        country: "NG"
      })
      setResults(result)
      toast.success("Geocoding test completed")
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error("Geocoding test failed")
    }
    setIsLoading(false)
  }

  const testServerEndpoint = async () => {
    try {
      const response = await fetch(
        `/api/debug/geocoding?q=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setServerInfo(data)
      toast.success("Server info retrieved")
    } catch (error) {
      setServerInfo({
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error("Failed to get server info")
    }
  }

  const testDirectAPI = async () => {
    try {
      const response = await fetch(
        `/api/map/geocode?q=${encodeURIComponent(query)}&limit=3`
      )
      const data = await response.json()
      setResults({ direct: data, status: response.status })
      toast.success("Direct API test completed")
    } catch (error) {
      setResults({
        direct: {
          error: error instanceof Error ? error.message : String(error)
        }
      })
      toast.error("Direct API test failed")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Search Functionality Debug</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Search</CardTitle>
            <CardDescription>
              Test the search functionality with different queries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter search term (e.g., Lagos, Abuja)"
              />
              <Button onClick={testGeocodingAction} disabled={isLoading}>
                Test Action
              </Button>
              <Button onClick={testDirectAPI} variant="outline">
                Test Direct API
              </Button>
              <Button onClick={testServerEndpoint} variant="secondary">
                Server Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {serverInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(serverInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Missing API Key</h3>
              <p className="text-sm text-gray-600">
                Ensure MAPTILER_API_KEY is set in environment variables. The app
                will use fallback data if no key is provided.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">2. Rate Limiting</h3>
              <p className="text-sm text-gray-600">
                MapTiler API has rate limits. Check your usage dashboard.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">3. Network Issues</h3>
              <p className="text-sm text-gray-600">
                Verify that the server can make outbound HTTPS requests to
                api.maptiler.com
              </p>
            </div>
            <div>
              <h3 className="font-semibold">4. Fallback Mode</h3>
              <p className="text-sm text-gray-600">
                If the API is unavailable, the app will return predefined
                Nigerian locations (Lagos, Abuja, Kano, Ibadan, Port Harcourt).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
