"use client"

import {
  getMetadataSubmissionsKpiAction,
  getMetadataStatusKpiAction
} from "@/actions/db/admin-dashboard-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { KpiChartData } from "@/types/admin-dashboard-types"
import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import ChartSkeleton from "./chart-skeleton"

const timePeriodOptions = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" }
]

const kpiOptions = [
  { label: "Submissions", value: "submissions", color: "hsl(var(--primary))" },
  { label: "Published", value: "published", color: "hsl(146, 70%, 55%)" },
  { label: "Approved", value: "approved", color: "hsl(215, 100%, 65%)" }
]

export default function MetadataTrendsCharts() {
  const [data, setData] = useState<KpiChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")
  const [selectedKpi, setSelectedKpi] = useState<string>("submissions")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let result
      const periodDays = parseInt(selectedPeriod, 10)

      if (selectedKpi === "submissions") {
        result = await getMetadataSubmissionsKpiAction(periodDays)
      } else {
        result = await getMetadataStatusKpiAction(selectedKpi, periodDays)
      }

      if (result.isSuccess && result.data) {
        setData(result.data)
      } else {
        setError(result.message || "Failed to load data")
        setData(null)
      }
    } catch (e) {
      setError("An error occurred while fetching data")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod, selectedKpi])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currentKpiConfig = useMemo(
    () => kpiOptions.find(opt => opt.value === selectedKpi) || kpiOptions[0],
    [selectedKpi]
  )

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Metadata {currentKpiConfig.label}</CardTitle>
          <CardDescription>
            Metadata {selectedKpi === "submissions" ? "created" : selectedKpi}{" "}
            in the selected period
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <div className="min-w-32">
            <Select value={selectedKpi} onValueChange={setSelectedKpi}>
              <SelectTrigger>
                <SelectValue placeholder="Select KPI" />
              </SelectTrigger>
              <SelectContent>
                {kpiOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-24">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                {timePeriodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] p-0 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data || []}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={value =>
                new Date(value + "T00:00:00Z").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })
              }
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: "12px", borderRadius: "0.5rem" }}
              labelFormatter={label =>
                new Date(label + "T00:00:00Z").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })
              }
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar
              dataKey="value"
              fill={currentKpiConfig.color}
              name={currentKpiConfig.label}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
