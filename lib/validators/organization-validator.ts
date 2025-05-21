import { z } from "zod"
import { organizationStatusEnum } from "@/db/schema/organizations-schema"

export const organizationFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Organization name must be at least 3 characters." })
    .max(255),
  description: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryContactEmail: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  primaryContactPhone: z.string().optional(),
  websiteUrl: z
    .string()
    .url({ message: "Invalid URL." })
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  logoUrl: z
    .string()
    .url({ message: "Invalid URL for logo." })
    .optional()
    .or(z.literal("")),
  status: z.enum(organizationStatusEnum.enumValues).default("active")
})

export type OrganizationFormData = z.infer<typeof organizationFormSchema>
