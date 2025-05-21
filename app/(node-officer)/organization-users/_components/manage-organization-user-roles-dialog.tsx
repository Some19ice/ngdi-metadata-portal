"use client"

import { useState, useTransition, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  assignOrganizationRoleForNOAction,
  removeOrganizationRoleForNOAction,
  OrganizationUser
} from "@/actions/db/node-officer-actions"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface ManageOrganizationUserRolesDialogProps {
  orgId: string
  user: OrganizationUser
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onRolesUpdated: () => void
}

const manageRolesFormSchema = z.object({
  isMetadataCreator: z.boolean().default(false),
  isMetadataApprover: z.boolean().default(false)
})

type ManageRolesFormValues = z.infer<typeof manageRolesFormSchema>

const assignableNodeOfficerRoles = [
  "Metadata Creator",
  "Metadata Approver"
] as const

export function ManageOrganizationUserRolesDialog({
  orgId,
  user,
  isOpen,
  onOpenChange,
  onRolesUpdated
}: ManageOrganizationUserRolesDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ManageRolesFormValues>({
    resolver: zodResolver(manageRolesFormSchema),
    defaultValues: {
      isMetadataCreator: user.roles.includes("Metadata Creator"),
      isMetadataApprover: user.roles.includes("Metadata Approver")
    }
  })

  useEffect(() => {
    form.reset({
      isMetadataCreator: user.roles.includes("Metadata Creator"),
      isMetadataApprover: user.roles.includes("Metadata Approver")
    })
  }, [user, form])

  const onSubmit = async (values: ManageRolesFormValues) => {
    startTransition(async () => {
      let success = true
      let messages: string[] = []

      const initialIsMC = user.roles.includes("Metadata Creator")
      const initialIsMA = user.roles.includes("Metadata Approver")

      try {
        // Handle Metadata Creator role
        if (values.isMetadataCreator !== initialIsMC) {
          const action = values.isMetadataCreator
            ? assignOrganizationRoleForNOAction
            : removeOrganizationRoleForNOAction
          const result = await action(orgId, user.clerkId, "Metadata Creator")
          if (!result.isSuccess) success = false
          messages.push(
            `Metadata Creator role ${values.isMetadataCreator ? "assigned" : "revoked"}: ${result.message}`
          )
        }

        // Handle Metadata Approver role
        if (values.isMetadataApprover !== initialIsMA) {
          const action = values.isMetadataApprover
            ? assignOrganizationRoleForNOAction
            : removeOrganizationRoleForNOAction
          const result = await action(orgId, user.clerkId, "Metadata Approver")
          if (!result.isSuccess) success = false
          messages.push(
            `Metadata Approver role ${values.isMetadataApprover ? "assigned" : "revoked"}: ${result.message}`
          )
        }

        if (success) {
          toast.success(messages.join("\n") || "Roles updated successfully.")
          onRolesUpdated()
          onOpenChange(false)
        } else {
          toast.error(
            messages.join("\n") || "Failed to update one or more roles."
          )
        }
      } catch (error) {
        toast.error("An unexpected error occurred while updating roles.")
        console.error("Role update error:", error)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            Manage Roles for {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>
            Assign or revoke &quot;Metadata Creator&quot; and &quot;Metadata
            Approver&quot; roles for this user within the organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-2"
          >
            <FormField
              control={form.control}
              name="isMetadataCreator"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Metadata Creator</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isMetadataApprover"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Metadata Approver</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
