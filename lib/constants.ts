export const DATASET_TYPES = [
  "Raster",
  "Vector",
  "Table",
  "Document",
  "Service",
  "Other"
] as const

export const FRAMEWORK_TYPES = ["Fundamental", "Thematic", "Other"] as const

export const STATUS_OPTIONS = [
  "Draft",
  "Submitted for Review", // For Metadata Creator to submit
  "Pending Validation", // For Metadata Approver to see in their queue
  "Needs Revision", // If Approver rejects
  "Approved", // If Approver approves
  "Published", // Final public state
  "Archived"
] as const

export const UPDATE_FREQUENCIES = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Annually",
  "As needed",
  "Not planned",
  "Unknown",
  "Other"
] as const

export const ACCESS_METHODS = [
  "Download",
  "API",
  "Service Endpoint",
  "Physical Media",
  "Online Resource",
  "Other"
] as const

export const LICENSE_TYPES = [
  "Open Data Commons Attribution License (ODC-By)",
  "Open Data Commons Open Database License (ODbL)",
  "Public Domain Dedication and License (PDDL)",
  "Creative Commons CC0",
  "Creative Commons Attribution (CC BY)",
  "Creative Commons Attribution-ShareAlike (CC BY-SA)",
  "Government Open Licence",
  "Proprietary",
  "Restricted",
  "Other"
] as const

export const ITEMS_PER_PAGE = 20
export const SEARCH_RESULTS_PAGE_SIZE = 20
