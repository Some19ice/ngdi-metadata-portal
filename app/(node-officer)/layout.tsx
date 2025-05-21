"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getNodeOfficerManagedOrganizationsAction } from "@/actions/db/user-organizations-actions"
import { ShieldAlert } from "lucide-react"

export default async function NodeOfficerLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const orgsResult = await getNodeOfficerManagedOrganizationsAction()

  if (
    !orgsResult.isSuccess ||
    !orgsResult.data ||
    orgsResult.data.length === 0
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Alert variant="destructive" className="w-full max-w-lg shadow-md">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            Access Denied
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            {orgsResult.message && !orgsResult.isSuccess ? (
              <>
                <strong>Error:</strong> {orgsResult.message}
              </>
            ) : (
              "You do not have Node Officer privileges for any organization. Access to this section is restricted."
            )}
            <br />
            If you believe this is an error, please contact a system
            administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // User is a Node Officer for at least one organization, allow access to children.
  // The actual content (e.g. dashboard) will be rendered as children.
  // This layout does not provide its own sidebar or navigation structure,
  // assuming main app layout handles that.
  return <>{children}</>
}
