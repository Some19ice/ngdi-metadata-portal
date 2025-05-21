# Metadata Form Update Plan

_Exported on 5/20/2025 at 01:40:16 GMT+1 from Cursor (0.50.5)_

---

**User**

I want to update the metadata createtion form using the @data-models.md
Review and create a plan

---

**Cursor**

Okay, I understand you want to update the metadata creation form to align with the specifications in `docs/data-models.md`. This is a good step to ensure consistency between your database schema and the user interface.

Here's a plan to approach this:

**Phase 1: Detailed Analysis and Comparison**

1.  **Extract `metadataRecords` Schema from `docs/data-models.md`:**

    - I will carefully read `docs/data-models.md` and list all columns specified for the `metadataRecords` table. For each column, I'll note its name, data type (SQL type, and how it might translate to TypeScript/Zod), constraints (e.g., `NOT NULL`), and the description provided. I will pay special attention to JSONB fields and their intended structures.

2.  **Cross-Reference with Existing UI Form Fields:**

    - I will use the information previously gathered in `docs/cursor_metadata_fields_and_descriptions.md` (which details the current UI form fields and their descriptions from files like `general-info-form.tsx`, `technical-details-form.tsx`, etc.).
    - I will create a detailed mapping, comparing each field from `docs/data-models.md` to the existing UI form fields.

3.  **Identify Discrepancies:**
    - **Missing Fields:** Identify fields present in `docs/data-models.md` but not currently in the UI form.
    - **Extra Fields:** Identify fields present in the UI form but not in `docs/data-models.md` (these might need removal or discussion).
    - **Name/Label Mismatches:** Differences in naming or labeling.
    - **Type Mismatches:** Differences in expected data types (e.g., a field is `TEXT` in the DB but the form uses a number input, or a JSONB structure in the DB needs a specific set of form inputs).
    - **Description/Tooltip Mismatches:** Differences in descriptive text or helper tooltips.
    - **Structural Differences in JSONB fields:** The `data-models.md` defines specific structures for JSONB fields like `locationInfo`, `spatialInfo`, `temporalInfo`, etc. I need to compare these structures with how the form currently collects this data.

**Phase 2: Planning UI Form Updates**

Based on the discrepancies identified in Phase 1:

1.  **Update Form Components:**
    For each relevant form component (e.g., `general-info-form.tsx`, `technical-details-form.tsx`, `data-quality-form.tsx`, `access-info-form.tsx` located in `app/(app)/metadata/create/_components/` (assuming path based on recent refactor)):

    - **Add Missing Fields:** Incorporate new `FormField` components for fields required by `data-models.md`. This includes choosing appropriate input types (text, select, date picker, checkboxes for arrays, nested forms for JSONB structures).
    - **Remove Unnecessary Fields:** Remove form fields that are not backed by `data-models.md`.
    - **Modify Existing Fields:** Adjust labels, descriptions, tooltips, input types, and validation rules (Zod schema) to match `data-models.md`.
    - **Handle JSONB Structures:** This is crucial. For fields like `locationInfo`, `spatialInfo`, `constraintsInfo`, etc., the form will need to be structured to collect the nested data as defined in `data-models.md`. This might involve creating sub-forms or groups of related inputs.

2.  **Update Main Form Logic (`metadata-form.tsx`):**
    - The Zod schema used for overall form validation (`app/(app)/metadata/create/_components/metadata-form.tsx`) will need to be updated to reflect the new field structure and types from `data-models.md`.
    - Default values for the form might also need adjustment.
    - The multi-step navigation and grouping might need to be revisited if the new fields don't fit neatly into the current steps.

**Phase 3: Planning Backend Updates**

1.  **Update Drizzle Schema (`db/schema/metadata-schema.ts` or similar):**

    - I'll need to locate your Drizzle schema file for metadata.
    - This schema must be updated to perfectly match the `metadataRecords` table definition in `docs/data-models.md`. This includes adding/removing columns, changing types (e.g., `text`, `varchar`, `jsonb`, `date`, `text[]`), and defining constraints.
    - Ensure the Drizzle schema exports the correct `InsertMetadata` and `SelectMetadata` types.

2.  **Update Server Actions (e.g., `actions/db/metadata-actions.ts`):**
    - The server actions responsible for creating and updating metadata records will need to be revised:
      - To accept the new/modified data structure (matching the `InsertMetadata` type from the updated Drizzle schema).
      - To correctly map form data to the database columns, especially for JSONB fields.
      - Ensure that any data transformations or validations happening in the actions are consistent with the new model.

**Phase 4: Review and Execution Strategy**

1.  **Present Detailed Findings:** I will present you with a comprehensive list of changes required for each file (UI components, Zod schemas, Drizzle schema, server actions).
2.  **Iterative Implementation:** We can tackle the changes section by section (e.g., update "General Information" fields first, then "Technical Details," etc.) or file by file.
3.  **Validation:** Throughout the process, ensuring that the Zod schemas in the frontend, the Drizzle schema in the backend, and the actual database structure are all in sync will be critical.

**Next Steps:**

1.  I will begin by thoroughly analyzing `docs/data-models.md` and creating the detailed comparison with the current UI forms as outlined in **Phase 1**.
2.  Once this analysis is complete, I will present the specific findings and the proposed changes for each part of the system.

This will be a multi-step process. Let's start with the analysis. I will get back to you once I have a detailed comparison.

I have reviewed the `docs/data-models.md` and compared it with the previously extracted UI form fields from `docs/cursor_metadata_fields_and_descriptions.md`.

Here's a summary of the analysis and the plan for updating your metadata creation form.

**Key Observations:**

1.  **Source of Truth:** `docs/data-models.md` provides a detailed specification for the `metadataRecords` table, including many JSONB fields with nested structures.
2.  **Existing UI:** The current UI, as detailed in `docs/cursor_metadata_fields_and_descriptions.md`, already captures many fields, but there are differences in structure, naming, and completeness compared to `docs/data-models.md`.
3.  **JSONB Fields:** `docs/data-models.md` heavily relies on JSONB fields (`locationInfo`, `spatialInfo`, `temporalInfo`, `technicalDetailsInfo`, `constraintsInfo`, `dataQualityInfo`, `processingInfo`, `distributionInfo`, `metadataReferenceInfo`, `fundamentalDatasetsInfo`, `additionalInfo`). The UI forms will need significant restructuring to accurately capture these nested objects.
4.  **Field Granularity:** `docs/data-models.md` is more granular for some sections (e.g., `dataQualityInfo` has very specific sub-fields for horizontal and vertical accuracy).

**High-Level Plan:**

The overall goal is to make the metadata creation form in `app/(app)/metadata/create/_components/` accurately reflect the structure and fields defined in `docs/data-models.md` for the `metadataRecords` table.

**Phase 1: Backend Schema Alignment (Drizzle)**

- **Action:** Update the Drizzle schema for `metadataRecords` (likely in a file such as `db/schema/metadata-schema.ts` or similar) to perfectly match the columns, types, and JSONB structures defined in `docs/data-models.md`.
  - This includes defining appropriate TypeScript types for the JSONB objects.
  - Ensure `createdAt` and `updatedAt` are handled as per conventions.
  - Export `InsertMetadataRecord` and `SelectMetadataRecord` types.
- **Why:** The backend must be the source of truth for data structure.

**Phase 2: Form State and Validation (Zod Schema in `metadata-form.tsx`)**

- **Action:** Update the main Zod schema within `app/(app)/metadata/create/_components/metadata-form.tsx`.
  - This schema should now mirror the `InsertMetadataRecord` type derived from the updated Drizzle schema.
  - Define Zod objects for each JSONB field to validate their nested structures.
- **Why:** Ensures data collected from the form matches what the backend expects.

**Phase 3: UI Form Component Updates**

We'll need to go through each section of the form and update/create components. The existing multi-step structure (`GeneralInfoForm`, `TechnicalDetailsForm`, etc.) can likely be adapted.

1.  **`general-info-form.tsx` (and potentially new components for better organization)**

    - **Compare with `data-models.md` section for:** `id` (usually auto-generated, not on form), `title`, `dataType`, `abstract`, `purpose`, `creatorUserId` (likely from auth, not direct form input), `organizationId` (may be from user context or selection), `status` (workflow-managed, not direct input at creation usually), `version`, `language`, `assessment`, `updateFrequency`, `productionDate`, `publicationDate`, `lastRevisionDate`, `keywords` (array), `thumbnailUrl`, `cloudCoverPercentage`, `frameworkType`.
    - **Specific Focus on JSONB fields from `data-models.md` that might fit here:**
      - `locationInfo`: `{ country, geopoliticalZone, state, lga, townCity }` - Current UI has these as separate fields. Consolidate how they are handled in the form state to match the JSONB structure.
      - `temporalInfo`: `{ dateFrom, dateTo }` - Current UI has `dateFrom`, `dateTo`. Ensure these map to this structure.
      - `fundamentalDatasetsInfo`: `{ geodeticData: boolean, ... }` - Current UI has checkboxes. Ensure this maps to the JSONB structure.
    - **Action:**
      - Add/remove/modify `FormField` components.
      - Update labels, descriptions, tooltips.
      - For `keywords` (TEXT[]), use an appropriate multi-select or tag input.
      - Group inputs for JSONB fields logically.

2.  **`technical-details-form.tsx` (and potentially new components)**

    - **Compare with `data-models.md` section for:** (This form might need to be split or reorganized significantly based on `data-models.md`)
    - **Specific Focus on JSONB fields from `data-models.md`:**
      - `spatialInfo`: `{ coordinateSystem, projection, scale, resolution, coordinateUnit, minLatitude, minLongitude, maxLatitude, maxLongitude, spatialRepresentationType }` - Current UI has many of these as separate fields. Consolidate.
      - `technicalDetailsInfo`: `{ fileFormat, fileSizeMB, numFeaturesOrLayers, softwareHardwareRequirements }` - Current UI has similar fields. Align naming and structure.
      - `constraintsInfo`: `{ accessConstraints, useConstraints, otherConstraints }` - Current UI has these. Align.
    - **Action:**
      - Major restructuring might be needed here. Add/remove/modify `FormField` components.
      - Update labels, descriptions, tooltips.

3.  **`data-quality-form.tsx` (and potentially new components)**

    - **Compare with `data-models.md` section for:**
    - **Specific Focus on JSONB fields from `data-models.md`:**
      - `dataQualityInfo`: Contains `logicalConsistencyReport`, `completenessReport`, and detailed structures for `attributeAccuracyReport`, `horizontalAccuracyReport` (with percentage, explanation), `verticalAccuracyReport` (with percentage, explanation).
      - `processingInfo`: Contains `processingStepsDescription`, `softwareAndVersionUsed`, `processedDate`, processor contact details, and source information (`sourceScaleDenominator`, `sourceMediaType`, `sourceCitation`, `citationTitle`, `contractReference`, `contractDate`).
    - **Action:**
      - This form will need significant updates to capture the nested details in `dataQualityInfo` and `processingInfo`.
      - Consider splitting `processingInfo` (especially processor contact and source info) into its own form step or sub-section if it becomes too long.
      - Add/remove/modify `FormField` components.

4.  **`access-info-form.tsx` (and potentially new components)**

    - **Compare with `data-models.md` section for:**
    - **Specific Focus on JSONB fields from `data-models.md`:**
      - `distributionInfo`: Contains `distributionFormat`, `accessMethod`, `downloadUrl`, `apiEndpoint`, license info (`licenseType`, `usageTerms`, `attributionRequirements`, `accessRestrictions` as array), and distribution contact details.
      - `metadataReferenceInfo`: Contains `metadataCreationDate`, `metadataReviewDate`, and metadata POC contact details.
    - **Action:**
      - Update fields for distribution and licensing. The current UI has many of these. Align structure, especially for `accessRestrictions` (array) and the contact details within.
      - Ensure metadata POC details are captured as per `metadataReferenceInfo`.

5.  **New Form for `additionalInfo` (JSONB):**
    - `docs/data-models.md` includes an `additionalInfo: JSONB` field for "Any other relevant information".
    - **Action:** Decide if and how to implement this. It could be a simple key-value pair editor or a textarea for unstructured JSON. For a first pass, it might be omitted or be a simple textarea.

**Phase 4: Server Action Updates**

- **Action:** Update the `createMetadataRecordAction` (and any update action) in your metadata server actions file.
  - It must now accept a payload that matches the new `InsertMetadataRecord` type (derived from the updated Drizzle schema).
  - Ensure data, especially the structured JSONB fields, is correctly passed to `db.insert(metadataRecordsTable).values(...)`.
- **Why:** The backend logic must correctly process and store the new data structure.

**Detailed Next Steps (How I will proceed):**

1.  **Provide Drizzle Schema Snippet:** I will first try to locate your existing metadata Drizzle schema. If found, I will propose the necessary modifications to align it with `docs/data-models.md`. If not easily found, I will provide a new Drizzle schema snippet based on `docs/data-models.md`.
2.  **Provide Zod Schema Snippet:** Based on the (new/updated) Drizzle schema, I will provide the structure for the main Zod schema in `metadata-form.tsx`.
3.  **Iterate Through UI Form Components:** For each UI form section (`GeneralInfoForm`, etc.):
    - I will list the fields from `docs/data-models.md` that should be covered.
    - I will compare this to the existing fields (from `docs/cursor_metadata_fields_and_descriptions.md`).
    - I will propose specific changes: fields to add, remove, or modify, including input types and how to handle JSONB structures. This will involve generating new `FormField` blocks.
4.  **Provide Server Action Guidance:** I will outline the necessary adjustments to your metadata server actions.

This is a significant refactoring task. We should proceed methodically.

**To start, can you point me to your Drizzle schema file that defines the `metadataRecords` table?** Knowing its current structure will help in suggesting precise changes. If you don't have one yet for `metadataRecords` that you're working with, I can generate a new one based on `docs/data-models.md`.

---

**User**

Search the codebase for the current structure

---

**Cursor**

Okay, I will search the codebase for the Drizzle schema file that defines the current structure for metadata records. I'll look for files typically named `metadata-schema.ts`, or similar, within the `db/schema/` directory.

