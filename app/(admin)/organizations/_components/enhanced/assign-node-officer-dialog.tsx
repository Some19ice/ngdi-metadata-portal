"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AdminOrganizationView } from "@/db/schema/organizations-schema"
import { assignNodeOfficerAction } from "@/actions/db/organizations-actions"
import { getAvailableNodeOfficersAction } from "@/actions/db/user-organizations-actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  Building2,
  Info,
  Loader2,
  Mail,
  Phone,
  User,
  Users
} from "lucide-react"

interface NodeOfficer {
  userId: string
  firstName: string | null
  lastName: string | null
  emailAddress: string
  currentOrganization: string | null
  currentOrganizationId: string | null
}

interface AssignNodeOfficerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: AdminOrganizationView
  onRefresh: () => void
}

export default function AssignNodeOfficerDialog({
  open,
  onOpenChange,
  organization,
  onRefresh
}: AssignNodeOfficerDialogProps) {
  const [selectedNodeOfficerId, setSelectedNodeOfficerId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<NodeOfficer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch available users when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableUsers()
    }
  }, [open])

  const fetchAvailableUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getAvailableNodeOfficersAction()

      if (result.isSuccess) {
        setAvailableUsers(result.data)

        // Pre-select current node officer if exists
        if (organization.nodeOfficerId) {
          setSelectedNodeOfficerId(organization.nodeOfficerId)
        }
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error fetching available users:", error)
      setError("Failed to load available users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedNodeOfficerId) return

    setIsAssigning(true)
    try {
      const result = await assignNodeOfficerAction(
        organization.id,
        selectedNodeOfficerId
      )

      if (result.isSuccess) {
        toast({
          title: "Node Officer Assigned",
          description: `Node Officer has been successfully assigned to ${organization.name}.`
        })
        onRefresh()
        onOpenChange(false)
      } else {
        toast({
          title: "Assignment Failed",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error assigning node officer:", error)
      toast({
        title: "Assignment Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemove = async () => {
    setIsAssigning(true)
    try {
      const result = await assignNodeOfficerAction(organization.id, null)

      if (result.isSuccess) {
        toast({
          title: "Node Officer Removed",
          description: `Node Officer has been removed from ${organization.name}.`
        })
        onRefresh()
        onOpenChange(false)
      } else {
        toast({
          title: "Removal Failed",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error removing node officer:", error)
      toast({
        title: "Removal Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const hasChanges =
    selectedNodeOfficerId !== (organization.nodeOfficerId || "")
  const selectedOfficer = availableUsers.find(
    no => no.userId === selectedNodeOfficerId
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Node Officer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Organization
            </Label>
            <div className="mt-1 p-2 bg-gray-50 rounded border">
              {organization.name}
            </div>
          </div>

          {/* Current Node Officer */}
          {organization.nodeOfficerId && (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Current Node Officer
              </Label>
              <div className="mt-1 flex items-center space-x-2">
                <Badge variant="secondary">
                  {organization.nodeOfficerName || "Unknown"}
                </Badge>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading available users...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Node Officer Selection */}
          {!isLoading && !error && (
            <div>
              <Label
                htmlFor="nodeOfficer"
                className="text-sm font-medium text-gray-700"
              >
                Select Node Officer
              </Label>

              {/* Info message */}
              <div className="mt-1 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Node Officer Assignment</p>
                    <p className="text-xs mt-1">
                      Any user can be assigned as a Node Officer. They will
                      automatically receive the appropriate permissions for this
                      organization.
                    </p>
                  </div>
                </div>
              </div>

              {availableUsers.length === 0 ? (
                <div className="mt-1 p-3 bg-gray-50 border rounded-md text-sm text-gray-500 text-center">
                  No users available
                </div>
              ) : (
                <Select
                  value={selectedNodeOfficerId}
                  onValueChange={setSelectedNodeOfficerId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a user to assign as Node Officer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map(officer => (
                      <SelectItem
                        key={officer.userId}
                        value={officer.userId}
                        className="flex flex-col items-start"
                      >
                        <div className="flex items-center space-x-2 w-full">
                          <span className="font-medium">
                            {officer.firstName} {officer.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({officer.emailAddress})
                          </span>
                        </div>
                        {officer.currentOrganization &&
                          officer.currentOrganizationId !== organization.id && (
                            <span className="text-xs text-amber-600">
                              Currently assigned to:{" "}
                              {officer.currentOrganization}
                            </span>
                          )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Assignment Warning */}
          {selectedOfficer?.currentOrganization &&
            selectedOfficer.currentOrganizationId !== organization.id && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Assignment Warning</AlertTitle>
                <AlertDescription>
                  This Node Officer is currently assigned to{" "}
                  <strong>{selectedOfficer.currentOrganization}</strong>.
                  Assigning them here will remove them from their current
                  organization.
                </AlertDescription>
              </Alert>
            )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {organization.nodeOfficerId && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={isAssigning || isLoading}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Current"
                )}
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                !hasChanges ||
                !selectedNodeOfficerId ||
                isAssigning ||
                isLoading
              }
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Officer"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
