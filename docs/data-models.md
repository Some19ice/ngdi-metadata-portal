# Data Models & Database Schema Specifications

This document details the database schemas for the NGDI Portal.

## General Conventions

- **Primary Keys:** All tables will have a primary key, typically `id UUID DEFAULT gen_random_uuid()`.
- **Timestamps:** Standard `createdAt` and `updatedAt` timestamps will be included.
  - `createdAt TIMESTAMPTZ DEFAULT now() NOT NULL`
  - `updatedAt TIMESTAMPTZ DEFAULT now() NOT NULL` (with trigger for auto-update)
- **User ID:** Fields referencing users will be `userId TEXT NOT NULL` (matching Clerk's user ID format).
- **Foreign Keys:** Will specify `ON DELETE` and `ON UPDATE` behavior.
- **Naming:** Tables will be plural (e.g., `organizations`), columns will be camelCase. Drizzle schemas will reflect this.

---

## Phase 1: Core Setup, User Roles & Organization Management

### 1. `roles` Table

- **Description:** Stores the defined user roles within the system.
- **Schema:**
  | Column | Type | Constraints | Description |
  |-------------|--------------|--------------------------|-----------------------------------|
  | `id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the role |
  | `name` | `VARCHAR(50)`| `UNIQUE`, `NOT NULL` | Name of the role (e.g., "System Administrator", "Node Officer") |
  | `description`| `TEXT` | | Optional description of the role |
  | `createdAt` | `TIMESTAMPTZ`| `DEFAULT now() NOT NULL` | Timestamp of creation |
  | `updatedAt` | `TIMESTAMPTZ`| `DEFAULT now() NOT NULL` | Timestamp of last update |

### 2. `permissions` Table

- **Description:** Defines specific actions or capabilities within the system.
- **Schema:**
  | Column | Type | Constraints | Description |
  |-------------|---------------|--------------------------|-----------------------------------|
  | `id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for permission |
  | `action` | `VARCHAR(100)`| `NOT NULL` | e.g., "create", "read", "update", "delete", "approve" |
  | `subject` | `VARCHAR(100)`| `NOT NULL` | e.g., "organization", "metadataRecord", "user" |
  | `description`| `TEXT` | | Optional description of permission|
  | `createdAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of creation |
  | `updatedAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of last update |
  _Unique constraint on (`action`, `subject`)_

### 3. `rolePermissions` Table (Join Table)

- **Description:** Links roles to their granted permissions.
- **Schema:**
  | Column | Type | Constraints | Description |
  |----------------|-------------|----------------------------------------------|--------------------------------------|
  | `roleId` | `INTEGER` | `NOT NULL`, `REFERENCES roles(id) ON DELETE CASCADE` | Foreign key to `roles` table |
  | `permissionId` | `INTEGER` | `NOT NULL`, `REFERENCES permissions(id) ON DELETE CASCADE` | Foreign key to `permissions` table |
  | `createdAt` | `TIMESTAMPTZ`| `DEFAULT now() NOT NULL` | Timestamp of creation |
  _Primary key on (`roleId`, `permissionId`)_

### 4. `organizations` Table

- **Description:** Stores information about participating organizations/nodes.
- **Schema:**
  | Column | Type | Constraints | Description |
  |----------------------|---------------|--------------------------|-------------------------------------------------|
  | `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique identifier |
  | `name` | `VARCHAR(255)`| `NOT NULL` | Official name of the organization |
  | `description` | `TEXT` | | Description of the organization |
  | `primaryContactName` | `VARCHAR(255)`| | Name of primary contact |
  | `primaryContactEmail`| `VARCHAR(255)`| | Email of primary contact (validate format) |
  | `primaryContactPhone`| `VARCHAR(50)` | | Phone of primary contact |
  | `websiteUrl` | `VARCHAR(255)`| | Organization's website URL (validate format) |
  | `address` | `TEXT` | | Physical address |
  | `logoUrl` | `VARCHAR(255)`| | URL to organization's logo |
  | `status` | `VARCHAR(50)` | `NOT NULL DEFAULT \'active\'` | e.g., 'active', 'inactive', 'pending_approval' |
  | `createdAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of creation |
  | `updatedAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of last update |

### 5. `userOrganizations` Table (Join Table)

- **Description:** Links users to organizations and specifies their role within that organization.
- **Schema:**
  | Column | Type | Constraints | Description |
  |-----------------|-------------|----------------------------------------------|-------------------------------------------|
  | `userId` | `TEXT` | `NOT NULL` | User ID from Clerk |
  | `organizationId`| `UUID` | `NOT NULL`, `REFERENCES organizations(id) ON DELETE CASCADE` | Foreign key to `organizations` table |
  | `role` | `TEXT` | `NOT NULL` | Role of the user within the organization (e.g., 'Node Officer', 'Member', 'Metadata Creator', 'Metadata Approver') |
  | `createdAt` | `TIMESTAMPTZ`| `DEFAULT now() NOT NULL` | Timestamp of creation |
  | `updatedAt` | `TIMESTAMPTZ`| `DEFAULT now() NOT NULL` | Timestamp of last update |
  _Primary key on (`userId`, `organizationId`)_
  _Note: This table defines a user's single specific role within a particular organization. If a user needs multiple roles in the same organization, a different structure might be needed or this role field could store a primary organizational role._

### 6. `userRoles` Table

- **Description:** Links users to system-wide roles. For roles specific to an organization (like Metadata Creator _for_ Org X), context will come from `userOrganizations`.
- **Schema:**
  | Column | Type | Constraints | Description |
  |-------------|-------------|----------------------------------------------|-----------------------------------|
  | `userId` | `TEXT` | `NOT NULL` | User ID from Clerk |
  | `roleId` | `INTEGER` | `NOT NULL`, `REFERENCES roles(id) ON DELETE CASCADE` | Foreign key to `roles` table |
  | `createdAt` | `TIMESTAMPTZ`| `DEFAULT now() NOT NULL` | Timestamp of creation |
  _Primary key on (`userId`, `roleId`)_

---

## Phase 2: Metadata Schema, Basic CRUD & "My Metadata"

### 1. `metadataRecords` Table

- **Description:** Core table for storing metadata records, significantly expanded to align with detailed UI form fields and PRD specifications.
- **Schema:**
  | Column | Type | Constraints | Description |
  |---------------------------|---------------|----------------------------------------|------------------------------------------------------------------------------------------------------------|
  | `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()`| Unique identifier for the metadata database record. |
  | `title` | `TEXT` | `NOT NULL` | A concise and descriptive name for the dataset (corresponds to "Data Name/Title" from UI). |
  | `dataType` | `VARCHAR(50)` | `NOT NULL` | The method used to represent geographic features (e.g., "Raster", "Vector", "Table"). |
  | `abstract` | `TEXT` | `NOT NULL` | A brief summary of the dataset's content and scope. |
  | `purpose` | `TEXT` | | The intended use or reason for creating the dataset. |
  | `creatorUserId` | `TEXT` | `NOT NULL` | User ID (from Clerk) of the metadata creator. |
  | `organizationId` | `UUID` | `REFERENCES organizations(id)` | Owning/publishing organization. |
  | `status` | `VARCHAR(50)` | `NOT NULL DEFAULT 'draft'` | Workflow status (e.g., 'draft', 'pending_validation', 'approved', 'published', 'rejected', 'archived'). |
  | `version` | `VARCHAR(50)` | | Metadata record version. |
  | `language` | `VARCHAR(10)` | `NOT NULL DEFAULT 'en'` | Language of the metadata (ISO 639-1 code). |
  | `assessment` | `VARCHAR(50)` | | Completion status of the dataset (e.g., "Complete", "Incomplete"). |
  | `updateFrequency` | `VARCHAR(50)` | | How often the dataset is planned to be updated (e.g., "Monthly", "Quarterly", "Annually", "As needed"). |
  | `productionDate` | `DATE` | | The date when the dataset was created or produced. |
  | `publicationDate` | `DATE` | | Date of data publication (distinct from metadata record creation/update). |
  | `lastRevisionDate` | `DATE` | | Date of last data revision. |
  | `keywords` | `TEXT[]` | | Array of keywords for searchability. |
  | `thumbnailUrl` | `VARCHAR(255)`| | A URL link to a representative image or preview of the dataset. |
  | `cloudCoverPercentage` | `INTEGER` | | Percentage of the dataset obscured by clouds (for satellite/aerial imagery). Min:0, Max:100. |
  | `frameworkType` | `VARCHAR(100)`| | Type of framework the data belongs to (e.g., Fundamental, Thematic). |
  | `locationInfo` | `JSONB` | | **Geographic Coverage Details:** Contains `country` (e.g., "Nigeria"), `geopoliticalZone`, `state`, `lga`, `townCity`. |
  | `spatialInfo` | `JSONB` | | **Spatial Characteristics:** Contains `coordinateSystem`, `projection`, `scale` (denominator as integer), `resolution` (text, e.g., "30m"), `coordinateUnit` ("DD" or "DMS"), `minLatitude` (float), `minLongitude` (float), `maxLatitude` (float), `maxLongitude` (float), `spatialRepresentationType` (e.g., "Image", "Point"). |
  | `temporalInfo` | `JSONB` | | **Temporal Extent:** Contains `dateFrom` (data validity start date), `dateTo` (data validity end date). |
  | `technicalDetailsInfo` | `JSONB` | | **Technical Specifications:** Contains `fileFormat` (e.g., "GeoTIFF", "Shapefile"), `fileSizeMB` (integer), `numFeaturesOrLayers` (integer), `softwareHardwareRequirements` (text). |
  | `constraintsInfo` | `JSONB` | | **Access and Use Constraints:** Contains `accessConstraints` (text describing limitations on access), `useConstraints` (text describing limitations on use), `otherConstraints` (text for any other relevant constraints). |
  | `dataQualityInfo` | `JSONB` | | **Data Quality Assessment:** Contains `logicalConsistencyReport` (text), `completenessReport` (text). For Attribute Accuracy: `attributeAccuracyReport` (text). For Positional Accuracy (Horizontal): `horizontalAccuracyReport` (text), `horizontalAccuracyPercentage` (integer), `horizontalAccuracyExplanation` (text). For Positional Accuracy (Vertical): `verticalAccuracyReport` (text), `verticalAccuracyPercentage` (integer), `verticalAccuracyExplanation` (text). |
  | `processingInfo` | `JSONB` | | **Data Processing & Source Lineage:** Contains `processingStepsDescription` (text), `softwareAndVersionUsed` (text), `processedDate` (date). Processor Contact: `processorName` (text), `processorEmail` (text), `processorAddress` (text). Source Info: `sourceScaleDenominator` (integer), `sourceMediaType` (text), `sourceCitation` (text), `citationTitle` (text), `contractReference` (text), `contractDate` (date). |
  | `distributionInfo` | `JSONB` | | **Distribution & Licensing:** Contains `distributionFormat` (text), `accessMethod` (text, e.g., "Download", "API"), `downloadUrl` (URL), `apiEndpoint` (URL). License Info: `licenseType` (text), `usageTerms` (text), `attributionRequirements` (text), `accessRestrictions` (array of selected strings like "Commercial use restrictions"). Distribution Contact: `contactPersonOffice` (text), `email` (text), `departmentUnit` (text), `phoneNumber` (text). |
  | `metadataReferenceInfo` | `JSONB` | | **Metadata Record Information:** Contains `metadataCreationDate` (date this metadata entry was first created by user), `metadataReviewDate` (date this metadata entry was last reviewed), `contactName_metadataPOC` (text), `address_metadataPOC` (text), `email_metadataPOC` (text), `phoneNumber_metadataPOC` (text). |
  | `fundamentalDatasetsInfo` | `JSONB` | | **Fundamental Datasets Included:** Structure indicating selected types (e.g., `geodeticData: boolean`, `topographicData: boolean`, ..., `others: boolean`, `othersSpecify: text`). |
  | `additionalInfo` | `JSONB` | | Any other relevant information not covered in specific JSONB fields or top-level columns. |
  | `createdAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of database record creation. |
  | `updatedAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of last database record update. |
  _Consider Full-Text Search (FTS) indexing on `title`, `abstract`, `keywords`, and potentially searchable fields within JSONB columns if supported by the database._

### 2. `metadataAuditLog` Table

- **Description:** Tracks changes and workflow actions performed on metadata records.
- **Schema:**
  | Column | Type | Constraints | Description |
  |--------------------|---------------|----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
  | `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique identifier for the audit log entry. |
  | `metadataRecordId` | `UUID` | `NOT NULL REFERENCES metadataRecords(id) ON DELETE CASCADE` | Foreign key to the `metadataRecords` table, linking the audit to a specific record. |
  | `userId` | `TEXT` | `NOT NULL` | User ID (from Clerk) of the user who performed the action. Could be a system ID for automated actions. |
  | `actionType` | `VARCHAR(100)`| `NOT NULL` | Type of action performed (e.g., 'CREATE', 'UPDATE', 'SUBMIT_FOR_VALIDATION', 'APPROVE', 'REJECT', 'PUBLISH', 'ARCHIVE', 'VALIDATION_SUCCESS', 'VALIDATION_FAILURE'). |
  | `changedFields` | `JSONB` | | Optional: JSON object detailing what fields were changed and their old/new values for 'UPDATE' actions. |
  | `oldStatus` | `VARCHAR(50)` | | The status of the metadata record before this action was performed. |
  | `newStatus` | `VARCHAR(50)` | | The status of the metadata record after this action was performed. |
  | `comments` | `TEXT` | | Comments or notes related to the action, e.g., reason for rejection, approval notes, validation feedback. |
  | `details` | `JSONB` | | Additional details about the action, e.g., validation error messages, system-generated notes. |
  | `createdAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of when the audit log entry was created. |

---

## Phase 3: System Configuration & Advanced Management

### 1. `systemSettings` Table

- **Description:** Stores system-wide configuration settings for the portal. This allows administrators to modify portal behavior without code changes.
- **Schema:**
  | Column | Type | Constraints | Description |
  |-------------|---------------|-------------------------------------|-----------------------------------------------------------------------------------------------------------|
  | `key` | `VARCHAR(255)`| `PRIMARY KEY` | Unique key for the setting (e.g., 'siteName', 'maintenanceMode', 'defaultLanguage', 'maxUploadSizeMB'). |
  | `value` | `TEXT` | `NOT NULL` | The value of the setting. Can store strings, numbers, booleans (as text), or JSON strings. |
  | `label` | `VARCHAR(255)`| | User-friendly label for the setting, used in admin interfaces. |
  | `description`| `TEXT` | | Optional detailed description of what the setting controls and its possible values. |
  | `type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'string'` | Data type of the value (e.g., 'string', 'boolean', 'integer', 'json', 'enum') to aid in UI and validation. |
  | `group` | `VARCHAR(100)`| | Optional grouping for settings in an admin UI (e.g., 'General', 'Metadata', 'Security', 'Notifications'). |
  | `isPublic` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Indicates if the setting value can be safely exposed to the client-side (e.g., for UI configurations). |
  | `createdAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of when the setting was initially created. |
  | `updatedAt` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp of when the setting was last updated. |

_This table provides a flexible way to manage various aspects of the portal. For settings with predefined options (like enums for 'defaultLanguage'), the application logic would handle validation against those allowed values._

---

_This document outlines the core data models. As development progresses through further phases, additional tables or modifications to existing ones may be identified and will be appended here._