The search results point to `db/schema/metadata-records-schema.ts` as the primary file defining the Drizzle schema for metadata records. It also includes a `metadataChangeLogsTable`.

I will now read this file to understand its current structure.

I have read the `db/schema/metadata-records-schema.ts` file. This is the current Drizzle schema for your `metadata_records` table.

Now I will compare this existing Drizzle schema with the `metadataRecords` table definition in `docs/data-models.md`.

**Comparison and Discrepancy Analysis:**

**General Observations:**

- The existing Drizzle schema (`metadata-records-schema.ts`) is quite comprehensive and already includes many fields mentioned in `docs/data-models.md` and `docs/NGDI_Portal_PRD.md`.
- The existing schema uses comments like `// Identification & General Information (from PRD 5.1)`, which is helpful for mapping.
- `docs/data-models.md` is more explicit about the _structure_ within JSONB fields.
- There are some differences in naming, types, and presence of certain fields.

**Field-by-Field Comparison (Highlights of Differences):**

| `docs/data-models.md` Field           | Type in `data-models.md`           | Current Drizzle Schema Field                                                                                                                   | Current Drizzle Type                            | Notes & Discrepancies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :------------------------------------ | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                  | `UUID`                             | `id`                                                                                                                                           | `uuid`                                          | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `title`                               | `TEXT NOT NULL`                    | `title`                                                                                                                                        | `text.notNull()`                                | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `dataType`                            | `VARCHAR(50) NOT NULL`             | `datasetType`                                                                                                                                  | `text`                                          | **Action:** Change Drizzle type to `datasetTypeEnum` (already defined in the schema file!) and make it `.notNull()`. In `data-models.md` it's `VARCHAR(50)`, `datasetTypeEnum` is a good way to enforce allowed values. Rename Drizzle field to `dataType`.                                                                                                                                                                                                                                                                           |
| `abstract`                            | `TEXT NOT NULL`                    | `abstract`                                                                                                                                     | `text.notNull()`                                | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `purpose`                             | `TEXT`                             | `purpose`                                                                                                                                      | `text`                                          | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `creatorUserId`                       | `TEXT NOT NULL`                    | `creatorUserId`                                                                                                                                | `text.notNull()`                                | Match. (Commented out `references` can be kept or removed based on FK strategy).                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `organizationId`                      | `UUID REFERENCES orgs`             | `organizationId`                                                                                                                               | `uuid.notNull()`                                | Match. (References `organizationsTable`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `status`                              | `VARCHAR(50) NOT NULL DEF 'draft'` | `status`                                                                                                                                       | `metadataStatusEnum.notNull().default("Draft")` | Match. (Using enum is good).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `version`                             | `VARCHAR(50)`                      | `edition`                                                                                                                                      | `text`                                          | **Action:** Rename Drizzle `edition` to `version`. Type `text` for `VARCHAR(50)` is acceptable in Drizzle.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `language`                            | `VARCHAR(10) NOT NULL DEF 'en'`    | `language`                                                                                                                                     | `text`                                          | **Action:** Add `.notNull().default("en")` to Drizzle `language`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `assessment`                          | `VARCHAR(50)`                      | `assessmentCompletionStatus`                                                                                                                   | `text`                                          | **Action:** Rename Drizzle `assessmentCompletionStatus` to `assessment`.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `updateFrequency`                     | `VARCHAR(50)`                      | `updateFrequency`                                                                                                                              | `text`                                          | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `productionDate`                      | `DATE`                             | `productionDate`                                                                                                                               | `date`                                          | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `publicationDate` (from data-models)  | `DATE`                             | `publicationDate` (from PRD 5.9 section in schema)                                                                                             | `timestamp`                                     | **Action:** Change Drizzle `publicationDate` type to `date`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `lastRevisionDate`                    | `DATE`                             | _Not explicitly present_                                                                                                                       |                                                 | **Action:** Add `lastRevisionDate: date("last_revision_date")` to Drizzle schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `keywords`                            | `TEXT[]`                           | `keywords`                                                                                                                                     | `jsonb`                                         | **Action:** Change Drizzle `keywords` type to `text("keywords").array()`. JSONB could work, but `TEXT[]` is more specific if it's just an array of strings.                                                                                                                                                                                                                                                                                                                                                                           |
| `thumbnailUrl`                        | `VARCHAR(255)`                     | `thumbnailUrl`                                                                                                                                 | `text`                                          | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cloudCoverPercentage`                | `INTEGER`                          | `cloudCover`                                                                                                                                   | `text`                                          | **Action:** Rename Drizzle `cloudCover` to `cloudCoverPercentage`. Change type to `integer("cloud_cover_percentage")`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `frameworkType`                       | `VARCHAR(100)`                     | `frameworkType`                                                                                                                                | `text`                                          | Match conceptually (using Drizzle's `frameworkTypeEnum` might be better if values are constrained). `frameworkTypeEnum` exists in the schema, consider using it. For now, align name if `frameworkTypeEnum` is not used.                                                                                                                                                                                                                                                                                                              |
| `locationInfo`                        | `JSONB`                            | `geographicLocation`                                                                                                                           | `jsonb`                                         | **Action:** Rename Drizzle `geographicLocation` to `locationInfo`. **Crucially, define a TypeScript interface/type for the structure** (`country`, `geopoliticalZone`, `state`, `lga`, `townCity`) and use `jsonb<LocationInfoType>("location_info")`.                                                                                                                                                                                                                                                                                |
| `spatialInfo`                         | `JSONB`                            | _Multiple separate fields_                                                                                                                     | `doublePrecision`, `text`                       | **Action:** Consolidate Drizzle fields (`spatialRepresentationType`, `southBoundLatitude`, `northBoundLatitude`, `westBoundLongitude`, `eastBoundLongitude`, `spatialResolution`, `equivalentScale`, `coordinateUnit`, `projectionName`, `coordinateSystem`, `datum`) into a single `spatialInfo: jsonb<SpatialInfoType>("spatial_info")`. Define `SpatialInfoType`.                                                                                                                                                                  |
| `temporalInfo`                        | `JSONB`                            | `dateFrom`, `dateTo` (separate)                                                                                                                | `date`                                          | **Action:** Consolidate Drizzle `dateFrom` and `dateTo` into `temporalInfo: jsonb<TemporalInfoType>("temporal_info")`. Define `TemporalInfoType`. (`citationDates`, `availableTimePeriod`, `plannedAvailableDateTime`, `dateInfo` in current schema might also fit here or be separate). `docs/data-models.md` specifies `temporalInfo: {dateFrom, dateTo}`.                                                                                                                                                                          |
| `technicalDetailsInfo`                | `JSONB`                            | `fileFormat`, `fileSize`, `numberOfFeatures` (separate), `technicalPrerequisites`                                                              | `text`                                          | **Action:** Consolidate `fileFormat`, `fileSize`, `numberOfFeatures` (rename from `numberOfFeatures` to `numFeaturesOrLayers`) into `technicalDetailsInfo: jsonb<TechnicalDetailsInfoType>("technical_details_info")`. `softwareHardwareRequirements` is missing. Add it to the `TechnicalDetailsInfoType`. The existing `technicalPrerequisites` field can be moved into `constraintsInfo`.                                                                                                                                          |
| `constraintsInfo`                     | `JSONB`                            | `accessRestrictions` (jsonb), `distributionLiability` (text), `usageTerms` (text)                                                              | `jsonb`, `text`                                 | **Action:** Consolidate into `constraintsInfo: jsonb<ConstraintsInfoType>("constraints_info")` with structure `{ accessConstraints, useConstraints, otherConstraints }`. The current Drizzle `accessRestrictions` seems to be an array of strings; `docs/data-models.md` is similar. `docs/data-models.md` has `accessConstraints` (text), `useConstraints` (text), `otherConstraints` (text).                                                                                                                                        |
| `dataQualityInfo`                     | `JSONB`                            | `logicalConsistencyReport`, `completenessReport`, `attributeAccuracyReport` (text), `positionalAccuracy` (jsonb), `typeOfSourceMedia` (text)   | `text`, `jsonb`                                 | **Action:** Consolidate these into `dataQualityInfo: jsonb<DataQualityInfoType>("data_quality_info")`. The structure in `docs/data-models.md` is very detailed (reports, percentages, explanations for positional accuracy). This needs careful typing.                                                                                                                                                                                                                                                                               |
| `processingInfo`                      | `JSONB`                            | `sourceCitation`, `sourceContribution`, `contractGrantReference`, `resourceLineageStatement`, `processSteps` (jsonb), `processContact` (jsonb) | `text`, `jsonb`                                 | **Action:** Consolidate into `processingInfo: jsonb<ProcessingInfoType>("processing_info")`. Structure from `docs/data-models.md` includes processing steps, software, date, processor contact, and source info (scale, media, citation, title, contract).                                                                                                                                                                                                                                                                            |
| `distributionInfo` (from data-models) | `JSONB`                            | `distributionInfo` (jsonb), many separate PRD 5.5 fields                                                                                       | `jsonb`, `text`                                 | **Action:** Consolidate relevant separate fields (e.g., `downloadUrl`, `apiEndpoint`, `licenseType`, `usageTerms`, `attributionRequirements`) into `distributionInfo: jsonb<DistributionInfoType>("distribution_info")`. The structure in `docs/data-models.md` includes format, access method, URLs, license info, and distribution contact. The current schema has a generic `distributionInfo` and many specific text fields (e.g., `distributorNamePrd`, `orderingInstructions`). These need to be mapped to the JSONB structure. |
| `metadataReferenceInfo`               | `JSONB`                            | `metadataContact` (jsonb), `metadataReviewDate` (date), `metadataLinkage` (text)                                                               | `jsonb`, `date`, `text`                         | **Action:** Consolidate into `metadataReferenceInfo: jsonb<MetadataReferenceInfoType>("metadata_reference_info")`. Structure from `docs/data-models.md` includes creation date, review date, and POC details.                                                                                                                                                                                                                                                                                                                         |
| `fundamentalDatasetsInfo`             | `JSONB`                            | `fundamentalDatasetsInfo`                                                                                                                      | `jsonb`                                         | Match (conceptually). **Action:** Ensure the TS type for this JSONB matches the boolean structure in `docs/data-models.md`.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `additionalInfo`                      | `JSONB`                            | _Not present_                                                                                                                                  |                                                 | **Action:** Add `additionalInfo: jsonb("additional_info")` to Drizzle schema. Define a flexible type or `unknown`.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `createdAt`                           | `TIMESTAMPTZ DEF NOW NN`           | `createdAt`                                                                                                                                    | `timestamp.defaultNow().notNull()`              | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `updatedAt`                           | `TIMESTAMPTZ DEF NOW NN`           | `updatedAt`                                                                                                                                    | `timestamp.defaultNow().notNull().$onUpdate()`  | Match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Summary of Actions for Drizzle Schema (`db/schema/metadata-records-schema.ts`):**

1.  **Define TypeScript Interfaces/Types:** For each JSONB field specified in `docs/data-models.md` (`LocationInfo`, `SpatialInfo`, `TemporalInfo`, `TechnicalDetailsInfo`, `ConstraintsInfo`, `DataQualityInfo`, `ProcessingInfo`, `DistributionInfo`, `MetadataReferenceInfo`, `FundamentalDatasetsInfo`), create a corresponding TypeScript interface/type.
2.  **Update `metadataRecordsTable`:**
    - Rename fields: `datasetType` to `dataType`, `edition` to `version`, `assessmentCompletionStatus` to `assessment`, `geographicLocation` to `locationInfo`, `cloudCover` to `cloudCoverPercentage`.
    - Change types:
      - `dataType` to use `datasetTypeEnum.notNull()` (enum already exists).
      - `language` to `text("language").notNull().default("en")`.
      - `keywords` to `text("keywords").array()`.
      - `cloudCoverPercentage` to `integer("cloud_cover_percentage")`.
      - `publicationDate` to `date("publication_date")`.
    - Add missing fields: `lastRevisionDate: date("last_revision_date")`, `additionalInfo: jsonb("additional_info")`.
    - Consolidate fields into JSONB columns using the defined TypeScript types:
      - `spatialInfo`
      - `temporalInfo` (review existing date/time fields for inclusion)
      - `technicalDetailsInfo`
      - `constraintsInfo`
      - `dataQualityInfo`
      - `processingInfo`
      - `distributionInfo`
      - `metadataReferenceInfo`
    - Remove Drizzle fields that are consolidated into new JSONB structures (e.g., remove `southBoundLatitude` if it's now part of `spatialInfo: jsonb<SpatialInfoType>`). This requires careful checking.
3.  **Review Enums:** The existing enums (`metadataStatusEnum`, `datasetTypeEnum`, `frameworkTypeEnum`) are good. Ensure they align with any specific values expected by `docs/data-models.md` or the UI. For example, `datasetTypeEnum` can be used for the `dataType` field.

**Proposed Drizzle Schema Structure Snippet (Illustrative for JSONB):**

This is a conceptual example of how a JSONB field would look with a defined type.

```typescript
// Example: Define TypeScript interface for LocationInfo
export interface LocationInfo {
  country: string | null;
  geopoliticalZone: string | null;
  state: string | null;
  lga: string | null;
  townCity: string | null;
}

// In metadataRecordsTable
// ...
locationInfo: jsonb<LocationInfo>("location_info"),
// ... other fields ...

// Similarly for SpatialInfo, TemporalInfo etc.
export interface SpatialInfo {
  coordinateSystem: string | null;
  projection: string | null;
  scale: number | null; // Assuming scale denominator is a number
  resolution: string | null;
  coordinateUnit: "DD" | "DMS" | null;
  minLatitude: number | null;
  minLongitude: number | null;
  maxLatitude: number | null;
  maxLongitude: number | null;
  spatialRepresentationType: string | null; // Could be an enum: "Image", "Point", etc.
}

// ... and so on for all JSONB structures from data-models.md
```

**Next Steps in the Plan (After Drizzle Schema Update):**

1.  **Update Zod Schema:** The main Zod schema in `app/(app)/metadata/create/_components/metadata-form.tsx` needs to be updated to match the new `InsertMetadataRecord` type (derived from the modified Drizzle schema), including nested Zod objects for the JSONB fields.
2.  **Update UI Form Components:** Systematically go through each form component (`GeneralInfoForm.tsx`, `TechnicalDetailsForm.tsx`, etc.) and:
    - Add, remove, or modify `FormField` components.
    - Update input types, labels, descriptions, and tooltips.
    - Implement UI elements to capture data for the structured JSONB fields (e.g., groups of inputs, potentially dynamic forms for arrays within JSON).
3.  **Update Server Actions:** Modify `createMetadataRecordAction` and any update actions to handle the new data structure.

This is a detailed breakdown of the Drizzle schema changes.

**Shall I proceed to generate the complete updated Drizzle schema for `metadataRecordsTable` based on this analysis and `docs/data-models.md`?** This will involve defining all the necessary TypeScript interfaces for the JSONB fields as well. This will be a large code block.Okay, I will generate the updated Drizzle schema for `metadataRecordsTable` based on the analysis and the structure defined in `docs/data-models.md`. This will include defining TypeScript interfaces for the JSONB fields.

This will be a comprehensive update to your `db/schema/metadata-records-schema.ts` file.

```typescript
import { relations } from "drizzle-orm"
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  date,
  boolean, // Keep if used by other enums or directly
  doublePrecision, // Keep if used by other enums or directly
  integer
} from "drizzle-orm/pg-core"
import { organizationsTable } from "./organizations-schema"

