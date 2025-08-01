"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  OrganizationFormData,
  organizationFormSchema
} from "@/lib/validators/organization-validator"
import { createOrganizationAction } from "@/actions/db/organizations-actions"
import { organizationStatusEnum } from "@/db/schema"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { LabelWithHelp } from "@/components/ui/form-field-with-help"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function CreateOrganizationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      websiteUrl: "",
      address: "",
      logoUrl: "",
      status: "active"
    }
  })

  async function onSubmit(data: OrganizationFormData) {
    startTransition(async () => {
      const result = await createOrganizationAction(data)
      if (result.isSuccess) {
        toast({
          title: "Organization Created",
          description: result.message
        })
        setIsOpen(false)
        form.reset()
        router.refresh()
      } else {
        toast({
          title: "Error Creating Organization",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New Organization</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new organization to the portal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <LabelWithHelp helpKey="organizationName" required>
                    Organization Name
                  </LabelWithHelp>
                  <FormControl>
                    <Input
                      placeholder="e.g., National Mapping Agency"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <LabelWithHelp helpKey="organizationDescription">
                    Description
                  </LabelWithHelp>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the organization"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="primaryContactName"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithHelp helpKey="organizationContactName">
                      Contact Name
                    </LabelWithHelp>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithHelp helpKey="organizationContactEmail">
                      Contact Email
                    </LabelWithHelp>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="primaryContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithHelp helpKey="organizationContactPhone">
                      Contact Phone
                    </LabelWithHelp>
                    <FormControl>
                      <Input placeholder="+234-1-234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithHelp helpKey="organizationWebsite">
                      Website URL
                    </LabelWithHelp>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <LabelWithHelp helpKey="organizationAddress">
                    Address
                  </LabelWithHelp>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main St, Anytown, Country"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <LabelWithHelp helpKey="organizationLogo">
                    Logo URL
                  </LabelWithHelp>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <LabelWithHelp helpKey="organizationStatus">
                    Status
                  </LabelWithHelp>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationStatusEnum.enumValues.map(statusValue => (
                        <SelectItem key={statusValue} value={statusValue}>
                          {statusValue.charAt(0).toUpperCase() +
                            statusValue.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
