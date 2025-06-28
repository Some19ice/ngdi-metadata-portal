"use client"

import { useState } from "react"
import { ClerkUser, updateUserRoleAction } from "@/actions/clerk-actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { roleEnum } from "@/db/schema"
import { Shield } from "lucide-react"

interface EditUserRolesDialogProps {
  user: ClerkUser
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function EditUserRolesDialog({
  user,
  isOpen,
  onOpenChange,
  onSuccess
}: EditUserRolesDialogProps) {
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState<
    (typeof roleEnum.enumValues)[number] | ""
  >(user.databaseRole || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({
        title: "No role selected",
        description: "Please select a role to assign to this user.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateUserRoleAction(user.id, selectedRole)
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
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit User Role
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4 flex items-center space-x-3">
            <div>
              <h3 className="font-medium">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user.emailAddress}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="role-select"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Role
            </label>
            <Select
              value={selectedRole}
              onValueChange={value =>
                setSelectedRole(value as (typeof roleEnum.enumValues)[number])
              }
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleEnum.enumValues.map(role => (
                  <SelectItem key={role} value={role}>
                    {role
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user.databaseRole && (
              <p className="text-xs text-muted-foreground">
                Current role:{" "}
                {user.databaseRole
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
