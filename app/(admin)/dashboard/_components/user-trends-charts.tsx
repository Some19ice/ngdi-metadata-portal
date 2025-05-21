"use client"

import { getNewUserRegistrationsKpiAction } from "@/actions/db/admin-dashboard-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { KpiChartData } from "@/types/admin-dashboard-types"
import { useEffect, useState, useMemo } from "react"
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

export default function UserTrendsCharts() {
  const [data, setData] = useState<KpiChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getNewUserRegistrationsKpiAction(
          parseInt(selectedPeriod, 10)
        )
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
    }
    fetchData()
  }, [selectedPeriod])

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
          <CardTitle>New User Registrations</CardTitle>
          <CardDescription>
            Users who created accounts in the selected period
          </CardDescription>
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
              fill="hsl(var(--primary))"
              name="New Users"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
