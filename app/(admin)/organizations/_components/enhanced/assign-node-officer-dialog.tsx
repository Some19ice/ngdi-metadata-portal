"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// We would normally fetch this from the server
// This is a placeholder - in a real implementation, this would be a server action
import { useEffect, useState as useReactState } from "react"

interface NodeOfficerUser {
  id: string
  name: string
}

interface AssignNodeOfficerDialogProps {
  organization: AdminOrganizationView
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AssignNodeOfficerDialog({
  organization,
  isOpen,
  onOpenChange,
  onSuccess
}: AssignNodeOfficerDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(
    organization.nodeOfficerId || null
  )

  // In a real implementation, we would fetch this list from the server
  // This is just a placeholder for demonstration purposes
  const [nodeOfficers, setNodeOfficers] = useReactState<NodeOfficerUser[]>([
    { id: "node_officer_1", name: "Jane Smith" },
    { id: "node_officer_2", name: "John Doe" },
    { id: "node_officer_3", name: "Alice Johnson" }
  ])

  // For demo purposes, if organization has a nodeOfficerId but it's not in our list,
  // add it so we can display it
  useEffect(() => {
    if (
      organization.nodeOfficerId &&
      organization.nodeOfficerName &&
      !nodeOfficers.some(officer => officer.id === organization.nodeOfficerId)
    ) {
      setNodeOfficers(prev => [
        ...prev,
        { id: organization.nodeOfficerId!, name: organization.nodeOfficerName! }
      ])
    }
  }, [organization.nodeOfficerId, organization.nodeOfficerName, nodeOfficers])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const result = await assignNodeOfficerAction(
        organization.id,
        selectedOfficerId
      )

      if (result.isSuccess) {
        toast({
          title: "Success",
          description: result.message
        })
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleRemoveNodeOfficer() {
    setSelectedOfficerId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Node Officer</DialogTitle>
        </DialogHeader>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature Unavailable</AlertTitle>
          <AlertDescription>
            This feature requires a database migration to add the nodeOfficerId
            column. Please run the migration before using this feature.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Organization</h3>
            <p className="text-sm text-muted-foreground">{organization.name}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nodeOfficer">Select Node Officer</Label>
            <Select
              value={selectedOfficerId || ""}
              onValueChange={value => setSelectedOfficerId(value || null)}
              disabled={true}
            >
              <SelectTrigger id="nodeOfficer">
                <SelectValue placeholder="Functionality temporarily unavailable" />
              </SelectTrigger>
              <SelectContent>
                {nodeOfficers.map(officer => (
                  <SelectItem key={officer.id} value={officer.id}>
                    {officer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {organization.nodeOfficerId && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex flex-col">
                <span className="text-sm">Current Assignment</span>
                <span className="text-sm font-medium">
                  {organization.nodeOfficerName || "Unknown Node Officer"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveNodeOfficer}
                disabled={true}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={true}>
            Feature Unavailable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
