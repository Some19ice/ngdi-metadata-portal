"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { updateUserRoleAction, ClerkUser } from "@/actions/clerk-actions"
import { getRolesAction } from "@/actions/db/roles-actions"
import { SelectRole, roleEnum } from "@/db/schema"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

const manageUserRoleSchema = z.object({
  roleName: z.enum(roleEnum.enumValues)
})

type ManageUserRoleFormData = z.infer<typeof manageUserRoleSchema>

interface ManageUserRoleDialogProps {
  user: ClerkUser
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess?: () => void
}

export default function ManageUserRoleDialog({
  user,
  isOpen,
  onOpenChange,
  onSuccess
}: ManageUserRoleDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [availableRoles, setAvailableRoles] = useState<SelectRole[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  const form = useForm<ManageUserRoleFormData>({
    resolver: zodResolver(manageUserRoleSchema),
    defaultValues: {
      // Initialize with user's current DB role if available, otherwise undefined
      roleName: user.databaseRole ? user.databaseRole : undefined
    }
  })

  useEffect(() => {
    async function fetchAvailableRoles() {
      setIsLoadingRoles(true)
      try {
        const rolesResult = await getRolesAction()
        if (rolesResult.isSuccess && rolesResult.data) {
          setAvailableRoles(rolesResult.data)
          // Set default form value based on user.databaseRole after roles are loaded
          // This ensures the role is valid and part of availableRoles for the Select component
          if (
            user.databaseRole &&
            rolesResult.data.some(r => r.name === user.databaseRole)
          ) {
            form.reset({ roleName: user.databaseRole })
          } else if (user.databaseRole) {
            toast({
              title: "Warning: Role Inconsistency",
              description: `User's current role (${user.databaseRole}) is not in the list of assignable roles. Please contact an administrator.`,
              duration: 7000
            })
            // Potentially clear the invalid role or leave as is for admin to see
          }
          // If no user.databaseRole, it remains undefined, showing placeholder
        } else {
          toast({
            title: "Error fetching roles",
            description:
              (rolesResult.message as string) ||
              "Could not load assignable roles.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching available roles for dialog:", error)
        toast({
          title: "Error",
          description: "Failed to load available roles.",
          variant: "destructive"
        })
      }
      setIsLoadingRoles(false)
    }

    if (isOpen && user) {
      // Reset form with potentially new user data when dialog opens or user changes
      form.reset({
        roleName: user.databaseRole ? user.databaseRole : undefined
      })
      fetchAvailableRoles()
    }
  }, [isOpen, user, toast, form]) // form added to dependency array for form.reset

  async function onSubmit(data: ManageUserRoleFormData) {
    try {
      const result = await updateUserRoleAction(user.id, data.roleName)
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: result.message
        })
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast({
          title: "Error updating role",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the role.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Manage Role for {user.firstName || user.username}
          </DialogTitle>
          <DialogDescription>
            Select a new role for the user. Current role from database:{" "}
            {user.databaseRole?.replace(/_/g, " ") || "Not set"}.
          </DialogDescription>
        </DialogHeader>
        {isLoadingRoles && availableRoles.length === 0 ? (
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roleName">Role</Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled>
                Cancel
              </Button>
              <Button type="submit" disabled>
                Saving...
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="roleName">Role</Label>
              <Controller
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.length === 0 && !isLoadingRoles && (
                        <SelectItem value="no-roles" disabled>
                          No roles available.
                        </SelectItem>
                      )}
                      {isLoadingRoles && (
                        <SelectItem value="loading-roles" disabled>
                          Loading roles...
                        </SelectItem>
                      )}
                      {availableRoles.map(role => (
                        <SelectItem
                          key={role.id}
                          value={
                            role.name as (typeof roleEnum.enumValues)[number]
                          }
                        >
                          {role.name.charAt(0).toUpperCase() +
                            role.name.slice(1).replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.roleName && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.roleName.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  availableRoles.length === 0 ||
                  isLoadingRoles
                }
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
