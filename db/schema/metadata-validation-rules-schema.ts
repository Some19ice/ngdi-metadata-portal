import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core"
import { metadataStandardsTable } from "./metadata-standards-schema"

export const validationRuleTypeEnum = pgEnum("validation_rule_type", [
  "Regex", // For pattern matching
  "MandatoryField", // Checks if a field is present
  "ValueRange", // For numerical or date ranges
  "ControlledVocabulary", // Checks against a list of allowed values
  "FieldLength", // Checks min/max length of a text field
  "UrlFormat", // Checks if a field is a valid URL
  "CustomLogic" // Placeholder for more complex, potentially code-driven rules
])

export const metadataValidationRulesTable = pgTable(
  "metadata_validation_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metadataStandardId: uuid("metadata_standard_id").references(
      () => metadataStandardsTable.id,
      { onDelete: "cascade" } // If a standard is deleted, its rules are deleted
    ),
    ruleName: text("rule_name").notNull(),
    description: text("description").notNull(),
    ruleType: validationRuleTypeEnum("rule_type").notNull(),
    // Examples for ruleConfiguration based on ruleType:
    // Regex: { "pattern": "^[A-Za-z0-9]+$", "targetField": "title" }
    // MandatoryField: { "fieldName": "abstract" }
    // ValueRange: { "fieldName": "year", "min": 1900, "max": 2100 }
    // ControlledVocabulary: { "fieldName": "datasetType", "allowedValues": ["Vector", "Raster"] }
    // FieldLength: { "fieldName": "title", "minLength": 5, "maxLength": 100 }
    // UrlFormat: { "fieldName": "downloadUrl" }
    ruleConfiguration: jsonb("rule_configuration").notNull(),
    errorMessage: text("error_message").notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  }
)

export type InsertMetadataValidationRule =
  typeof metadataValidationRulesTable.$inferInsert
export type SelectMetadataValidationRule =
  typeof metadataValidationRulesTable.$inferSelect
