/**
 * Get the base URL for the application
 * Handles different environments (local, Vercel preview, production)
 */
export function getBaseUrl(): string {
  // Browser should use relative URLs
  if (typeof window !== "undefined") {
    return ""
  }

  // Server-side URL construction
  // Check for explicitly set app URL first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development
  return `http://localhost:${process.env.PORT || 3000}`
}
