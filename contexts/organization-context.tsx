"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { SelectOrganization } from "@/db/schema"
import { getCurrentUserOrganizationAction } from "@/actions/db/user-organizations-actions"
import { useAuth } from "@clerk/nextjs"

interface OrganizationContextType {
  organization: SelectOrganization | null
  userRole: "Node Officer" | "Metadata Creator" | "Metadata Approver" | null
  isLoading: boolean
  error: string | null
  refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
)

export function OrganizationProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useAuth()
  const [organization, setOrganization] = useState<SelectOrganization | null>(
    null
  )
  const [userRole, setUserRole] = useState<
    "Node Officer" | "Metadata Creator" | "Metadata Approver" | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrganization = async () => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await getCurrentUserOrganizationAction()

      if (result.isSuccess && result.data) {
        setOrganization(result.data.organization)
        setUserRole(result.data.userRole)
      } else if (!result.isSuccess) {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to load organization context")
      console.error("Error loading organization:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrganization()
  }, [isLoaded, isSignedIn])

  const refreshOrganization = async () => {
    await loadOrganization()
  }

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        userRole,
        isLoading,
        error,
        refreshOrganization
      }}
    >
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