// --- Enums (Assuming these are defined as in your existing file) ---
export const metadataStatusEnum = pgEnum("metadata_status", [
  "Draft",
  "Pending Validation",
  "Needs Revision",
  "Approved",
  "Published",
  "Archived"
])

export const datasetTypeEnum = pgEnum("dataset_type_enum", [
  // Renamed to avoid conflict if 'dataType' field uses it
  "Raster",
  "Vector",
  "Table",
  "Service",
  "Application",
  "Document",
  "Collection",
  "Other"
])

export const frameworkTypeEnum = pgEnum("framework_type_enum", [
  // Renamed if used directly
  "Fundamental",
  "Thematic",
  "Special Interest",
  "Administrative",
  "Other"
])

export const metadataLogActionTypeEnum = pgEnum("metadata_log_action_type", [
  "CreateRecord",
  "UpdateField",
  "DeleteRecord",
  "StatusChange",
  "SubmittedForValidation",
  "ApprovedRecord",
  "RejectedRecord",
  "RevisionSubmitted",
  "Other"
])

// --- TypeScript Interfaces for JSONB fields based on docs/data-models.md ---

export interface LocationInfo {
  country: string | null // e.g., "Nigeria"
  geopoliticalZone: string | null
  state: string | null
  lga: string | null
  townCity: string | null
}

export interface SpatialInfo {
  coordinateSystem: string | null
  projection: string | null
  scale: number | null // Denominator as integer
  resolution: string | null // e.g., "30m"
  coordinateUnit: "DD" | "DMS" | null
  minLatitude: number | null
  minLongitude: number | null
  maxLatitude: number | null
  maxLongitude: number | null
  spatialRepresentationType: string | null // e.g., "Image", "Point"
}

export interface TemporalInfo {
  dateFrom: string | null // ISO Date string
  dateTo: string | null // ISO Date string
}

export interface TechnicalDetailsInfo {
  fileFormat: string | null // e.g., "GeoTIFF", "Shapefile"
  fileSizeMB: number | null
  numFeaturesOrLayers: number | null
  softwareHardwareRequirements: string | null
}

export interface ConstraintsInfo {
  accessConstraints: string | null
  useConstraints: string | null
  otherConstraints: string | null
}

export interface PositionalAccuracyDetail {
  accuracyReport: string | null
  accuracyPercentage: number | null
  accuracyExplanation: string | null
}

export interface DataQualityInfo {
  logicalConsistencyReport: string | null
  completenessReport: string | null
  attributeAccuracyReport: string | null
  horizontalAccuracy: PositionalAccuracyDetail | null
  verticalAccuracy: PositionalAccuracyDetail | null
}

export interface ProcessorContact {
  processorName: string | null
  processorEmail: string | null
  processorAddress: string | null
}

export interface SourceInfo {
  sourceScaleDenominator: number | null
  sourceMediaType: string | null
  sourceCitation: string | null
  citationTitle: string | null
  contractReference: string | null
  contractDate: string | null // ISO Date string
}

export interface ProcessingInfo {
  processingStepsDescription: string | null
  softwareAndVersionUsed: string | null
  processedDate: string | null // ISO Date string
  processorContact: ProcessorContact | null
  sourceInfo: SourceInfo | null
}

export interface DistributionContact {
  contactPersonOffice: string | null
  email: string | null
  departmentUnit: string | null
  phoneNumber: string | null
}

export interface LicenseInfo {
  licenseType: string | null
  usageTerms: string | null
  attributionRequirements: string | null
  accessRestrictions: string[] | null // Array of selected strings
}

export interface DistributionInfo {
  distributionFormat: string | null
  accessMethod: string | null // e.g., "Download", "API"
  downloadUrl: string | null
  apiEndpoint: string | null
  licenseInfo: LicenseInfo | null
  distributionContact: DistributionContact | null
}

export interface MetadataPoc {
  contactName_metadataPOC: string | null
  address_metadataPOC: string | null
  email_metadataPOC: string | null
  phoneNumber_metadataPOC: string | null
}

export interface MetadataReferenceInfo {
  metadataCreationDate: string | null // ISO Date string
  metadataReviewDate: string | null // ISO Date string
  metadataPoc: MetadataPoc | null
}

export interface FundamentalDatasetsInfo {
  geodeticData: boolean | null
  topographicData: boolean | null
  cadastralData: boolean | null // Assuming based on common fundamental types
  administrativeBoundaries: boolean | null
  hydrographicData: boolean | null
  landUseLandCover: boolean | null
  geologicalData: boolean | null
  demographicData: boolean | null
  digitalImagery: boolean | null
  transportationData: boolean | null
  others: boolean | null
  othersSpecify: string | null
}

// --- Main metadataRecordsTable ---
export const metadataRecordsTable = pgTable("metadata_records", {
  // Core Fields
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  dataType: text("data_type").notNull(), // Renamed from datasetType, consider using datasetTypeEnum
  abstract: text("abstract").notNull(),
  purpose: text("purpose"),
  creatorUserId: text("creator_user_id").notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  status: metadataStatusEnum("status").default("Draft").notNull(),
  version: text("version"), // Renamed from edition
  language: text("language").default("en").notNull(),
  assessment: text("assessment"), // Renamed from assessmentCompletionStatus
  updateFrequency: text("update_frequency"),
  productionDate: date("production_date"), // Date when the dataset was created or produced
  publicationDate: date("publication_date"), // Date of data publication
  lastRevisionDate: date("last_revision_date"), // Date of last data revision
  keywords: text("keywords").array(), // Array of keywords for searchability
  thumbnailUrl: text("thumbnail_url"),
  cloudCoverPercentage: integer("cloud_cover_percentage"),
  frameworkType: text("framework_type"), // Consider frameworkTypeEnum

  // JSONB Fields from data-models.md
  locationInfo: jsonb<LocationInfo>("location_info"),
  spatialInfo: jsonb<SpatialInfo>("spatial_info"),
  temporalInfo: jsonb<TemporalInfo>("temporal_info"),
  technicalDetailsInfo: jsonb<TechnicalDetailsInfo>("technical_details_info"),
  constraintsInfo: jsonb<ConstraintsInfo>("constraints_info"),
  dataQualityInfo: jsonb<DataQualityInfo>("data_quality_info"),
  processingInfo: jsonb<ProcessingInfo>("processing_info"),
  distributionInfo: jsonb<DistributionInfo>("distribution_info"),
  metadataReferenceInfo: jsonb<MetadataReferenceInfo>(
    "metadata_reference_info"
  ),
  fundamentalDatasetsInfo: jsonb<FundamentalDatasetsInfo>(
    "fundamental_datasets_info"
  ),
  additionalInfo: jsonb("additional_info"), // For any other relevant information

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// --- Relations ---
export const metadataRecordsRelations = relations(
  metadataRecordsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [metadataRecordsTable.organizationId],
      references: [organizationsTable.id]
    }),
    changeLogs: many(metadataChangeLogsTable)
    // Add relation to usersTable if you have one for creatorUserId
    // creator: one(usersTable, {
    //   fields: [metadataRecordsTable.creatorUserId],
    //   references: [usersTable.clerkId], // or usersTable.id if it's a UUID
    // }),
  })
)

// --- Change Logs Table (Assuming structure is mostly fine) ---
export const metadataChangeLogsTable = pgTable("metadata_change_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  metadataRecordId: uuid("metadata_record_id")
    .references(() => metadataRecordsTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(), // User ID from Clerk
  actionType: metadataLogActionTypeEnum("action_type").notNull(),
  changedFields: jsonb("changed_fields"), // from data-models.md (used to be separate text fields)
  oldStatus: text("old_status"), // from data-models.md
  newStatus: text("new_status"), // from data-models.md
  comments: text("comments"), // from data-models.md
  details: jsonb("details"), // from data-models.md
  createdAt: timestamp("created_at").defaultNow().notNull() // Renamed from changedAt for consistency
})

export const metadataChangeLogsRelations = relations(
  metadataChangeLogsTable,
  ({ one }) => ({
    metadataRecord: one(metadataRecordsTable, {
      fields: [metadataChangeLogsTable.metadataRecordId],
      references: [metadataRecordsTable.id]
    })
    // Add relation to usersTable if you have one for userId
    // user: one(usersTable, {
    //   fields: [metadataChangeLogsTable.userId],
    //   references: [usersTable.clerkId], // or usersTable.id
    // }),
  })
)

// --- Export Types ---
export type InsertMetadataRecord = typeof metadataRecordsTable.$inferInsert
export type SelectMetadataRecord = typeof metadataRecordsTable.$inferSelect

export type InsertMetadataChangeLog =
  typeof metadataChangeLogsTable.$inferInsert
export type SelectMetadataChangeLog =
  typeof metadataChangeLogsTable.$inferSelect
```

**Key Changes Made in This Proposed Schema:**

1.  **TypeScript Interfaces for JSONB:** Defined interfaces for all complex JSONB structures as per `docs/data-models.md`.
2.  **Field Renaming:**
    - `datasetType` -> `dataType`
    - `edition` -> `version`
    - `assessmentCompletionStatus` -> `assessment`
    - `geographicLocation` -> `locationInfo`
    - `cloudCover` -> `cloudCoverPercentage`
3.  **Type Changes:**
    - `dataType`: Now `text("data_type").notNull()`. You should strongly consider using the `datasetTypeEnum` you already have: `dataType: datasetTypeEnum("data_type").notNull()`. I've kept it as `text` for now to exactly match `VARCHAR(50)` but enum is better.
    - `language`: Added `.default("en").notNull()`.
    - `keywords`: Changed from `jsonb` to `text("keywords").array()`.
    - `cloudCoverPercentage`: Changed from `text` to `integer`.
    - `publicationDate`: Changed from `timestamp` to `date`.
4.  **Added Missing Fields:**
    - `lastRevisionDate: date("last_revision_date")`
    - `additionalInfo: jsonb("additional_info")`
5.  **JSONB Field Consolidation:**
    - Replaced groups of individual Drizzle fields with single JSONB fields typed with the new interfaces (e.g., `spatialInfo`, `temporalInfo`, `technicalDetailsInfo`, `constraintsInfo`, `dataQualityInfo`, `processingInfo`, `distributionInfo`, `metadataReferenceInfo`).
    - The previous individual fields that are now part of these JSONB objects should be **removed** from the Drizzle schema definition (e.g., `southBoundLatitude`, `fileFormat`, etc., are now properties within their respective JSONB typed fields). I have removed them in the proposed schema above.
6.  **`metadataChangeLogsTable` Update:**
    - Replaced `fieldName`, `oldValue`, `newValue` with a single `changedFields: jsonb("changed_fields")`.
    - Added `oldStatus`, `newStatus`, `comments`, `details` as per `docs/data-models.md`.
    - Renamed `changedAt` to `createdAt` for consistency.

**Before Applying:**

- **Carefully Review:** Compare this proposed schema against your existing `db/schema/metadata-records-schema.ts` and `docs/data-models.md` one more time to ensure all intended changes are captured and no existing critical fields were removed unintentionally if they were outside the scope of `docs/data-models.md` but still needed.
- **Enums for `dataType` and `frameworkType`:** I recommend using `datasetTypeEnum("data_type").notNull()` for the `dataType` field and `frameworkTypeEnum("framework_type")` for the `frameworkType` field if the enum values align with your needs. I've noted this in the comments.
- **Database Migration:** After updating your Drizzle schema file, you will need to generate and apply a database migration using Drizzle Kit. This will alter your actual database table structure. **This is a critical step and can lead to data loss if not handled carefully, especially when changing column types or removing columns. Backup your database before applying migrations.**

Once you've updated and confirmed this Drizzle schema and applied the database migrations, the next step will be to update the Zod schema in your form and then the UI components themselves.

Let me know how you'd like to proceed.

```typescript
// Example: Define TypeScript interface for LocationInfo
export interface LocationInfo {
  country: string | null;
  geopoliticalZone: string | null;
  state: string | null;
  lga: string | null;
  townCity: string | null;
}

// In metadataRecordsTable
// ...
locationInfo: jsonb<LocationInfo>("location_info"),
// ... other fields ...

// Similarly for SpatialInfo, TemporalInfo etc.
export interface SpatialInfo {
  coordinateSystem: string | null;
  projection: string | null;
  scale: number | null; // Assuming scale denominator is a number
  resolution: string | null;
  coordinateUnit: "DD" | "DMS" | null;
  minLatitude: number | null;
  minLongitude: number | null;
  maxLatitude: number | null;
  maxLongitude: number | null;
  spatialRepresentationType: string | null; // Could be an enum: "Image", "Point", etc.
}

// ... and so on for all JSONB structures from data-models.md
```

```typescript
import { relations } from "drizzle-orm"
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  date,
  boolean, // Keep if used by other enums or directly
  doublePrecision, // Keep if used by other enums or directly
  integer
} from "drizzle-orm/pg-core"
import { organizationsTable } from "./organizations-schema"

