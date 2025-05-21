import { z } from "zod"

// Based on InsertMetadataRecord, but adjusted for form input and edit scenarios
export const metadataRecordFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  abstract: z
    .string()
    .min(10, { message: "Abstract must be at least 10 characters." }),
  purpose: z
    .string()
    .min(5, { message: "Purpose must be at least 5 characters." }),
  datasetType: z.string({ required_error: "Dataset type is required." }),
  // organizationId: z.string({ required_error: "Organization is required." }), // Set by backend or parent context
  keywords: z.array(z.string()).optional(), // Assuming keywords are managed as an array of strings
  thumbnailUrl: z
    .string()
    .url({ message: "Invalid URL format." })
    .optional()
    .or(z.literal("")),
  imageName: z.string().optional(),

  // Spatial Information
  westBoundLongitude: z
    .string()
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a valid number."
    })
    .optional()
    .or(z.literal("")),
  eastBoundLongitude: z
    .string()
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a valid number."
    })
    .optional()
    .or(z.literal("")),
  southBoundLatitude: z
    .string()
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a valid number."
    })
    .optional()
    .or(z.literal("")),
  northBoundLatitude: z
    .string()
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a valid number."
    })
    .optional()
    .or(z.literal("")),
  coordinateSystem: z.string().optional(),
  projectionName: z.string().optional(),
  spatialResolution: z.string().optional(),

  // Temporal Information
  productionDate: z.string().optional(), // Expecting YYYY-MM-DD string from date input
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  updateFrequency: z.string().optional(),

  // Distribution Information
  distributionFormatName: z.string().optional(),
  distributionFormatVersion: z.string().optional(),
  accessMethod: z.string().optional(),
  downloadUrl: z
    .string()
    .url({ message: "Invalid URL format." })
    .optional()
    .or(z.literal("")),
  apiUrl: z
    .string()
    .url({ message: "Invalid URL format." })
    .optional()
    .or(z.literal("")),
  licenseType: z.string().optional(),
  usageTerms: z.string().optional(),
  fileFormat: z.string().optional()

  // Note: Fields like 'status', 'creatorUserId', 'organizationId' are typically not part of this form
  // or are handled by the backend action / context.
})

export type MetadataRecordFormValues = z.infer<typeof metadataRecordFormSchema>
