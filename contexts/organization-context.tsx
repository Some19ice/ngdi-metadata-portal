"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from "react"
import { SelectOrganization } from "@/db/schema"
import { getCurrentUserOrganizationAction } from "@/actions/db/user-organizations-actions"
import { useAuth } from "@clerk/nextjs"

interface OrganizationContextType {
  organization: SelectOrganization | null
  userRole: "Node Officer" | "Metadata Creator" | "Metadata Approver" | null
  isLoading: boolean
  error: string | null
  refreshOrganization: () => Promise<void>
  isInitialized: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
)

export function OrganizationProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [organization, setOrganization] = useState<SelectOrganization | null>(
    null
  )
  const [userRole, setUserRole] = useState<
    "Node Officer" | "Metadata Creator" | "Metadata Approver" | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const isLoadingRef = useRef(false)

  const loadOrganization = useCallback(async () => {
    // Don't load if auth isn't ready or user isn't signed in
    if (!isLoaded || !isSignedIn || !userId) {
      setIsLoading(false)
      setIsInitialized(true)
      return
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      setIsLoading(true)
      setError(null)

      const result = await getCurrentUserOrganizationAction()

      if (result.isSuccess && result.data) {
        setOrganization(result.data.organization)
        setUserRole(result.data.userRole)
      } else if (!result.isSuccess) {
        setError(result.message)
        console.warn("Organization context error:", result.message)
      }
    } catch (err) {
      const errorMessage = "Failed to load organization context"
      setError(errorMessage)
      console.error("Error loading organization:", err)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [isLoaded, isSignedIn, userId])

  useEffect(() => {
    // Only start loading once auth is fully ready
    if (isLoaded) {
      loadOrganization()
    }
  }, [isLoaded, loadOrganization])

  const refreshOrganization = useCallback(async () => {
    isLoadingRef.current = false // Reset loading ref
    setIsInitialized(false)
    await loadOrganization()
  }, [loadOrganization])

  const contextValue = React.useMemo(
    () => ({
      organization,
      userRole,
      isLoading,
      error,
      refreshOrganization,
      isInitialized
    }),
    [
      organization,
      userRole,
      isLoading,
      error,
      refreshOrganization,
      isInitialized
    ]
  )

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    )
  }
  return context
}
