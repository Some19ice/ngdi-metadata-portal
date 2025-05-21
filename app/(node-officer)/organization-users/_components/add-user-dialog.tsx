"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { addUserToOrganizationForNOAction } from "@/actions/db/node-officer-actions"
import { roleEnum } from "@/db/schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"

interface AddUserDialogProps {
  orgId: string
  onUserAdded: () => void // Callback to refresh the user list
}

const addUserFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(roleEnum.enumValues).optional() // Optional role assignment
})

type AddUserFormValues = z.infer<typeof addUserFormSchema>

// Roles that a Node Officer can assign initially when adding a user to their org
const assignableRolesByNO = [
  "Metadata Creator",
  "Metadata Approver",
  "Registered User"
] as const

export function AddUserDialog({ orgId, onUserAdded }: AddUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      email: "",
      role: undefined
    }
  })

  const onSubmit = async (values: AddUserFormValues) => {
    startTransition(async () => {
      const result = await addUserToOrganizationForNOAction(
        orgId,
        values.email,
        values.role === "Registered User" ? undefined : values.role // Pass undefined if 'Registered User' to not assign specific role
      )
      if (result.isSuccess) {
        toast.success(result.message)
        onUserAdded() // Call the callback to refresh data
        setIsOpen(false)
        form.reset()
      } else {
        toast.error(result.message || "Failed to add user.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add User to Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User to Organization</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to add to this
            organization. You can optionally assign an initial role.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Role (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Registered User">
                        Registered User (No specific role)
                      </SelectItem>
                      {assignableRolesByNO
                        .filter(r => r !== "Registered User")
                        .map(roleName => (
                          <SelectItem key={roleName} value={roleName}>
                            {roleName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding User..." : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
