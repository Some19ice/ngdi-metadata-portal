"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import {
  Eye,
  Download,
  Share2,
  BookmarkPlus,
  TrendingUp,
  Calendar,
  Globe,
  Users
} from "lucide-react"
import { format, subDays, parseISO } from "date-fns"

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AnalyticsData {
  recordId: string
  title: string
  totalViews: number
  totalDownloads: number
  totalShares: number
  totalBookmarks: number
  viewsOverTime: { date: string; views: number }[]
  topReferrers: { domain: string; visits: number }[]
  topCountries: { country: string; visits: number }[]
  downloadsByFormat: { format: string; count: number }[]
  lastViewed: string
  avgSessionDuration: number
  bounceRate: number
}

interface MetadataAnalyticsProps {
  recordId: string
  isOwner?: boolean
}

const generateMockAnalytics = (recordId: string): AnalyticsData => {
  const now = new Date()
  const viewsOverTime = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(now, 29 - i), "yyyy-MM-dd"),
    views: Math.floor(Math.random() * 100) + 10
  }))

  return {
    recordId,
    title: "Sample Metadata Record",
    totalViews: 1547,
    totalDownloads: 234,
    totalShares: 45,
    totalBookmarks: 67,
    viewsOverTime,
    topReferrers: [
      { domain: "google.com", visits: 345 },
      { domain: "scholar.google.com", visits: 234 },
      { domain: "direct", visits: 189 },
      { domain: "twitter.com", visits: 67 },
      { domain: "linkedin.com", visits: 45 }
    ],
    topCountries: [
      { country: "Nigeria", visits: 456 },
      { country: "Ghana", visits: 234 },
      { country: "Kenya", visits: 189 },
      { country: "South Africa", visits: 167 },
      { country: "United States", visits: 134 }
    ],
    downloadsByFormat: [
      { format: "JSON", count: 89 },
      { format: "XML", count: 67 },
      { format: "CSV", count: 45 },
      { format: "ISO19139", count: 33 }
    ],
    lastViewed: new Date().toISOString(),
    avgSessionDuration: 245, // seconds
    bounceRate: 0.34 // 34%
  }
}

export default function MetadataAnalytics({
  recordId,
  isOwner = false
}: MetadataAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // In real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        const mockData = generateMockAnalytics(recordId)
        setAnalytics(mockData)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [recordId, timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Chart configurations
  const viewsChartData = {
    labels: analytics.viewsOverTime.map(d =>
      format(parseISO(d.date), "MMM dd")
    ),
    datasets: [
      {
        label: "Views",
        data: analytics.viewsOverTime.map(d => d.views),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
        fill: true
      }
    ]
  }

  const downloadsChartData = {
    labels: analytics.downloadsByFormat.map(d => d.format),
    datasets: [
      {
        label: "Downloads",
        data: analytics.downloadsByFormat.map(d => d.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)"
        ]
      }
    ]
  }

  const countriesChartData = {
    labels: analytics.topCountries.map(c => c.country),
    datasets: [
      {
        data: analytics.topCountries.map(c => c.visits),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)"
        ]
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Usage statistics for metadata record
          </p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Views
                </p>
                <p className="text-2xl font-bold">
                  {analytics.totalViews.toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Downloads
                </p>
                <p className="text-2xl font-bold">
                  {analytics.totalDownloads.toLocaleString()}
                </p>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+8.2%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Shares
                </p>
                <p className="text-2xl font-bold">
                  {analytics.totalShares.toLocaleString()}
                </p>
              </div>
              <Share2 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+5.1%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bookmarks
                </p>
                <p className="text-2xl font-bold">
                  {analytics.totalBookmarks.toLocaleString()}
                </p>
              </div>
              <BookmarkPlus className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+3.7%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Session Duration
                </p>
                <p className="text-lg font-bold">
                  {formatDuration(analytics.avgSessionDuration)}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="secondary">+15% vs average</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bounce Rate
                </p>
                <p className="text-lg font-bold">
                  {(analytics.bounceRate * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline">Good engagement</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Viewed
                </p>
                <p className="text-lg font-bold">
                  {format(parseISO(analytics.lastViewed), "MMM dd, HH:mm")}
                </p>
              </div>
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="secondary">Recently active</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={viewsChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Downloads by Format */}
        <Card>
          <CardHeader>
            <CardTitle>Downloads by Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={downloadsChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {referrer.domain}
                    </span>
                  </div>
                  <Badge variant="secondary">{referrer.visits}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut
                  data={countriesChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 10
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Export Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF Report
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
