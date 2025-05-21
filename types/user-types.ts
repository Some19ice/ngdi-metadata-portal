import { organizationRoleEnum } from "@/db/schema/users-schema"

// Define UserOrganizationRole based on the enum values
export type UserOrganizationRole =
  (typeof organizationRoleEnum.enumValues)[number]
