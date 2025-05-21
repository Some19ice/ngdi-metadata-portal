export interface UserStats {
  total: number
  byRole?: {
    admin?: number
    nodeOfficer?: number
    registeredUser?: number
  }
}

export interface MetadataStats {
  total: number
  byStatus: {
    published: number
    approved: number
    pendingValidation: number
    draft: number
    needsRevision: number
  }
}

export interface DashboardStats {
  userStats: UserStats
  organizationCount: number
  metadataStats: MetadataStats
  // activeSessions?: number; // Optional or deferred
  // systemAlertsCount?: number; // Optional or deferred
}

export interface KpiChartDataItem {
  date: string // YYYY-MM-DD format
  value: number
}

export type KpiChartData = KpiChartDataItem[]