// --- Enums (Assuming these are defined as in your existing file) ---
export const metadataStatusEnum = pgEnum("metadata_status", [
  "Draft",
  "Pending Validation",
  "Needs Revision",
  "Approved",
  "Published",
  "Archived"
])

export const datasetTypeEnum = pgEnum("dataset_type_enum", [
  // Renamed to avoid conflict if 'dataType' field uses it
  "Raster",
  "Vector",
  "Table",
  "Service",
  "Application",
  "Document",
  "Collection",
  "Other"
])

export const frameworkTypeEnum = pgEnum("framework_type_enum", [
  // Renamed if used directly
  "Fundamental",
  "Thematic",
  "Special Interest",
  "Administrative",
  "Other"
])

export const metadataLogActionTypeEnum = pgEnum("metadata_log_action_type", [
  "CreateRecord",
  "UpdateField",
  "DeleteRecord",
  "StatusChange",
  "SubmittedForValidation",
  "ApprovedRecord",
  "RejectedRecord",
  "RevisionSubmitted",
  "Other"
])

// --- TypeScript Interfaces for JSONB fields based on docs/data-models.md ---

export interface LocationInfo {
  country: string | null // e.g., "Nigeria"
  geopoliticalZone: string | null
  state: string | null
  lga: string | null
  townCity: string | null
}

export interface SpatialInfo {
  coordinateSystem: string | null
  projection: string | null
  scale: number | null // Denominator as integer
  resolution: string | null // e.g., "30m"
  coordinateUnit: "DD" | "DMS" | null
  minLatitude: number | null
  minLongitude: number | null
  maxLatitude: number | null
  maxLongitude: number | null
  spatialRepresentationType: string | null // e.g., "Image", "Point"
}

export interface TemporalInfo {
  dateFrom: string | null // ISO Date string
  dateTo: string | null // ISO Date string
}

export interface TechnicalDetailsInfo {
  fileFormat: string | null // e.g., "GeoTIFF", "Shapefile"
  fileSizeMB: number | null
  numFeaturesOrLayers: number | null
  softwareHardwareRequirements: string | null
}

export interface ConstraintsInfo {
  accessConstraints: string | null
  useConstraints: string | null
  otherConstraints: string | null
}

export interface PositionalAccuracyDetail {
  accuracyReport: string | null
  accuracyPercentage: number | null
  accuracyExplanation: string | null
}

export interface DataQualityInfo {
  logicalConsistencyReport: string | null
  completenessReport: string | null
  attributeAccuracyReport: string | null
  horizontalAccuracy: PositionalAccuracyDetail | null
  verticalAccuracy: PositionalAccuracyDetail | null
}

export interface ProcessorContact {
  processorName: string | null
  processorEmail: string | null
  processorAddress: string | null
}

export interface SourceInfo {
  sourceScaleDenominator: number | null
  sourceMediaType: string | null
  sourceCitation: string | null
  citationTitle: string | null
  contractReference: string | null
  contractDate: string | null // ISO Date string
}

export interface ProcessingInfo {
  processingStepsDescription: string | null
  softwareAndVersionUsed: string | null
  processedDate: string | null // ISO Date string
  processorContact: ProcessorContact | null
  sourceInfo: SourceInfo | null
}

export interface DistributionContact {
  contactPersonOffice: string | null
  email: string | null
  departmentUnit: string | null
  phoneNumber: string | null
}

export interface LicenseInfo {
  licenseType: string | null
  usageTerms: string | null
  attributionRequirements: string | null
  accessRestrictions: string[] | null // Array of selected strings
}

export interface DistributionInfo {
  distributionFormat: string | null
  accessMethod: string | null // e.g., "Download", "API"
  downloadUrl: string | null
  apiEndpoint: string | null
  licenseInfo: LicenseInfo | null
  distributionContact: DistributionContact | null
}

export interface MetadataPoc {
  contactName_metadataPOC: string | null
  address_metadataPOC: string | null
  email_metadataPOC: string | null
  phoneNumber_metadataPOC: string | null
}

export interface MetadataReferenceInfo {
  metadataCreationDate: string | null // ISO Date string
  metadataReviewDate: string | null // ISO Date string
  metadataPoc: MetadataPoc | null
}

export interface FundamentalDatasetsInfo {
  geodeticData: boolean | null
  topographicData: boolean | null
  cadastralData: boolean | null // Assuming based on common fundamental types
  administrativeBoundaries: boolean | null
  hydrographicData: boolean | null
  landUseLandCover: boolean | null
  geologicalData: boolean | null
  demographicData: boolean | null
  digitalImagery: boolean | null
  transportationData: boolean | null
  others: boolean | null
  othersSpecify: string | null
}

// --- Main metadataRecordsTable ---
export const metadataRecordsTable = pgTable("metadata_records", {
  // Core Fields
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  dataType: text("data_type").notNull(), // Renamed from datasetType, consider using datasetTypeEnum
  abstract: text("abstract").notNull(),
  purpose: text("purpose"),
  creatorUserId: text("creator_user_id").notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  status: metadataStatusEnum("status").default("Draft").notNull(),
  version: text("version"), // Renamed from edition
  language: text("language").default("en").notNull(),
  assessment: text("assessment"), // Renamed from assessmentCompletionStatus
  updateFrequency: text("update_frequency"),
  productionDate: date("production_date"), // Date when the dataset was created or produced
  publicationDate: date("publication_date"), // Date of data publication
  lastRevisionDate: date("last_revision_date"), // Date of last data revision
  keywords: text("keywords").array(), // Array of keywords for searchability
  thumbnailUrl: text("thumbnail_url"),
  cloudCoverPercentage: integer("cloud_cover_percentage"),
  frameworkType: text("framework_type"), // Consider frameworkTypeEnum

  // JSONB Fields from data-models.md
  locationInfo: jsonb<LocationInfo>("location_info"),
  spatialInfo: jsonb<SpatialInfo>("spatial_info"),
  temporalInfo: jsonb<TemporalInfo>("temporal_info"),
  technicalDetailsInfo: jsonb<TechnicalDetailsInfo>("technical_details_info"),
  constraintsInfo: jsonb<ConstraintsInfo>("constraints_info"),
  dataQualityInfo: jsonb<DataQualityInfo>("data_quality_info"),
  processingInfo: jsonb<ProcessingInfo>("processing_info"),
  distributionInfo: jsonb<DistributionInfo>("distribution_info"),
  metadataReferenceInfo: jsonb<MetadataReferenceInfo>(
    "metadata_reference_info"
  ),
  fundamentalDatasetsInfo: jsonb<FundamentalDatasetsInfo>(
    "fundamental_datasets_info"
  ),
  additionalInfo: jsonb("additional_info"), // For any other relevant information

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// --- Relations ---
export const metadataRecordsRelations = relations(
  metadataRecordsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [metadataRecordsTable.organizationId],
      references: [organizationsTable.id]
    }),
    changeLogs: many(metadataChangeLogsTable)
    // Add relation to usersTable if you have one for creatorUserId
    // creator: one(usersTable, {
    //   fields: [metadataRecordsTable.creatorUserId],
    //   references: [usersTable.clerkId], // or usersTable.id if it's a UUID
    // }),
  })
)

// --- Change Logs Table (Assuming structure is mostly fine) ---
export const metadataChangeLogsTable = pgTable("metadata_change_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  metadataRecordId: uuid("metadata_record_id")
    .references(() => metadataRecordsTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(), // User ID from Clerk
  actionType: metadataLogActionTypeEnum("action_type").notNull(),
  changedFields: jsonb("changed_fields"), // from data-models.md (used to be separate text fields)
  oldStatus: text("old_status"), // from data-models.md
  newStatus: text("new_status"), // from data-models.md
  comments: text("comments"), // from data-models.md
  details: jsonb("details"), // from data-models.md
  createdAt: timestamp("created_at").defaultNow().notNull() // Renamed from changedAt for consistency
})

export const metadataChangeLogsRelations = relations(
  metadataChangeLogsTable,
  ({ one }) => ({
    metadataRecord: one(metadataRecordsTable, {
      fields: [metadataChangeLogsTable.metadataRecordId],
      references: [metadataRecordsTable.id]
    })
    // Add relation to usersTable if you have one for userId
    // user: one(usersTable, {
    //   fields: [metadataChangeLogsTable.userId],
    //   references: [usersTable.clerkId], // or usersTable.id
    // }),
  })
)

// --- Export Types ---
export type InsertMetadataRecord = typeof metadataRecordsTable.$inferInsert
export type SelectMetadataRecord = typeof metadataRecordsTable.$inferSelect

export type InsertMetadataChangeLog =
  typeof metadataChangeLogsTable.$inferInsert
export type SelectMetadataChangeLog =
  typeof metadataChangeLogsTable.$inferSelect
```

---

**User**

Also review the ui/ux implementaion of these. I want some fields to be coditionaly displayed (e.g vector, raster or polygons should have specialized fields)

---

**Cursor**

```typescriptreact
         const dataTypeValue = form.watch("dataType");
         // ...
         {dataTypeValue === "Raster" && (
           <FormField
             control={form.control}
             name="cloudCoverPercentage"
             render={({ field }) => (
               // ... input for cloud cover
             )}
           />
         )}
```

Okay, I will proceed with the plan, focusing on incorporating conditional display logic and ensuring a good UI/UX for the new JSONB structures.

**Phase 1: Zod Schema for Form Validation**

First, let's define the Zod schema that will be used in `app/(app)/metadata/create/_components/metadata-form.tsx`. This schema will mirror the `InsertMetadataRecord` structure derived from the Drizzle schema we've already discussed. It will be quite extensive.

I'll provide the Zod schema. This should replace or be integrated into your existing Zod schema in `metadata-form.tsx`.

```typescript
import { z } from "zod"

// Enums (should match Drizzle enums if possible, or map to their values)
const metadataStatusEnum = z.enum([
  "Draft",
  "Pending Validation",
  "Needs Revision",
  "Approved",
  "Published",
  "Archived"
])

const datasetTypeEnum = z.enum([
  "Raster",
  "Vector",
  "Table",
  "Service",
  "Application",
  "Document",
  "Collection",
  "Other"
])

// --- Zod Schemas for JSONB TypeScript Interfaces ---

const LocationInfoSchema = z.object({
  country: z.string().nullable().optional(),
  geopoliticalZone: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  lga: z.string().nullable().optional(),
  townCity: z.string().nullable().optional()
})

const SpatialInfoSchema = z.object({
  coordinateSystem: z.string().nullable().optional(),
  projection: z.string().nullable().optional(),
  scale: z.number().nullable().optional(),
  resolution: z.string().nullable().optional(),
  coordinateUnit: z.enum(["DD", "DMS"]).nullable().optional(),
  minLatitude: z.number().nullable().optional(),
  minLongitude: z.number().nullable().optional(),
  maxLatitude: z.number().nullable().optional(),
  maxLongitude: z.number().nullable().optional(),
  spatialRepresentationType: z.string().nullable().optional()
})

const TemporalInfoSchema = z.object({
  dateFrom: z.string().nullable().optional(), // Consider z.date() if you handle conversion
  dateTo: z.string().nullable().optional() // Consider z.date()
})

const TechnicalDetailsInfoSchema = z.object({
  fileFormat: z.string().nullable().optional(),
  fileSizeMB: z.number().nullable().optional(),
  numFeaturesOrLayers: z.number().nullable().optional(),
  softwareHardwareRequirements: z.string().nullable().optional()
})

const ConstraintsInfoSchema = z.object({
  accessConstraints: z.string().nullable().optional(),
  useConstraints: z.string().nullable().optional(),
  otherConstraints: z.string().nullable().optional()
})

const PositionalAccuracyDetailSchema = z.object({
  accuracyReport: z.string().nullable().optional(),
  accuracyPercentage: z.number().nullable().optional(),
  accuracyExplanation: z.string().nullable().optional()
})

const DataQualityInfoSchema = z.object({
  logicalConsistencyReport: z.string().nullable().optional(),
  completenessReport: z.string().nullable().optional(),
  attributeAccuracyReport: z.string().nullable().optional(),
  horizontalAccuracy: PositionalAccuracyDetailSchema.nullable().optional(),
  verticalAccuracy: PositionalAccuracyDetailSchema.nullable().optional()
})

const ProcessorContactSchema = z.object({
  processorName: z.string().nullable().optional(),
  processorEmail: z.string().email().nullable().optional(),
  processorAddress: z.string().nullable().optional()
})

const SourceInfoSchema = z.object({
  sourceScaleDenominator: z.number().nullable().optional(),
  sourceMediaType: z.string().nullable().optional(),
  sourceCitation: z.string().nullable().optional(),
  citationTitle: z.string().nullable().optional(),
  contractReference: z.string().nullable().optional(),
  contractDate: z.string().nullable().optional() // Consider z.date()
})

const ProcessingInfoSchema = z.object({
  processingStepsDescription: z.string().nullable().optional(),
  softwareAndVersionUsed: z.string().nullable().optional(),
  processedDate: z.string().nullable().optional(), // Consider z.date()
  processorContact: ProcessorContactSchema.nullable().optional(),
  sourceInfo: SourceInfoSchema.nullable().optional()
})

const DistributionContactSchema = z.object({
  contactPersonOffice: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  departmentUnit: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional()
})

const LicenseInfoSchema = z.object({
  licenseType: z.string().nullable().optional(),
  usageTerms: z.string().nullable().optional(),
  attributionRequirements: z.string().nullable().optional(),
  accessRestrictions: z.array(z.string()).nullable().optional()
})

const DistributionInfoSchema = z.object({
  distributionFormat: z.string().nullable().optional(),
  accessMethod: z.string().nullable().optional(),
  downloadUrl: z.string().url().nullable().optional().or(z.literal("")),
  apiEndpoint: z.string().url().nullable().optional().or(z.literal("")),
  licenseInfo: LicenseInfoSchema.nullable().optional(),
  distributionContact: DistributionContactSchema.nullable().optional()
})

const MetadataPocSchema = z.object({
  contactName_metadataPOC: z.string().nullable().optional(),
  address_metadataPOC: z.string().nullable().optional(),
  email_metadataPOC: z.string().email().nullable().optional(),
  phoneNumber_metadataPOC: z.string().nullable().optional()
})

