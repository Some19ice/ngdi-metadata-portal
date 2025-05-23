"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  Users,
  FileText,
  CheckCircle,
  Clock
} from "lucide-react"

interface AnalyticsData {
  metadataSubmissions: Array<{
    month: string
    submissions: number
    approvals: number
    rejections: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    color: string
  }>
  userActivity: Array<{
    userId: string
    userName: string
    submissions: number
    approvals: number
    lastActivity: string
  }>
  organizationMetrics: {
    totalRecords: number
    monthlyGrowth: number
    approvalRate: number
    avgProcessingTime: number
    activeUsers: number
  }
}

interface OrganizationAnalyticsProps {
  organizationId: string
  organizationName: string
  analyticsData: AnalyticsData
}

export default function OrganizationAnalytics({
  organizationId,
  organizationName,
  analyticsData
}: OrganizationAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("6months")
  const [chartType, setChartType] = useState("submissions")

  const {
    metadataSubmissions,
    statusDistribution,
    userActivity,
    organizationMetrics
  } = analyticsData

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4" />
  }

  const exportData = () => {
    // Implementation for exporting analytics data
    const dataToExport = {
      organization: organizationName,
      exportDate: new Date().toISOString(),
      metrics: organizationMetrics,
      submissions: metadataSubmissions,
      statusDistribution,
      userActivity
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${organizationName}-analytics-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Organization Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights for {organizationName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(organizationMetrics.totalRecords)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(organizationMetrics.monthlyGrowth)}
              <span className="ml-1">
                {formatPercentage(Math.abs(organizationMetrics.monthlyGrowth))}{" "}
                from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(organizationMetrics.approvalRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Records approved on first review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizationMetrics.avgProcessingTime} days
            </div>
            <p className="text-xs text-muted-foreground">
              From submission to approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizationMetrics.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Users active this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Submissions Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Submission Trends
                </CardTitle>
                <CardDescription>
                  Monthly metadata submissions and approvals
                </CardDescription>
              </div>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submissions">Submissions</SelectItem>
                  <SelectItem value="approvals">Approvals</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metadataSubmissions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                {(chartType === "submissions" || chartType === "both") && (
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Submissions"
                  />
                )}
                {(chartType === "approvals" || chartType === "both") && (
                  <Line
                    type="monotone"
                    dataKey="approvals"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Approvals"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>
              Current breakdown of record statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) =>
                    `${status} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity Summary</CardTitle>
          <CardDescription>
            Performance metrics for organization members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Submissions</th>
                  <th className="text-left p-2">Approval Rate</th>
                  <th className="text-left p-2">Last Activity</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {userActivity.map(user => (
                  <tr key={user.userId} className="border-b">
                    <td className="p-2">
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.userId}
                      </div>
                    </td>
                    <td className="p-2">{user.submissions}</td>
                    <td className="p-2">
                      {user.submissions > 0
                        ? formatPercentage(
                            (user.approvals / user.submissions) * 100
                          )
                        : "N/A"}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(user.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          new Date(user.lastActivity) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {new Date(user.lastActivity) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
