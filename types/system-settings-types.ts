import { SelectSystemSetting, InsertSystemSetting } from "@/db/schema"

// Re-export database types for convenience
export type { SelectSystemSetting, InsertSystemSetting }

// System setting categories
export type SystemSettingCategory =
  | "general"
  | "security"
  | "storage"
  | "email"
  | "appearance"
  | "notifications"
  | "metadata"
  | "api"

// System setting data types
export type SystemSettingDataType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "array"

// General system settings
export interface GeneralSettings {
  siteName: string
  siteDescription: string
  defaultLanguage: string
  timezone: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxFileUploadSize: number
  supportEmail: string
  supportPhone?: string
}

// Security settings
export interface SecuritySettings {
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  passwordRequireSpecialChars: boolean
  passwordRequireNumbers: boolean
  passwordRequireUppercase: boolean
  twoFactorRequired: boolean
  ipWhitelist?: string[]
}

// Storage settings
export interface StorageSettings {
  maxStoragePerOrg: number
  allowedFileTypes: string[]
  storageProvider: "local" | "s3" | "azure" | "gcp"
  storageConfig: Record<string, any>
  autoCleanupEnabled: boolean
  cleanupRetentionDays: number
}

// Email settings
export interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  emailTemplates: Record<string, string>
}

// Appearance settings
export interface AppearanceSettings {
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  faviconUrl?: string
  customCss?: string
  headerText?: string
  footerText?: string
}

// System setting with typed value
export interface TypedSystemSetting extends Omit<SelectSystemSetting, "value"> {
  value: any // Will be parsed based on dataType
}

// System settings form data
export interface SystemSettingsFormData {
  general?: Partial<GeneralSettings>
  security?: Partial<SecuritySettings>
  storage?: Partial<StorageSettings>
  email?: Partial<EmailSettings>
  appearance?: Partial<AppearanceSettings>
}

// System health status
export interface SystemHealthStatus {
  database: "healthy" | "warning" | "error"
  storage: "healthy" | "warning" | "error"
  email: "healthy" | "warning" | "error"
  api: "healthy" | "warning" | "error"
  overall: "healthy" | "warning" | "error"
  lastChecked: Date
  details: Record<string, any>
}