const MetadataReferenceInfoSchema = z.object({
  metadataCreationDate: z.string().nullable().optional(), // Consider z.date()
  metadataReviewDate: z.string().nullable().optional(), // Consider z.date()
  metadataPoc: MetadataPocSchema.nullable().optional()
})

const FundamentalDatasetsInfoSchema = z.object({
  geodeticData: z.boolean().nullable().optional(),
  topographicData: z.boolean().nullable().optional(),
  cadastralData: z.boolean().nullable().optional(),
  administrativeBoundaries: z.boolean().nullable().optional(),
  hydrographicData: z.boolean().nullable().optional(),
  landUseLandCover: z.boolean().nullable().optional(),
  geologicalData: z.boolean().nullable().optional(),
  demographicData: z.boolean().nullable().optional(),
  digitalImagery: z.boolean().nullable().optional(),
  transportationData: z.boolean().nullable().optional(),
  others: z.boolean().nullable().optional(),
  othersSpecify: z.string().nullable().optional()
})

// --- Main Zod Schema for the Form ---
export const metadataFormSchema = z.object({
  // Core Fields
  title: z.string().min(1, "Title is required."),
  dataType: datasetTypeEnum, // Use the enum for validation
  abstract: z.string().min(1, "Abstract is required."),
  purpose: z.string().nullable().optional(),
  // creatorUserId: z.string(), // Usually set by the system/auth state
  // organizationId: z.string(), // Usually set by the system/user's org
  // status: metadataStatusEnum.default("Draft"), // Usually set by the system
  version: z.string().nullable().optional(),
  language: z.string().default("en").min(1, "Language is required."),
  assessment: z.string().nullable().optional(), // Could be an enum if values are fixed
  updateFrequency: z.string().nullable().optional(), // Could be an enum
  productionDate: z.string().nullable().optional(), // Consider z.date() and refine
  publicationDate: z.string().nullable().optional(), // Consider z.date()
  lastRevisionDate: z.string().nullable().optional(), // Consider z.date()
  keywords: z.array(z.string()).nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional().or(z.literal("")),
  cloudCoverPercentage: z.number().min(0).max(100).nullable().optional(),
  frameworkType: z.string().nullable().optional(), // Could be an enum using frameworkTypeEnum

  // JSONB Fields
  locationInfo: LocationInfoSchema.nullable().optional(),
  spatialInfo: SpatialInfoSchema.nullable().optional(),
  temporalInfo: TemporalInfoSchema.nullable().optional(),
  technicalDetailsInfo: TechnicalDetailsInfoSchema.nullable().optional(),
  constraintsInfo: ConstraintsInfoSchema.nullable().optional(),
  dataQualityInfo: DataQualityInfoSchema.nullable().optional(),
  processingInfo: ProcessingInfoSchema.nullable().optional(),
  distributionInfo: DistributionInfoSchema.nullable().optional(),
  metadataReferenceInfo: MetadataReferenceInfoSchema.nullable().optional(),
  fundamentalDatasetsInfo: FundamentalDatasetsInfoSchema.nullable().optional(),
  additionalInfo: z.record(z.string(), z.any()).nullable().optional() // For generic JSON object
})

export type MetadataFormValues = z.infer<typeof metadataFormSchema>

// Default values for the form
export const defaultMetadataFormValues: Partial<MetadataFormValues> = {
  title: "",
  dataType: "Vector", // Example default
  abstract: "",
  purpose: "",
  version: "",
  language: "en",
  assessment: "",
  updateFrequency: "",
  productionDate: "",
  publicationDate: "",
  lastRevisionDate: "",
  keywords: [],
  thumbnailUrl: "",
  cloudCoverPercentage: null,
  frameworkType: "",
  locationInfo: {
    country: "Nigeria",
    geopoliticalZone: null,
    state: null,
    lga: null,
    townCity: null
  },
  spatialInfo: {
    coordinateSystem: null,
    projection: null,
    scale: null,
    resolution: null,
    coordinateUnit: "DD",
    minLatitude: null,
    minLongitude: null,
    maxLatitude: null,
    maxLongitude: null,
    spatialRepresentationType: null
  },
  temporalInfo: {
    dateFrom: null,
    dateTo: null
  },
  technicalDetailsInfo: {
    fileFormat: null,
    fileSizeMB: null,
    numFeaturesOrLayers: null,
    softwareHardwareRequirements: null
  },
  constraintsInfo: {
    accessConstraints: null,
    useConstraints: null,
    otherConstraints: null
  },
  dataQualityInfo: {
    logicalConsistencyReport: null,
    completenessReport: null,
    attributeAccuracyReport: null,
    horizontalAccuracy: {
      accuracyReport: null,
      accuracyPercentage: null,
      accuracyExplanation: null
    },
    verticalAccuracy: {
      accuracyReport: null,
      accuracyPercentage: null,
      accuracyExplanation: null
    }
  },
  processingInfo: {
    processingStepsDescription: null,
    softwareAndVersionUsed: null,
    processedDate: null,
    processorContact: {
      processorName: null,
      processorEmail: null,
      processorAddress: null
    },
    sourceInfo: {
      sourceScaleDenominator: null,
      sourceMediaType: null,
      sourceCitation: null,
      citationTitle: null,
      contractReference: null,
      contractDate: null
    }
  },
  distributionInfo: {
    distributionFormat: null,
    accessMethod: null,
    downloadUrl: "",
    apiEndpoint: "",
    licenseInfo: {
      licenseType: null,
      usageTerms: null,
      attributionRequirements: null,
      accessRestrictions: []
    },
    distributionContact: {
      contactPersonOffice: null,
      email: null,
      departmentUnit: null,
      phoneNumber: null
    }
  },
  metadataReferenceInfo: {
    metadataCreationDate: null,
    metadataReviewDate: null,
    metadataPoc: {
      contactName_metadataPOC: null,
      address_metadataPOC: null,
      email_metadataPOC: null,
      phoneNumber_metadataPOC: null
    }
  },
  fundamentalDatasetsInfo: {
    geodeticData: false,
    topographicData: false,
    cadastralData: false,
    administrativeBoundaries: false,
    hydrographicData: false,
    landUseLandCover: false,
    geologicalData: false,
    demographicData: false,
    digitalImagery: false,
    transportationData: false,
    others: false,
    othersSpecify: null
  },
  additionalInfo: {}
}
```

**Notes on this Zod Schema:**

- **Nullability and Optionality:** I've made liberal use of `.nullable().optional()` for many fields, especially within the JSONB structures. This is a starting point. You'll need to refine this based on which fields are truly optional versus required for a valid metadata submission. `docs/data-models.md` often implies "NOT NULL" at the DB level, which might mean the field is required in the Zod schema (remove `.optional()`).
- **Date Handling:** Fields like `productionDate`, `dateFrom`, `dateTo` are currently `z.string().nullable().optional()`. If your DatePicker components return `Date` objects, you'll want to change these to `z.date().nullable().optional()` and handle the conversion to ISO string before sending to the backend if your Drizzle schema expects date strings for `date` columns.
- **Enums:** For fields like `assessment`, `updateFrequency`, `frameworkType`, if you have predefined sets of values, use `z.enum([...values])` for stricter validation.
- **`additionalInfo`:** I've typed this as `z.record(z.string(), z.any()).nullable().optional()`. This is very flexible. If you have a more defined structure or want to guide users, you might consider a more specific schema or a custom validation approach.
- **Default Values:** The `defaultMetadataFormValues` object provides initial values for the form. Adjust these as needed.

**Phase 2: UI Form Component Updates (Iterative Plan)**

Now, we'll plan the updates for each form component in `app/(app)/metadata/create/_components/`. I'll focus on structure and conditional logic. You'll need to implement the `FormField` components using Shadcn UI, similar to your existing forms.

**General Approach for UI Components:**

- Use `useFormContext` or pass `form` instance down.
- Use `form.watch("fieldName")` to get values for conditional rendering.
- Group related fields from JSONB objects with `<Card>` or simple `<div>` sections with headings.
- For arrays (like `keywords` or `accessRestrictions`), you'll need a mechanism to add/remove items (e.g., using `useFieldArray` from `react-hook-form`).

**Let's start with `general-info-form.tsx`:**

**Target Fields from `data-models.md` (and new Drizzle schema):**
`title`, `dataType`, `abstract`, `purpose`, `version`, `language`, `assessment`, `updateFrequency`, `productionDate`, `publicationDate`, `lastRevisionDate`, `keywords`, `thumbnailUrl`, `cloudCoverPercentage`, `frameworkType`, `locationInfo`, `temporalInfo`, `fundamentalDatasetsInfo`.

**Proposed Structure and Conditional Logic for `general-info-form.tsx`:**

```tsx
// app/(app)/metadata/create/_components/general-info-form.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { MetadataFormValues } from "./metadata-form" // Assuming Zod schema is in metadata-form.tsx

// ... Import Shadcn UI components: Input, Select, DatePicker, Checkbox, Textarea, Card, etc.
// ... Import FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage

