"use client"

import { useState, useTransition } from "react"
import {
  OrganizationUser,
  removeUserFromOrganizationForNOAction
} from "@/actions/db/node-officer-actions"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface RemoveUserFromOrgDialogProps {
  orgId: string
  user: OrganizationUser
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onUserRemoved: () => void
}

export function RemoveUserFromOrgDialog({
  orgId,
  user,
  isOpen,
  onOpenChange,
  onUserRemoved
}: RemoveUserFromOrgDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleRemoveUser = async () => {
    startTransition(async () => {
      const result = await removeUserFromOrganizationForNOAction(
        orgId,
        user.clerkId
      )
      if (result.isSuccess) {
        toast.success(result.message)
        onUserRemoved()
        onOpenChange(false)
      } else {
        toast.error(
          result.message || "Failed to remove user from organization."
        )
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove{" "}
            <strong>
              {user.firstName} {user.lastName} ({user.emailAddress})
            </strong>{" "}
            from the organization. Their associated roles of Metadata Creator or
            Metadata Approver within this organization will also be revoked.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemoveUser}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Removing User..." : "Yes, Remove User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