export function GeneralInfoForm() {
  const form = useFormContext<MetadataFormValues>()
  const dataType = form.watch("dataType")
  const fundamentalOthersChecked = form.watch("fundamentalDatasetsInfo.others")

  return (
    <div className="space-y-8">
      {/* --- Basic Information --- */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField name="title" render={/* ... Input ... */} />
          <FormField
            name="dataType"
            render={/* ... Select with datasetTypeEnum options ... */}
          />

          {/* Conditional field: Cloud Cover Percentage */}
          {(dataType === "Raster" || dataType === "Imagery") && ( // Adjust condition as needed
            <FormField
              name="cloudCoverPercentage"
              render={/* ... Input type number ... */}
            />
          )}

          <FormField name="abstract" render={/* ... Textarea ... */} />
          <FormField name="purpose" render={/* ... Textarea ... */} />
          <FormField name="version" render={/* ... Input ... */} />
          <FormField
            name="language"
            render={/* ... Input or Select for languages ... */}
          />
          <FormField
            name="assessment"
            render={/* ... Select for assessment status ... */}
          />
          <FormField
            name="updateFrequency"
            render={/* ... Select for update frequency ... */}
          />
          <FormField
            name="frameworkType"
            render={/* ... Select for framework type ... */}
          />
          <FormField
            name="thumbnailUrl"
            render={/* ... Input type URL ... */}
          />
        </CardContent>
      </Card>

      {/* --- Keywords --- */}
      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Implement useFieldArray for keywords input */}
          <FormField
            name="keywords"
            render={/* ... Tag input or list of text inputs ... */}
          />
        </CardContent>
      </Card>

      {/* --- Temporal Information --- */}
      <Card>
        <CardHeader>
          <CardTitle>Temporal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField name="productionDate" render={/* ... DatePicker ... */} />
          <FormField name="publicationDate" render={/* ... DatePicker ... */} />
          <FormField
            name="lastRevisionDate"
            render={/* ... DatePicker ... */}
          />
          <FormField
            name="temporalInfo.dateFrom"
            render={/* ... DatePicker for temporalInfo.dateFrom ... */}
          />
          <FormField
            name="temporalInfo.dateTo"
            render={/* ... DatePicker for temporalInfo.dateTo ... */}
          />
        </CardContent>
      </Card>

      {/* --- Location Information (locationInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            name="locationInfo.country"
            render={/* ... Input/Select (default Nigeria) ... */}
          />
          <FormField
            name="locationInfo.geopoliticalZone"
            render={/* ... Input/Select ... */}
          />
          <FormField
            name="locationInfo.state"
            render={/* ... Input/Select ... */}
          />
          <FormField
            name="locationInfo.lga"
            render={/* ... Input/Select ... */}
          />
          <FormField
            name="locationInfo.townCity"
            render={/* ... Input ... */}
          />
        </CardContent>
      </Card>

      {/* --- Fundamental Datasets (fundamentalDatasetsInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Fundamental Datasets Included</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <FormField
            name="fundamentalDatasetsInfo.geodeticData"
            render={/* ... Checkbox ... */}
          />
          <FormField
            name="fundamentalDatasetsInfo.topographicData"
            render={/* ... Checkbox ... */}
          />
          {/* ... other checkboxes ... */}
          <FormField
            name="fundamentalDatasetsInfo.others"
            render={/* ... Checkbox ... */}
          />
          {fundamentalOthersChecked && (
            <FormField
              name="fundamentalDatasetsInfo.othersSpecify"
              render={/* ... Input ... */}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Next, planning for `technical-details-form.tsx`:**

**Target Fields from `data-models.md` (and new Drizzle schema):**
`spatialInfo` (JSONB), `technicalDetailsInfo` (JSONB), `constraintsInfo` (JSONB).

**Proposed Structure and Conditional Logic for `technical-details-form.tsx`:**

```tsx
// app/(app)/metadata/create/_components/technical-details-form.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { MetadataFormValues } from "./metadata-form"
// ... Import UI components ...

export function TechnicalDetailsForm() {
  const form = useFormContext<MetadataFormValues>()
  const dataType = form.watch("dataType") // For conditional logic if needed for spatialInfo

  return (
    <div className="space-y-8">
      {/* --- Spatial Information (spatialInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Spatial Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="spatialInfo.coordinateSystem"
            render={/* ... Input/Select ... */}
          />
          <FormField
            name="spatialInfo.projection"
            render={/* ... Input/Select ... */}
          />
          <FormField
            name="spatialInfo.scale"
            render={/* ... Input type number ... */}
          />
          <FormField
            name="spatialInfo.resolution"
            render={/* ... Input ... */}
          />
          <FormField
            name="spatialInfo.coordinateUnit"
            render={/* ... Select (DD/DMS) ... */}
          />
          <FormField
            name="spatialInfo.spatialRepresentationType"
            render={/* ... Select (e.g., Point, Line, Polygon, Grid) - could be conditional on dataType ... */}
          />

          {/* Bounding Box - might be less relevant for dataType 'Table' or 'Document' */}
          {dataType !== "Table" &&
            dataType !== "Document" && ( // Example condition
              <>
                <FormField
                  name="spatialInfo.minLatitude"
                  render={/* ... Input type number ... */}
                />
                <FormField
                  name="spatialInfo.minLongitude"
                  render={/* ... Input type number ... */}
                />
                <FormField
                  name="spatialInfo.maxLatitude"
                  render={/* ... Input type number ... */}
                />
                <FormField
                  name="spatialInfo.maxLongitude"
                  render={/* ... Input type number ... */}
                />
              </>
            )}
        </CardContent>
      </Card>

      {/* --- Technical Specifications (technicalDetailsInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="technicalDetailsInfo.fileFormat"
            render={/* ... Input/Select ... */}
          />
          <FormField
            name="technicalDetailsInfo.fileSizeMB"
            render={/* ... Input type number ... */}
          />
          {/* Label for numFeaturesOrLayers could be dynamic based on dataType */}
          <FormField
            name="technicalDetailsInfo.numFeaturesOrLayers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dataType === "Vector"
                    ? "Number of Features"
                    : dataType === "Raster"
                      ? "Number of Layers/Bands"
                      : "Number of Entries/Rows"}
                </FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="technicalDetailsInfo.softwareHardwareRequirements"
            render={/* ... Textarea ... */}
          />
        </CardContent>
      </Card>

      {/* --- Access and Use Constraints (constraintsInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Access and Use Constraints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            name="constraintsInfo.accessConstraints"
            render={/* ... Textarea ... */}
          />
          <FormField
            name="constraintsInfo.useConstraints"
            render={/* ... Textarea ... */}
          />
          <FormField
            name="constraintsInfo.otherConstraints"
            render={/* ... Textarea ... */}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

This is a substantial update. I'll pause here.

**Next Steps from My Side:**

1.  I will wait for you to review the Zod schema and the proposed UI structure for `general-info-form.tsx` and `technical-details-form.tsx`.
2.  Once you're okay with this direction, I will proceed to plan the UI for:
    - `data-quality-form.tsx` (covering `dataQualityInfo` JSONB)
    - `processing-info-form.tsx` (a new component, to split out `processingInfo` JSONB for clarity)
    - `access-info-form.tsx` (covering `distributionInfo` and `metadataReferenceInfo` JSONB fields)
    - A way to handle `additionalInfo` JSONB.

Please review the Zod schema and the first two form component plans. Let me know your feedback or if I should continue with the remaining forms.

```typescript
import { z } from "zod"

// Enums (should match Drizzle enums if possible, or map to their values)
const metadataStatusEnum = z.enum([
  "Draft",
  "Pending Validation",
  "Needs Revision",
  "Approved",
  "Published",
  "Archived"
])

const datasetTypeEnum = z.enum([
  "Raster",
  "Vector",
  "Table",
  "Service",
  "Application",
  "Document",
  "Collection",
  "Other"
])

// --- Zod Schemas for JSONB TypeScript Interfaces ---

const LocationInfoSchema = z.object({
  country: z.string().nullable().optional(),
  geopoliticalZone: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  lga: z.string().nullable().optional(),
  townCity: z.string().nullable().optional()
})

const SpatialInfoSchema = z.object({
  coordinateSystem: z.string().nullable().optional(),
  projection: z.string().nullable().optional(),
  scale: z.number().nullable().optional(),
  resolution: z.string().nullable().optional(),
  coordinateUnit: z.enum(["DD", "DMS"]).nullable().optional(),
  minLatitude: z.number().nullable().optional(),
  minLongitude: z.number().nullable().optional(),
  maxLatitude: z.number().nullable().optional(),
  maxLongitude: z.number().nullable().optional(),
  spatialRepresentationType: z.string().nullable().optional()
})

const TemporalInfoSchema = z.object({
  dateFrom: z.string().nullable().optional(), // Consider z.date() if you handle conversion
  dateTo: z.string().nullable().optional() // Consider z.date()
})

const TechnicalDetailsInfoSchema = z.object({
  fileFormat: z.string().nullable().optional(),
  fileSizeMB: z.number().nullable().optional(),
  numFeaturesOrLayers: z.number().nullable().optional(),
  softwareHardwareRequirements: z.string().nullable().optional()
})

const ConstraintsInfoSchema = z.object({
  accessConstraints: z.string().nullable().optional(),
  useConstraints: z.string().nullable().optional(),
  otherConstraints: z.string().nullable().optional()
})

const PositionalAccuracyDetailSchema = z.object({
  accuracyReport: z.string().nullable().optional(),
  accuracyPercentage: z.number().nullable().optional(),
  accuracyExplanation: z.string().nullable().optional()
})

const DataQualityInfoSchema = z.object({
  logicalConsistencyReport: z.string().nullable().optional(),
  completenessReport: z.string().nullable().optional(),
  attributeAccuracyReport: z.string().nullable().optional(),
  horizontalAccuracy: PositionalAccuracyDetailSchema.nullable().optional(),
  verticalAccuracy: PositionalAccuracyDetailSchema.nullable().optional()
})

const ProcessorContactSchema = z.object({
  processorName: z.string().nullable().optional(),
  processorEmail: z.string().email().nullable().optional(),
  processorAddress: z.string().nullable().optional()
})

const SourceInfoSchema = z.object({
  sourceScaleDenominator: z.number().nullable().optional(),
  sourceMediaType: z.string().nullable().optional(),
  sourceCitation: z.string().nullable().optional(),
  citationTitle: z.string().nullable().optional(),
  contractReference: z.string().nullable().optional(),
  contractDate: z.string().nullable().optional() // Consider z.date()
})

const ProcessingInfoSchema = z.object({
  processingStepsDescription: z.string().nullable().optional(),
  softwareAndVersionUsed: z.string().nullable().optional(),
  processedDate: z.string().nullable().optional(), // Consider z.date()
  processorContact: ProcessorContactSchema.nullable().optional(),
  sourceInfo: SourceInfoSchema.nullable().optional()
})

const DistributionContactSchema = z.object({
  contactPersonOffice: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  departmentUnit: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional()
})

const LicenseInfoSchema = z.object({
  licenseType: z.string().nullable().optional(),
  usageTerms: z.string().nullable().optional(),
  attributionRequirements: z.string().nullable().optional(),
  accessRestrictions: z.array(z.string()).nullable().optional()
})

const DistributionInfoSchema = z.object({
  distributionFormat: z.string().nullable().optional(),
  accessMethod: z.string().nullable().optional(),
  downloadUrl: z.string().url().nullable().optional().or(z.literal("")),
  apiEndpoint: z.string().url().nullable().optional().or(z.literal("")),
  licenseInfo: LicenseInfoSchema.nullable().optional(),
  distributionContact: DistributionContactSchema.nullable().optional()
})

const MetadataPocSchema = z.object({
  contactName_metadataPOC: z.string().nullable().optional(),
  address_metadataPOC: z.string().nullable().optional(),
  email_metadataPOC: z.string().email().nullable().optional(),
  phoneNumber_metadataPOC: z.string().nullable().optional()
})

const MetadataReferenceInfoSchema = z.object({
  metadataCreationDate: z.string().nullable().optional(), // Consider z.date()
  metadataReviewDate: z.string().nullable().optional(), // Consider z.date()
  metadataPoc: MetadataPocSchema.nullable().optional()
})

const FundamentalDatasetsInfoSchema = z.object({
  geodeticData: z.boolean().nullable().optional(),
  topographicData: z.boolean().nullable().optional(),
  cadastralData: z.boolean().nullable().optional(),
  administrativeBoundaries: z.boolean().nullable().optional(),
  hydrographicData: z.boolean().nullable().optional(),
  landUseLandCover: z.boolean().nullable().optional(),
  geologicalData: z.boolean().nullable().optional(),
  demographicData: z.boolean().nullable().optional(),
  digitalImagery: z.boolean().nullable().optional(),
  transportationData: z.boolean().nullable().optional(),
  others: z.boolean().nullable().optional(),
  othersSpecify: z.string().nullable().optional()
})

// --- Main Zod Schema for the Form ---
export const metadataFormSchema = z.object({
  // Core Fields
  title: z.string().min(1, "Title is required."),
  dataType: datasetTypeEnum, // Use the enum for validation
  abstract: z.string().min(1, "Abstract is required."),
  purpose: z.string().nullable().optional(),
  // creatorUserId: z.string(), // Usually set by the system/auth state
  // organizationId: z.string(), // Usually set by the system/user's org
  // status: metadataStatusEnum.default("Draft"), // Usually set by the system
  version: z.string().nullable().optional(),
  language: z.string().default("en").min(1, "Language is required."),
  assessment: z.string().nullable().optional(), // Could be an enum if values are fixed
  updateFrequency: z.string().nullable().optional(), // Could be an enum
  productionDate: z.string().nullable().optional(), // Consider z.date() and refine
  publicationDate: z.string().nullable().optional(), // Consider z.date()
  lastRevisionDate: z.string().nullable().optional(), // Consider z.date()
  keywords: z.array(z.string()).nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional().or(z.literal("")),
  cloudCoverPercentage: z.number().min(0).max(100).nullable().optional(),
  frameworkType: z.string().nullable().optional(), // Could be an enum using frameworkTypeEnum

  // JSONB Fields
  locationInfo: LocationInfoSchema.nullable().optional(),
  spatialInfo: SpatialInfoSchema.nullable().optional(),
  temporalInfo: TemporalInfoSchema.nullable().optional(),
  technicalDetailsInfo: TechnicalDetailsInfoSchema.nullable().optional(),
  constraintsInfo: ConstraintsInfoSchema.nullable().optional(),
  dataQualityInfo: DataQualityInfoSchema.nullable().optional(),
  processingInfo: ProcessingInfoSchema.nullable().optional(),
  distributionInfo: DistributionInfoSchema.nullable().optional(),
  metadataReferenceInfo: MetadataReferenceInfoSchema.nullable().optional(),
  fundamentalDatasetsInfo: FundamentalDatasetsInfoSchema.nullable().optional(),
  additionalInfo: z.record(z.string(), z.any()).nullable().optional() // For generic JSON object
})

export type MetadataFormValues = z.infer<typeof metadataFormSchema>

// Default values for the form
export const defaultMetadataFormValues: Partial<MetadataFormValues> = {
  title: "",
  dataType: "Vector", // Example default
  abstract: "",
  purpose: "",
  version: "",
  language: "en",
  assessment: "",
  updateFrequency: "",
  productionDate: "",
  publicationDate: "",
  lastRevisionDate: "",
  keywords: [],
  thumbnailUrl: "",
  cloudCoverPercentage: null,
  frameworkType: "",
  locationInfo: {
    country: "Nigeria",
    geopoliticalZone: null,
    state: null,
    lga: null,
    townCity: null
  },
  spatialInfo: {
    coordinateSystem: null,
    projection: null,
    scale: null,
    resolution: null,
    coordinateUnit: "DD",
    minLatitude: null,
    minLongitude: null,
    maxLatitude: null,
    maxLongitude: null,
    spatialRepresentationType: null
  },
  temporalInfo: {
    dateFrom: null,
    dateTo: null
  },
  technicalDetailsInfo: {
    fileFormat: null,
    fileSizeMB: null,
    numFeaturesOrLayers: null,
    softwareHardwareRequirements: null
  },
  constraintsInfo: {
    accessConstraints: null,
    useConstraints: null,
    otherConstraints: null
  },
  dataQualityInfo: {
    logicalConsistencyReport: null,
    completenessReport: null,
    attributeAccuracyReport: null,
    horizontalAccuracy: {
      accuracyReport: null,
      accuracyPercentage: null,
      accuracyExplanation: null
    },
    verticalAccuracy: {
      accuracyReport: null,
      accuracyPercentage: null,
      accuracyExplanation: null
    }
  },
  processingInfo: {
    processingStepsDescription: null,
    softwareAndVersionUsed: null,
    processedDate: null,
    processorContact: {
      processorName: null,
      processorEmail: null,
      processorAddress: null
    },
    sourceInfo: {
      sourceScaleDenominator: null,
      sourceMediaType: null,
      sourceCitation: null,
      citationTitle: null,
      contractReference: null,
      contractDate: null
    }
  },
  distributionInfo: {
    distributionFormat: null,
    accessMethod: null,
    downloadUrl: "",
    apiEndpoint: "",
    licenseInfo: {
      licenseType: null,
      usageTerms: null,
      attributionRequirements: null,
      accessRestrictions: []
    },
    distributionContact: {
      contactPersonOffice: null,
      email: null,
      departmentUnit: null,
      phoneNumber: null
    }
  },
  metadataReferenceInfo: {
    metadataCreationDate: null,
    metadataReviewDate: null,
    metadataPoc: {
      contactName_metadataPOC: null,
      address_metadataPOC: null,
      email_metadataPOC: null,
      phoneNumber_metadataPOC: null
    }
  },
  fundamentalDatasetsInfo: {
    geodeticData: false,
    topographicData: false,
    cadastralData: false,
    administrativeBoundaries: false,
    hydrographicData: false,
    landUseLandCover: false,
    geologicalData: false,
    demographicData: false,
    digitalImagery: false,
    transportationData: false,
    others: false,
    othersSpecify: null
  },
  additionalInfo: {}
}
```

```typescriptreact
// app/(app)/metadata/create/_components/general-info-form.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { MetadataFormValues } from "./metadata-form"; // Assuming Zod schema is in metadata-form.tsx

// ... Import Shadcn UI components: Input, Select, DatePicker, Checkbox, Textarea, Card, etc.
// ... Import FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage

export function GeneralInfoForm() {
  const form = useFormContext<MetadataFormValues>();
  const dataType = form.watch("dataType");
  const fundamentalOthersChecked = form.watch("fundamentalDatasetsInfo.others");

  return (
    <div className="space-y-8">
      {/* --- Basic Information --- */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField name="title" render={/* ... Input ... */} />
          <FormField name="dataType" render={/* ... Select with datasetTypeEnum options ... */} />

          {/* Conditional field: Cloud Cover Percentage */}
          {(dataType === "Raster" || dataType === "Imagery") && ( // Adjust condition as needed
             <FormField name="cloudCoverPercentage" render={/* ... Input type number ... */} />
          )}

          <FormField name="abstract" render={/* ... Textarea ... */} />
          <FormField name="purpose" render={/* ... Textarea ... */} />
          <FormField name="version" render={/* ... Input ... */} />
          <FormField name="language" render={/* ... Input or Select for languages ... */} />
          <FormField name="assessment" render={/* ... Select for assessment status ... */} />
          <FormField name="updateFrequency" render={/* ... Select for update frequency ... */} />
          <FormField name="frameworkType" render={/* ... Select for framework type ... */} />
          <FormField name="thumbnailUrl" render={/* ... Input type URL ... */} />
        </CardContent>
      </Card>

      {/* --- Keywords --- */}
      <Card>
        <CardHeader><CardTitle>Keywords</CardTitle></CardHeader>
        <CardContent>
          {/* Implement useFieldArray for keywords input */}
          <FormField name="keywords" render={/* ... Tag input or list of text inputs ... */} />
        </CardContent>
      </Card>

      {/* --- Temporal Information --- */}
      <Card>
        <CardHeader><CardTitle>Temporal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField name="productionDate" render={/* ... DatePicker ... */} />
          <FormField name="publicationDate" render={/* ... DatePicker ... */} />
          <FormField name="lastRevisionDate" render={/* ... DatePicker ... */} />
          <FormField name="temporalInfo.dateFrom" render={/* ... DatePicker for temporalInfo.dateFrom ... */} />
          <FormField name="temporalInfo.dateTo" render={/* ... DatePicker for temporalInfo.dateTo ... */} />
        </CardContent>
      </Card>

      {/* --- Location Information (locationInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Location Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField name="locationInfo.country" render={/* ... Input/Select (default Nigeria) ... */} />
          <FormField name="locationInfo.geopoliticalZone" render={/* ... Input/Select ... */} />
          <FormField name="locationInfo.state" render={/* ... Input/Select ... */} />
          <FormField name="locationInfo.lga" render={/* ... Input/Select ... */} />
          <FormField name="locationInfo.townCity" render={/* ... Input ... */} />
        </CardContent>
      </Card>

      {/* --- Fundamental Datasets (fundamentalDatasetsInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Fundamental Datasets Included</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <FormField name="fundamentalDatasetsInfo.geodeticData" render={/* ... Checkbox ... */} />
          <FormField name="fundamentalDatasetsInfo.topographicData" render={/* ... Checkbox ... */} />
          {/* ... other checkboxes ... */}
          <FormField name="fundamentalDatasetsInfo.others" render={/* ... Checkbox ... */} />
          {fundamentalOthersChecked && (
            <FormField name="fundamentalDatasetsInfo.othersSpecify" render={/* ... Input ... */} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescriptreact
// app/(app)/metadata/create/_components/technical-details-form.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { MetadataFormValues } from "./metadata-form";
// ... Import UI components ...

export function TechnicalDetailsForm() {
  const form = useFormContext<MetadataFormValues>();
  const dataType = form.watch("dataType"); // For conditional logic if needed for spatialInfo

  return (
    <div className="space-y-8">
      {/* --- Spatial Information (spatialInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Spatial Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="spatialInfo.coordinateSystem" render={/* ... Input/Select ... */} />
          <FormField name="spatialInfo.projection" render={/* ... Input/Select ... */} />
          <FormField name="spatialInfo.scale" render={/* ... Input type number ... */} />
          <FormField name="spatialInfo.resolution" render={/* ... Input ... */} />
          <FormField name="spatialInfo.coordinateUnit" render={/* ... Select (DD/DMS) ... */} />
          <FormField name="spatialInfo.spatialRepresentationType" render={/* ... Select (e.g., Point, Line, Polygon, Grid) - could be conditional on dataType ... */} />

          {/* Bounding Box - might be less relevant for dataType 'Table' or 'Document' */}
          {dataType !== "Table" && dataType !== "Document" && ( // Example condition
            <>
              <FormField name="spatialInfo.minLatitude" render={/* ... Input type number ... */} />
              <FormField name="spatialInfo.minLongitude" render={/* ... Input type number ... */} />
              <FormField name="spatialInfo.maxLatitude" render={/* ... Input type number ... */} />
              <FormField name="spatialInfo.maxLongitude" render={/* ... Input type number ... */} />
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Technical Specifications (technicalDetailsInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Technical Specifications</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="technicalDetailsInfo.fileFormat" render={/* ... Input/Select ... */} />
          <FormField name="technicalDetailsInfo.fileSizeMB" render={/* ... Input type number ... */} />
          {/* Label for numFeaturesOrLayers could be dynamic based on dataType */}
          <FormField
            name="technicalDetailsInfo.numFeaturesOrLayers"
            render={ ({ field }) => (
              <FormItem>
                <FormLabel>
                  {dataType === 'Vector' ? 'Number of Features' : dataType === 'Raster' ? 'Number of Layers/Bands' : 'Number of Entries/Rows'}
                </FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField name="technicalDetailsInfo.softwareHardwareRequirements" render={/* ... Textarea ... */} />
        </CardContent>
      </Card>

      {/* --- Access and Use Constraints (constraintsInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Access and Use Constraints</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField name="constraintsInfo.accessConstraints" render={/* ... Textarea ... */} />
          <FormField name="constraintsInfo.useConstraints" render={/* ... Textarea ... */} />
          <FormField name="constraintsInfo.otherConstraints" render={/* ... Textarea ... */} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

**User**

Proceed

---

**Cursor**

Okay, proceeding with the planning for the remaining UI form components.

**Planning for `data-quality-form.tsx`:**

**Target Fields from `data-models.md` (and new Drizzle/Zod schema):**
`dataQualityInfo` (JSONB), which includes:

- `logicalConsistencyReport`
- `completenessReport`
- `attributeAccuracyReport`
- `horizontalAccuracy` (nested: `accuracyReport`, `accuracyPercentage`, `accuracyExplanation`)
- `verticalAccuracy` (nested: `accuracyReport`, `accuracyPercentage`, `accuracyExplanation`)

**Proposed Structure for `data-quality-form.tsx`:**

```tsx
// app/(app)/metadata/create/_components/data-quality-form.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { MetadataFormValues } from "./metadata-form"
// ... Import UI components: Input, Textarea, Card, CardHeader, CardTitle, CardContent, FormField, etc. ...

export function DataQualityForm() {
  const form = useFormContext<MetadataFormValues>()

  return (
    <div className="space-y-8">
      {/* --- Data Quality Assessment (dataQualityInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="dataQualityInfo.logicalConsistencyReport"
            render={/* ... Textarea for logical consistency report ... */}
          />
          <FormField
            name="dataQualityInfo.completenessReport"
            render={/* ... Textarea for completeness report ... */}
          />
          <FormField
            name="dataQualityInfo.attributeAccuracyReport"
            render={/* ... Textarea for attribute accuracy report ... */}
          />

          {/* Horizontal Positional Accuracy */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">
              Horizontal Positional Accuracy
            </h4>
            <div className="space-y-4">
              <FormField
                name="dataQualityInfo.horizontalAccuracy.accuracyReport"
                render={/* ... Textarea for horizontal accuracy report ... */}
              />
              <FormField
                name="dataQualityInfo.horizontalAccuracy.accuracyPercentage"
                render={/* ... Input type number for horizontal accuracy percentage ... */}
              />
              <FormField
                name="dataQualityInfo.horizontalAccuracy.accuracyExplanation"
                render={/* ... Textarea for horizontal accuracy explanation ... */}
              />
            </div>
          </Card>

          {/* Vertical Positional Accuracy */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">
              Vertical Positional Accuracy
            </h4>
            <div className="space-y-4">
              <FormField
                name="dataQualityInfo.verticalAccuracy.accuracyReport"
                render={/* ... Textarea for vertical accuracy report ... */}
              />
              <FormField
                name="dataQualityInfo.verticalAccuracy.accuracyPercentage"
                render={/* ... Input type number for vertical accuracy percentage ... */}
              />
              <FormField
                name="dataQualityInfo.verticalAccuracy.accuracyExplanation"
                render={/* ... Textarea for vertical accuracy explanation ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Planning for a new `processing-info-form.tsx`:**

This new component will handle the `processingInfo` JSONB object for better organization.

**Target Fields from `data-models.md` (and new Drizzle/Zod schema):**
`processingInfo` (JSONB), which includes:

- `processingStepsDescription`
- `softwareAndVersionUsed`
- `processedDate`
- `processorContact` (nested: `processorName`, `processorEmail`, `processorAddress`)
- `sourceInfo` (nested: `sourceScaleDenominator`, `sourceMediaType`, `sourceCitation`, `citationTitle`, `contractReference`, `contractDate`)

**Proposed Structure for `processing-info-form.tsx`:**

```tsx
// app/(app)/metadata/create/_components/processing-info-form.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { MetadataFormValues } from "./metadata-form"
// ... Import UI components ...

export function ProcessingInfoForm() {
  const form = useFormContext<MetadataFormValues>()

  return (
    <div className="space-y-8">
      {/* --- Data Processing & Source Lineage (processingInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Data Processing & Source Lineage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="processingInfo.processingStepsDescription"
            render={/* ... Textarea for processing steps ... */}
          />
          <FormField
            name="processingInfo.softwareAndVersionUsed"
            render={/* ... Input for software and version ... */}
          />
          <FormField
            name="processingInfo.processedDate"
            render={/* ... DatePicker for processed date ... */}
          />

          {/* Processor Contact Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Processor Contact</h4>
            <div className="space-y-4">
              <FormField
                name="processingInfo.processorContact.processorName"
                render={/* ... Input for processor name ... */}
              />
              <FormField
                name="processingInfo.processorContact.processorEmail"
                render={/* ... Input type email for processor email ... */}
              />
              <FormField
                name="processingInfo.processorContact.processorAddress"
                render={/* ... Textarea for processor address ... */}
              />
            </div>
          </Card>

          {/* Source Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Source Information</h4>
            <div className="space-y-4">
              <FormField
                name="processingInfo.sourceInfo.sourceScaleDenominator"
                render={/* ... Input type number for source scale denominator ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.sourceMediaType"
                render={/* ... Input/Select for source media type ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.sourceCitation"
                render={/* ... Textarea for source citation ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.citationTitle"
                render={/* ... Input for citation title ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.contractReference"
                render={/* ... Input for contract reference ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.contractDate"
                render={/* ... DatePicker for contract date ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Planning for `access-info-form.tsx`:**

This form will now cover `distributionInfo` and `metadataReferenceInfo` JSONB objects.

**Target Fields from `data-models.md` (and new Drizzle/Zod schema):**

- `distributionInfo` (JSONB):
  - `distributionFormat`
  - `accessMethod`
  - `downloadUrl`
  - `apiEndpoint`
  - `licenseInfo` (nested: `licenseType`, `usageTerms`, `attributionRequirements`, `accessRestrictions` as array)
  - `distributionContact` (nested: `contactPersonOffice`, `email`, `departmentUnit`, `phoneNumber`)
- `metadataReferenceInfo` (JSONB):
  - `metadataCreationDate`
  - `metadataReviewDate`
  - `metadataPoc` (nested: `contactName_metadataPOC`, `address_metadataPOC`, `email_metadataPOC`, `phoneNumber_metadataPOC`)

**Proposed Structure for `access-info-form.tsx`:**

```tsx
// app/(app)/metadata/create/_components/access-info-form.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { MetadataFormValues } from "./metadata-form"
// ... Import UI components, including Checkbox group for accessRestrictions ...
// ... Potentially useFieldArray for accessRestrictions if they are free-text, otherwise a multi-select checkbox group ...

export function AccessInfoForm() {
  const form = useFormContext<MetadataFormValues>()

  // Example for accessRestrictions if they are predefined checkboxes
  const accessRestrictionOptions = [
    { id: "commercial", label: "Commercial use restrictions" },
    { id: "confidential", label: "Confidential information" }
    // ... other options
  ]

  return (
    <div className="space-y-8">
      {/* --- Distribution & Licensing (distributionInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution & Licensing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="distributionInfo.distributionFormat"
            render={/* ... Input/Select for distribution format ... */}
          />
          <FormField
            name="distributionInfo.accessMethod"
            render={/* ... Input/Select for access method (e.g., Download, API) ... */}
          />
          <FormField
            name="distributionInfo.downloadUrl"
            render={/* ... Input type URL for download URL ... */}
          />
          <FormField
            name="distributionInfo.apiEndpoint"
            render={/* ... Input type URL for API endpoint ... */}
          />

          {/* License Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">License Information</h4>
            <div className="space-y-4">
              <FormField
                name="distributionInfo.licenseInfo.licenseType"
                render={/* ... Input/Select for license type ... */}
              />
              <FormField
                name="distributionInfo.licenseInfo.usageTerms"
                render={/* ... Textarea for usage terms ... */}
              />
              <FormField
                name="distributionInfo.licenseInfo.attributionRequirements"
                render={/* ... Textarea for attribution requirements ... */}
              />
              <FormField
                name="distributionInfo.licenseInfo.accessRestrictions"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Restrictions</FormLabel>
                    <FormDescription>
                      Select any specific access restrictions that apply.
                    </FormDescription>
                    <div className="space-y-2">
                      {accessRestrictionOptions.map(option => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="distributionInfo.licenseInfo.accessRestrictions"
                          render={({ field: itemField }) => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={itemField.value?.includes(
                                      option.label
                                    )}
                                    onCheckedChange={checked => {
                                      const currentValues =
                                        itemField.value || []
                                      if (checked) {
                                        itemField.onChange([
                                          ...currentValues,
                                          option.label
                                        ])
                                      } else {
                                        itemField.onChange(
                                          currentValues.filter(
                                            value => value !== option.label
                                          )
                                        )
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Distribution Contact Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Distribution Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="distributionInfo.distributionContact.contactPersonOffice"
                render={/* ... Input for contact person/office ... */}
              />
              <FormField
                name="distributionInfo.distributionContact.email"
                render={/* ... Input type email ... */}
              />
              <FormField
                name="distributionInfo.distributionContact.departmentUnit"
                render={/* ... Input for department/unit ... */}
              />
              <FormField
                name="distributionInfo.distributionContact.phoneNumber"
                render={/* ... Input for phone number ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>

      {/* --- Metadata Record Information (metadataReferenceInfo JSONB) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata Record Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="metadataReferenceInfo.metadataCreationDate"
            render={/* ... DatePicker for metadata creation date ... */}
          />
          <FormField
            name="metadataReferenceInfo.metadataReviewDate"
            render={/* ... DatePicker for metadata review date ... */}
          />

          {/* Metadata Point of Contact */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">
              Metadata Point of Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="metadataReferenceInfo.metadataPoc.contactName_metadataPOC"
                render={/* ... Input for POC name ... */}
              />
              <FormField
                name="metadataReferenceInfo.metadataPoc.email_metadataPOC"
                render={/* ... Input type email for POC email ... */}
              />
              <FormField
                name="metadataReferenceInfo.metadataPoc.address_metadataPOC"
                render={/* ... Textarea for POC address ... */}
                className="md:col-span-2"
              />
              <FormField
                name="metadataReferenceInfo.metadataPoc.phoneNumber_metadataPOC"
                render={/* ... Input for POC phone number ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Handling `additionalInfo` (JSONB):**

This field is for "Any other relevant information not covered".

- **Option 1 (Simple):** A single `<Textarea>` where users can input JSON manually. This is easy to implement but not very user-friendly.
  ```tsx
  // In some appropriate form section
  <FormField
    name="additionalInfo"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Additional Information (JSON format)</FormLabel>
        <FormControl>
          <Textarea
            placeholder='Enter any other relevant information as a JSON object, e.g., {"custom_field": "value"}'
            {...field}
            onChange={e => {
              // Attempt to parse to ensure it's somewhat valid JSON for the form state
              try {
                const parsed = JSON.parse(e.target.value)
                field.onChange(parsed)
              } catch (error) {
                // Or handle invalid JSON input, maybe set an error
                field.onChange(e.target.value) // Or keep as string and parse on submit
              }
            }}
            // value={typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : field.value}
          />
        </FormControl>
        <FormDescription>Use valid JSON format.</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
  ```
- **Option 2 (Key-Value Pairs):** Implement a dynamic list of key-value inputs using `useFieldArray`. This is more structured.
- **Option 3 (Omit for now):** If this field is not immediately critical, you could omit it from the form in the first iteration.

For simplicity and to get the core structure in place, Option 1 or 3 might be best initially.

**Updating `metadata-form.tsx` (Main Form Component):**

1.  **Import New Forms:** Import `ProcessingInfoForm`.
2.  **Update `steps` Array:** Add `ProcessingInfoForm` to the `steps` array in the correct sequence.

    ```typescript
    // app/(app)/metadata/create/_components/metadata-form.tsx
    // ... other imports
    import { ProcessingInfoForm } from "./processing-info-form" // New

    // ...
    const steps = [
      {
        title: "General Information",
        description: "Fill in basic information...",
        component: GeneralInfoForm
      },
      {
        title: "Technical Details",
        description: "Provide technical specifications...",
        component: TechnicalDetailsForm
      },
      {
        title: "Data Quality",
        description: "Add information about data quality...",
        component: DataQualityForm
      },
      {
        title: "Processing & Source",
        description: "Detail data processing and lineage...",
        component: ProcessingInfoForm
      }, // New Step
      {
        title: "Access & Reference",
        description: "Specify access, licensing, and metadata contact...",
        component: AccessInfoForm
      },
      {
        title: "Review & Submit",
        description: "Review all information...",
        component: ReviewForm
      } // ReviewForm will also need updates to display all new fields
    ]
    // ...
    ```

3.  **Zod Schema:** Ensure the main Zod schema we discussed earlier is implemented here.
4.  **Default Values:** Ensure `defaultMetadataFormValues` in `metadata-form.tsx` is updated to include defaults for all new fields and nested JSONB structures.

**Final Step: Server Action Updates**

- Locate your server action for creating metadata (e.g., `actions/db/metadata-actions.ts` - `createMetadataRecordAction`).
- It must now accept a payload that conforms to the `InsertMetadataRecord` type (derived from the updated Drizzle schema which includes all the JSONB fields with their TypeScript types).
- When calling `db.insert(metadataRecordsTable).values(dataToInsert)`, ensure `dataToInsert` correctly maps all the form values, especially the nested JSONB objects, to the corresponding columns in your Drizzle schema. If your form passes dates as strings, and your Drizzle schema expects `Date` objects for `date` columns (or vice-versa), perform the necessary conversions.

This completes the detailed plan for the UI forms. Implementing this will involve a lot of careful coding of `FormField` components, ensuring correct paths for `react-hook-form`, and handling the nested structures for JSONB fields.

Remember to:

- Create the new file `app/(app)/metadata/create/_components/processing-info-form.tsx`.
- Update the existing form component files.
- Update `app/(app)/metadata/create/_components/metadata-form.tsx` with the new Zod schema, default values, and the new step.
- Thoroughly test the form submission and data saving process.

This is a large set of changes. Take it step-by-step and test each form section as you build it.

```typescriptreact
// app/(app)/metadata/create/_components/data-quality-form.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { MetadataFormValues } from "./metadata-form";
// ... Import UI components: Input, Textarea, Card, CardHeader, CardTitle, CardContent, FormField, etc. ...

export function DataQualityForm() {
  const form = useFormContext<MetadataFormValues>();

  return (
    <div className="space-y-8">
      {/* --- Data Quality Assessment (dataQualityInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Data Quality Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="dataQualityInfo.logicalConsistencyReport"
            render={/* ... Textarea for logical consistency report ... */}
          />
          <FormField
            name="dataQualityInfo.completenessReport"
            render={/* ... Textarea for completeness report ... */}
          />
          <FormField
            name="dataQualityInfo.attributeAccuracyReport"
            render={/* ... Textarea for attribute accuracy report ... */}
          />

          {/* Horizontal Positional Accuracy */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Horizontal Positional Accuracy</h4>
            <div className="space-y-4">
              <FormField
                name="dataQualityInfo.horizontalAccuracy.accuracyReport"
                render={/* ... Textarea for horizontal accuracy report ... */}
              />
              <FormField
                name="dataQualityInfo.horizontalAccuracy.accuracyPercentage"
                render={/* ... Input type number for horizontal accuracy percentage ... */}
              />
              <FormField
                name="dataQualityInfo.horizontalAccuracy.accuracyExplanation"
                render={/* ... Textarea for horizontal accuracy explanation ... */}
              />
            </div>
          </Card>

          {/* Vertical Positional Accuracy */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Vertical Positional Accuracy</h4>
            <div className="space-y-4">
              <FormField
                name="dataQualityInfo.verticalAccuracy.accuracyReport"
                render={/* ... Textarea for vertical accuracy report ... */}
              />
              <FormField
                name="dataQualityInfo.verticalAccuracy.accuracyPercentage"
                render={/* ... Input type number for vertical accuracy percentage ... */}
              />
              <FormField
                name="dataQualityInfo.verticalAccuracy.accuracyExplanation"
                render={/* ... Textarea for vertical accuracy explanation ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescriptreact
// app/(app)/metadata/create/_components/processing-info-form.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { MetadataFormValues } from "./metadata-form";
// ... Import UI components ...

export function ProcessingInfoForm() {
  const form = useFormContext<MetadataFormValues>();

  return (
    <div className="space-y-8">
      {/* --- Data Processing & Source Lineage (processingInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Data Processing & Source Lineage</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="processingInfo.processingStepsDescription"
            render={/* ... Textarea for processing steps ... */}
          />
          <FormField
            name="processingInfo.softwareAndVersionUsed"
            render={/* ... Input for software and version ... */}
          />
          <FormField
            name="processingInfo.processedDate"
            render={/* ... DatePicker for processed date ... */}
          />

          {/* Processor Contact Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Processor Contact</h4>
            <div className="space-y-4">
              <FormField
                name="processingInfo.processorContact.processorName"
                render={/* ... Input for processor name ... */}
              />
              <FormField
                name="processingInfo.processorContact.processorEmail"
                render={/* ... Input type email for processor email ... */}
              />
              <FormField
                name="processingInfo.processorContact.processorAddress"
                render={/* ... Textarea for processor address ... */}
              />
            </div>
          </Card>

          {/* Source Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Source Information</h4>
            <div className="space-y-4">
              <FormField
                name="processingInfo.sourceInfo.sourceScaleDenominator"
                render={/* ... Input type number for source scale denominator ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.sourceMediaType"
                render={/* ... Input/Select for source media type ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.sourceCitation"
                render={/* ... Textarea for source citation ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.citationTitle"
                render={/* ... Input for citation title ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.contractReference"
                render={/* ... Input for contract reference ... */}
              />
              <FormField
                name="processingInfo.sourceInfo.contractDate"
                render={/* ... DatePicker for contract date ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescriptreact
// app/(app)/metadata/create/_components/access-info-form.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { MetadataFormValues } from "./metadata-form";
// ... Import UI components, including Checkbox group for accessRestrictions ...
// ... Potentially useFieldArray for accessRestrictions if they are free-text, otherwise a multi-select checkbox group ...


export function AccessInfoForm() {
  const form = useFormContext<MetadataFormValues>();

  // Example for accessRestrictions if they are predefined checkboxes
  const accessRestrictionOptions = [
    { id: "commercial", label: "Commercial use restrictions" },
    { id: "confidential", label: "Confidential information" },
    // ... other options
  ];


  return (
    <div className="space-y-8">
      {/* --- Distribution & Licensing (distributionInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Distribution & Licensing</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="distributionInfo.distributionFormat"
            render={/* ... Input/Select for distribution format ... */}
          />
          <FormField
            name="distributionInfo.accessMethod"
            render={/* ... Input/Select for access method (e.g., Download, API) ... */}
          />
          <FormField
            name="distributionInfo.downloadUrl"
            render={/* ... Input type URL for download URL ... */}
          />
          <FormField
            name="distributionInfo.apiEndpoint"
            render={/* ... Input type URL for API endpoint ... */}
          />

          {/* License Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">License Information</h4>
            <div className="space-y-4">
              <FormField
                name="distributionInfo.licenseInfo.licenseType"
                render={/* ... Input/Select for license type ... */}
              />
              <FormField
                name="distributionInfo.licenseInfo.usageTerms"
                render={/* ... Textarea for usage terms ... */}
              />
              <FormField
                name="distributionInfo.licenseInfo.attributionRequirements"
                render={/* ... Textarea for attribution requirements ... */}
              />
              <FormField
                name="distributionInfo.licenseInfo.accessRestrictions"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Restrictions</FormLabel>
                    <FormDescription>Select any specific access restrictions that apply.</FormDescription>
                    <div className="space-y-2">
                      {accessRestrictionOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="distributionInfo.licenseInfo.accessRestrictions"
                          render={({ field: itemField }) => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={itemField.value?.includes(option.label)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = itemField.value || [];
                                      if (checked) {
                                        itemField.onChange([...currentValues, option.label]);
                                      } else {
                                        itemField.onChange(
                                          currentValues.filter((value) => value !== option.label)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Distribution Contact Information */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Distribution Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="distributionInfo.distributionContact.contactPersonOffice"
                render={/* ... Input for contact person/office ... */}
              />
              <FormField
                name="distributionInfo.distributionContact.email"
                render={/* ... Input type email ... */}
              />
              <FormField
                name="distributionInfo.distributionContact.departmentUnit"
                render={/* ... Input for department/unit ... */}
              />
              <FormField
                name="distributionInfo.distributionContact.phoneNumber"
                render={/* ... Input for phone number ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>

      {/* --- Metadata Record Information (metadataReferenceInfo JSONB) --- */}
      <Card>
        <CardHeader><CardTitle>Metadata Record Information</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="metadataReferenceInfo.metadataCreationDate"
            render={/* ... DatePicker for metadata creation date ... */}
          />
          <FormField
            name="metadataReferenceInfo.metadataReviewDate"
            render={/* ... DatePicker for metadata review date ... */}
          />

          {/* Metadata Point of Contact */}
          <Card className="p-4">
            <h4 className="mb-2 text-lg font-medium">Metadata Point of Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="metadataReferenceInfo.metadataPoc.contactName_metadataPOC"
                render={/* ... Input for POC name ... */}
              />
               <FormField
                name="metadataReferenceInfo.metadataPoc.email_metadataPOC"
                render={/* ... Input type email for POC email ... */}
              />
              <FormField
                name="metadataReferenceInfo.metadataPoc.address_metadataPOC"
                render={/* ... Textarea for POC address ... */}
                className="md:col-span-2"
              />
              <FormField
                name="metadataReferenceInfo.metadataPoc.phoneNumber_metadataPOC"
                render={/* ... Input for POC phone number ... */}
              />
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescriptreact
    // In some appropriate form section
    <FormField
      name="additionalInfo"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Additional Information (JSON format)</FormLabel>
          <FormControl>
            <Textarea
              placeholder='Enter any other relevant information as a JSON object, e.g., {"custom_field": "value"}'
              {...field}
              onChange={e => {
                // Attempt to parse to ensure it's somewhat valid JSON for the form state
                try {
                  const parsed = JSON.parse(e.target.value);
                  field.onChange(parsed);
                } catch (error) {
                  // Or handle invalid JSON input, maybe set an error
                  field.onChange(e.target.value); // Or keep as string and parse on submit
                }
              }}
              // value={typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : field.value}
            />
          </FormControl>
          <FormDescription>Use valid JSON format.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
```

```typescript
// app/(app)/metadata/create/_components/metadata-form.tsx
// ... other imports
import { ProcessingInfoForm } from "./processing-info-form" // New

// ...
const steps = [
  {
    title: "General Information",
    description: "Fill in basic information...",
    component: GeneralInfoForm
  },
  {
    title: "Technical Details",
    description: "Provide technical specifications...",
    component: TechnicalDetailsForm
  },
  {
    title: "Data Quality",
    description: "Add information about data quality...",
    component: DataQualityForm
  },
  {
    title: "Processing & Source",
    description: "Detail data processing and lineage...",
    component: ProcessingInfoForm
  }, // New Step
  {
    title: "Access & Reference",
    description: "Specify access, licensing, and metadata contact...",
    component: AccessInfoForm
  },
  {
    title: "Review & Submit",
    description: "Review all information...",
    component: ReviewForm
  } // ReviewForm will also need updates to display all new fields
]
// ...
```
