# NGDI Portal - Product Requirements Document

## 1. Introduction

The NGDI (National Geospatial Data Infrastructure) Portal is a comprehensive web-based platform designed to facilitate the discovery, access, management, and visualization of geospatial metadata and data. It serves as a central hub for various stakeholders, including government agencies, researchers, private sector entities, and the public, to interact with geospatial information in a standardized and efficient manner. The portal aims to promote data sharing, improve decision-making, and support national development by making geospatial resources more accessible and usable.

## 2. Goals and Objectives

- **Centralized Access:** Provide a single point of access to a wide range of geospatial metadata and data from various contributing organizations.
- **Standardization:** Ensure metadata conforms to NGDI standards for consistency and interoperability.
- **Discovery:** Enable users to easily search, find, and evaluate relevant geospatial datasets.
- **Visualization:** Offer tools for visualizing geospatial data on interactive maps.
- **Management:** Allow authorized users and node officers to create, update, manage, and validate metadata records.
- **Collaboration:** Facilitate data sharing and collaboration among different user groups and organizations.
- **Security:** Implement robust authentication and authorization mechanisms to protect data integrity and control access.
- **User-Friendliness:** Provide an intuitive and accessible user interface for all user types.

## 3. Target Audience / User Personas

- **General Public/Basic Users:** Interested in discovering and viewing publicly available geospatial data and information (e.g., for educational or informational purposes).
- **Data Consumers (Researchers, Analysts, Planners):** Require access to specific datasets for research, analysis, planning, and decision-making.
- **Data Providers/Node Officers:** Responsible for contributing, managing, and ensuring the quality of metadata and data from their respective organizations.
- **Administrators:** Oversee the portal's operation, manage users, control system settings, and ensure overall platform health.

## 4. Key Features

### 4.1. User Authentication and Authorization

- **Registration:** Allow new users to register for an account.
- **Login/Logout:** Secure user login with email/password and potentially OAuth providers.
- **Password Management:** Secure password storage, password reset functionality.
- **Session Management:** Maintain user sessions and provide mechanisms for session refresh and termination.
- **Role-Based Access Control (RBAC):** Implement a granular access control system based on user roles and permissions (detailed in Section 6).
- **Profile Management:** Allow users to view and update their profile information (name, organization, contact details).

#### 4.1.1. User Roles Overview

The system supports several user roles to manage access and responsibilities. These include general users, organizational representatives (Node Officers), and system administrators. Additionally, for managing metadata within organizations, specific roles for metadata creation and approval are defined.

#### 4.1.2. Node Officer

- **Description:** Designated personnel within a participating organization responsible for managing their organization's metadata contributions to the NGDI portal. They ensure the quality and accuracy of the metadata submitted by their organization.
- **Key Responsibilities (may vary based on organizational structure):**
  - Oversee metadata creation and submission for their organization.
  - Act as the primary point of contact for their organization regarding metadata matters.
  - Manage user access and roles (e.g., `MetadataCreator`, `MetadataApprover`) within their organization on the portal.
  - Ensure metadata from their organization adheres to NGDI standards and guidelines.
  - May perform or delegate `MetadataCreator` and/or `MetadataApprover` roles.
  - Delete or archive outdated/incorrect metadata records from their organization.

#### 4.1.3. Metadata Creator (New Role)

- **Description:** Individuals within an organization (potentially the Node Officer themselves or delegates) responsible for the initial creation, uploading, and editing of metadata records.
- **Key Responsibilities:**
  - Input and maintain detailed metadata information according to specified standards.
  - Ensure accuracy and completeness of the metadata fields.
  - Submit metadata for approval within their organization.
  - Revise metadata based on feedback from `MetadataApprover`.

#### 4.1.4. Metadata Approver (New Role)

- **Description:** Individuals within an organization responsible for reviewing and validating metadata submitted by `MetadataCreators` before it is published to the wider portal or made publicly discoverable.
- **Key Responsibilities:**
  - Review submitted metadata for accuracy, completeness, and compliance with NGDI and organizational standards.
  - Approve metadata for publication.
  - Reject metadata and provide constructive feedback for revisions.
  - Ensure quality control of the organization's metadata contributions.

#### 4.1.5. System Administrator

- **Description:** Personnel with the highest level of access, responsible for overall system management, user account administration across all organizations, configuration of system-wide settings, and platform integrity.
- **Key Responsibilities:**
  - Full control over all system functionalities.
  - Manage users, roles, and permissions across all organizations.
  - System configuration and maintenance.
  - Oversee platform-wide metadata quality and standards.
  - Access to all audit logs and system analytics.

### 4.2. Metadata Management

- **Metadata Creation:** Allow authorized users (e.g., Node Officers, Admins, Metadata Creators) to create new metadata records through a user-friendly form, adhering to NGDI standards.
- **Metadata Viewing:** Display comprehensive metadata information in a structured and readable format.
- **Metadata Editing:** Allow authorized users to edit existing metadata records.
- **Metadata Deletion:** Allow authorized users to delete metadata records (soft delete or permanent, based on policy).
- **Metadata Validation:** Implement validation rules (manual or automated) to ensure metadata quality and compliance with standards. This is supported by fields indicating validation status and system settings related to metadata validation.
- **Draft Management:** Allow users to save incomplete metadata entries as drafts.
- **My Metadata:** Provide a dedicated section for users to view and manage metadata they have submitted or are responsible for.
- **Metadata Export:** Allow users to export metadata records in various formats, including XML and other standard geospatial metadata formats.

### 4.3. Search and Discovery

- **Keyword Search:** Allow users to search metadata records using keywords across various fields (title, abstract, categories, etc.).
- **Faceted Search/Filtering:** Provide advanced filtering options based on metadata attributes (e.g., data type, organization, date range, spatial extent, framework type, categories).
- **Spatial Search:** Allow users to define an area of interest on a map to find relevant datasets within that extent.
- **Search Results Display:** Present search results in a clear, sortable list format with summaries and links to full metadata views.

### 4.4. Map Visualization

- **Interactive Map Interface:** Provide an interactive map for visualizing geospatial datasets.
- **Layer Management:** Allow users to add, remove, and manage different data layers on the map.
- **Basic Map Tools:** Include tools for pan, zoom, measure, and identify features.
- **Integration with Metadata:** Link map visualizations with corresponding metadata records.

### 4.5. Admin Dashboard & Management

The Admin Dashboard serves as the central control panel for System Administrators to oversee, manage, and configure the entire NGDI Portal. It provides comprehensive tools for platform governance and operational control.

- **System Overview & Health Monitoring:**

  - **At-a-Glance Statistics:** Key metrics displayed prominently, including:
    - Total Users (with breakdown by primary role: Admin, Node Officer, Registered User).
    - Total registered Organizations/Nodes.
    - Total Metadata Records (with breakdown by status: Published, Approved, Pending Validation, Draft, Needs Revision).
    - Active User Sessions.
    - Recent System Alerts or Critical Errors requiring attention.
  - **Key Performance Indicators (KPIs):** Visual charts and trends for:
    - New user registrations over time (e.g., daily, weekly, monthly).
    - New metadata submissions and publication rates.
    - System-wide metadata approval rates and average processing times.
  - **Quick Links:** Direct navigation to critical management sections (User Management, Metadata Oversight, System Settings, Audit Logs).

- **Comprehensive User Management:**

  - **User Directory & Search:**
    - View, search, and filter all registered users (columns: Username, Email, Assigned Role(s), Organization affiliation, Account Status, Last Login, Date Joined).
    - Advanced search by username, email, organization, or role.
    - Filter by account status (Active, Suspended, Pending Email Verification).
  - **User Profile Administration:**
    - View and edit detailed user profiles.
    - Manually create new user accounts if necessary.
    - Modify user roles (System Administrator, Node Officer, Registered User). For Node Officers, assign to specific organizations.
    - For users within an organization (managed by Node Officers), admins can also view/modify `MetadataCreator` or `MetadataApprover` roles if needed for troubleshooting or setup.
    - Suspend, unsuspend, or delete user accounts (with appropriate confirmations and considerations for associated data).
    - Initiate password reset procedures for users.
    - Access individual user activity logs.
  - **Bulk User Actions:** (e.g., Send announcements to specific roles, bulk suspend/activate accounts based on criteria).

- **Organization/Node Management:**

  - **Organization Directory & Search:** View, search, and filter all registered organizations/nodes.
  - **Organization Profile Administration:**
    - Create new organization entries.
    - Edit organization details (name, description, primary contact information).
    - Assign or change the designated Node Officer(s) for an organization.
    - View metadata contribution statistics and status summaries per organization.

- **Platform-Wide Metadata Oversight & Management:**

  - **Global Metadata Inventory:** Access to view and manage _all_ metadata records across the system, irrespective of their status or originating organization.
  - **Advanced Search & Filtering:** Granular search capabilities for administrators, including searching by internal IDs, user IDs, or specific technical fields.
  - **Bulk Metadata Operations:** Perform actions like bulk status changes (e.g., publishing all approved records from a specific period, archiving records older than a certain date), or reassigning metadata between organizations (with strict auditing).
  - **Quality Control & Integrity Tools:**
    - System-wide reports on metadata completeness, adherence to validation rules, and identification of common errors.
    - Tools to identify and manage orphaned records or records with broken links.
  - **Data Standards Configuration:** (If applicable) Interface to manage controlled vocabularies, metadata schema versions, or custom validation rules used by the automated validation system.

- **Granular Role and Permission System Management:**

  - Interface to manage the database-driven RBAC system (as detailed in Section 6.2):
    - Define, edit, and delete custom roles (beyond the base system roles).
    - Define, edit, and delete specific permissions (actions and subjects).
    - Associate permissions with custom roles.
    - Directly assign or revoke specific permissions for individual users in exceptional cases.
    - Manage permission groups for easier assignment.
  - Audit and review current permission assignments for any role or user.

- **System Configuration & Settings:**

  - **General Portal Settings:** Site name, official portal description, public contact email, default language settings.
  - **Authentication & Security Settings:** Enable/disable public user registration, configure email verification processes, define password policies (minimum length, complexity, expiration), session timeout durations.
  - **Metadata Processing Settings:** Default metadata schema version to be used, define system-wide mandatory fields for new submissions, configure parameters for automated validation rules and processes.
  - **Notification Management:** Customize email templates for various system notifications (new user registration, password reset, metadata status changes, admin alerts).
  - **API Access Control:** (If a public API is provided) Manage API keys, set rate limits, and monitor API usage.
  - **Maintenance Mode:** Ability to place the portal into a temporary maintenance mode, displaying a custom message to users, while allowing admin access.

- **System Analytics & Comprehensive Reporting:**

  - **Usage Dashboards:** Visualizations of user activity (logins, registrations, search patterns), metadata lifecycle trends (creation, submission, approval, publication rates), most active organizations, and most accessed datasets.
  - **Search Analytics:** Insights into top search queries, queries yielding no results, and effectiveness of search filters.
  - **System Performance Monitoring:** (May integrate with external monitoring tools) Dashboards for page load times, API response times, error rates, and server health.
  - **Custom Report Generation:** Ability to define, generate, and export reports on users, metadata, system activity, and compliance in various formats (e.g., CSV, PDF).

- **Audit Trail & Activity Logs:**

  - Access to a comprehensive, immutable, and searchable log of all significant actions performed by users and the system (e.g., logins, data changes, permission modifications, settings updates).
  - Advanced filtering capabilities for logs: by user, action type, date/time range, IP address, specific resource ID (e.g., metadata ID, user ID).
  - Essential for security auditing, incident response, troubleshooting, and demonstrating compliance.

- **Content Management System (CMS) Integration/Interface:**
  - Basic interface or integration to manage the content of static pages (e.g., About, Contact Us, Terms of Service, Privacy Policy, FAQs, News/Publications) if not managed directly through code deployment.

### 4.6. Content Pages

- **Homepage:** Engaging landing page with an overview of the portal, featured datasets, and quick search.
- **About NGDI:** Information about the NGDI initiative.
- **Documentation/User Guides:** Help materials, FAQs, and guides for using the portal.
- **News/Publications:** Section for updates, articles, and relevant publications.
- **Contact Us:** Form or information for users to get support or provide feedback.
- **Terms of Service & Privacy Policy:** Legal information regarding portal usage and data privacy.

### 4.7. Node Officer Enhanced Dashboard

This dedicated dashboard provides Node Officers with a comprehensive overview and tools to effectively manage their organization's metadata contributions, user activity, and data quality.

- **Dashboard Overview / At-a-Glance:**

  - **Total Metadata Records:** Count of all metadata records associated with the Node Officer's organization.
  - **Metadata Status Summary:** Visual breakdown (e.g., charts) of records by status: Draft, Pending Validation, Needs Revision, Approved, Published.
  - **Actionable Items:** Quick counts and direct links to records "Pending Validation" by their organization's approvers and records "Needing Revision" by their organization's creators.
  - **Recently Submitted/Updated:** A list of the most recently created or updated metadata records within their organization.
  - **Managed Users:** Count of `MetadataCreator` and `MetadataApprover` roles they manage within their organization.

- **Metadata Deep Dive & Analytics:**

  - **Inventory Management:**
    - Filterable and sortable list of all their organization's metadata.
    - Filters for `DatasetType`, `FrameworkType`, `Validation Status`, `Creation Date`, `Last Updated Date`.
    - Aggregate counts of metadata records per `DatasetType` and `FrameworkType`.
  - **Quality & Compliance Metrics:**
    - Percentage of records with all mandatory fields completed.
    - Average time from submission to approval for records within their organization.
    - List of records with identified validation issues or those overdue for review.
  - **Usage Insights (Future consideration, depends on tracking capabilities):**
    - Most viewed/downloaded datasets from their organization.
    - Top search terms that led users to their organization's datasets.

- **Organizational User Activity Monitoring:**

  - **Activity Feed:** A chronological list of recent, relevant actions by users within their organization (e.g., metadata submissions, approvals, rejections).
  - **Creator/Approver Performance:**
    - Number of records submitted per `MetadataCreator`.
    - Average review/approval time per `MetadataApprover`.
    - Number of records approved/rejected per `MetadataApprover`.
  - Direct link to the user management section for their organization.

- **Quick Actions & Reporting:**
  - "Create New Metadata Record" button.
  - "Manage Organization Users" link.
  - "View All My Organization's Metadata" link.
  - Option to generate and export simple reports (e.g., CSV of current metadata inventory with statuses for their organization).

## 5. Data Model - Metadata Schema

The primary metadata schema is based on a consolidation of NGDI requirements and the system's underlying data structures. It is organized into the following categories. Fields are described conceptually, with notes on their typical data types and obligation levels (mandatory, optional). Complex or structured information may be stored in flexible data formats like JSON within the database.

### 5.1. Identification and General Information

- **Title / Name of the data**
  - **Description:** The name or title of the dataset.
  - **Data Type:** Text, CharacterString
  - **Obligation:** Mandatory
- **Abstract / Description of the data**
  - **Description:** A brief summary of the dataset's contents.
  - **Data Type:** Text, CharacterString
  - **Obligation:** Mandatory
- **Purpose**
  - **Description:** The reason or intended use for the dataset.
  - **Data Type:** Text, CharacterString
  - **Obligation:** Mandatory
- **Dataset Type**
  - **Description:** Specifies the type of dataset being described (e.g., Raster, Vector, Table, Document, Service).
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Metadata ID (External)**
  - **Description:** Unique identifier assigned to the metadata record, potentially from an external system (distinct from the internal database record ID).
  - **Data Type:** CharacterString
  - **Obligation:** Optional
- **Keywords / Categories**
  - **Description:** Searchable terms or classification of dataset content.
  - **Data Type:** Array of Text/CharacterString
  - **Obligation:** Optional (may default to empty)
- **Language**
  - **Description:** Language of the data.
  - **Data Type:** Language drop-down list / Code (likely CharacterString)
  - **Obligation:** Optional
- **Supplemental Information**
  - **Description:** Additional information about the data.
  - **Data Type:** Text
  - **Obligation:** Mandatory (as per external schema requirements if applicable)
- **Edition**
  - **Description:** Date or version of the edition of the data.
  - **Data Type:** Alphanumeric String
  - **Obligation:** Optional
- **Author**
  - **Description:** Author of the dataset.
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Framework Type**
  - **Description:** Type of framework the data belongs to (e.g., Fundamental, Thematic).
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Thumbnail URL**
  - **Description:** URL to the thumbnail image for the dataset.
  - **Data Type:** URL String
  - **Obligation:** Mandatory
- **Image Name**
  - **Description:** Name of the image file associated with the dataset.
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Validation Status**
  - **Description:** Status of data validation (e.g., Validated, Pending, Invalid).
  - **Data Type:** CharacterString
  - **Obligation:** Optional
- **Assessment / Completion Status**
  - **Description:** Completion status of the dataset (e.g., Complete, Incomplete).
  - **Data Type:** CharacterString
  - **Obligation:** Optional

### 5.2. Spatial Information

- **Spatial Representation Type / Spatial Domain**
  - **Description:** Describes the spatial characteristics (e.g., Image, point, line, polygon) or defines the spatial coverage.
  - **Data Type:** Code / Enumeration (e.g., Image, point, line, polygon, number), Class
  - **Obligation:** Optional
- **Geographic Bounding Box / Bounding Coordinates**
  - **Description:** Defines the spatial extent of the dataset.
    - **South Bound Latitude**: Decimal Degree, Mandatory (may default to 0)
    - **North Bound Latitude**: Decimal Degree, Mandatory (may default to 0)
    - **West Bound Longitude**: Decimal Degree, Mandatory (may default to 0)
    - **East Bound Longitude**: Decimal Degree, Mandatory (may default to 0)
- **Spatial Resolution**
  - **Description:** The resolution of the spatial data.
  - **Data Type:** Alphanumeric String
  - **Obligation:** Optional
- **Equivalent scale / Source Scale Denominator**
  - **Description:** The equivalent scale or the scale of the original source data.
  - **Data Type:** Ratio (Double) / Integer
  - **Obligation:** Optional
- **Coordinate Unit**
  - **Description:** Unit of measurement for spatial coordinates (e.g., DD, DMS).
  - **Data Type:** CharacterString / Code (may default to "DD")
  - **Obligation:** Mandatory
- **Projection Name**
  - **Description:** The name of the projection used for the dataset.
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Coordinate System / Reference system**
  - **Description:** The reference system for spatial data coordinates (e.g., WGS84, UTM).
  - **Data Type:** CharacterString, Text
  - **Obligation:** Mandatory
  - **Sub-elements (Reference system):** Identifier (Alphanumeric String), Code (Alphanumeric String)
- **Datum**
  - **Description:** Geodetic datum defining the coordinate system.
  - **Data Type:** CharacterString (possibly stored within a structured location information field)
  - **Obligation:** Optional
- **Geographic Location** (Potentially stored in a structured location information field)
  - **Description:** Information about the geographic area covered by the dataset.
  - **Sub-elements:** Country, Region, State, LGA, Town - all CharacterString.
  - **Obligation:** Optional (for the overall structured field)

### 5.3. Temporal Information

- **Date of production of the data / Date Range / Temporal extent**
  - **Description:** The date of production, the period during which data was collected or valid, or the temporal extent.
  - **Production Date Data Type:** Date String, Mandatory
  - **Date From Data Type:** Date String, Mandatory
  - **Date To Data Type:** Date String, Mandatory
- **Citation Dates**
  - **Description:** Important dates related to data or dates related to dataset citation.
  - **Data Type:** Date / Date Range (likely stored in a structured metadata reference field or as separate String/DateTime fields)
  - **Obligation:** Mandatory
- **Available Time Period**
  - **Description:** Availability schedule for dataset or the period during which data is available.
  - **Data Type:** Date / Date Range
  - **Obligation:** Mandatory
- **Maintenance and update frequency / Update Frequency**
  - **Description:** How often the dataset is updated (e.g., Monthly, Quarterly, Annually, As needed).
  - **Data Type:** Text / CodeList (CharacterString)
  - **Obligation:** Mandatory
- **Planned available date time**
  - **Description:** Date and time when the resources will be available.
  - **Data Type:** DateTime or String
  - **Obligation:** Optional
- **Date Info** (Likely part of a structured metadata reference field)
  - **Description:** Reference date and event used to describe it.
  - **Sub-elements:** Reference date (Class/Date Object), Date type (Event used for the reference date - Class/String/Code)
  - **Obligation:** Optional

### 5.4. Contact Information

This information is largely stored in a structured contact information field.

- **Point of contact about the data / Contact Information / Distributor Contact / Process Contact / Metadata Contact**
  - **Description:** Details about the relevant contact person or organization.
  - **Data Type:** Structured Object/Class
  - **Overall Obligation:** Optional for the main contact structure. Specific sub-fields below have their own obligations from external schema requirements if applicable.
  - **Sub-elements:**
    - **Name / Name/Role:** Text (Obligation: Implied Mandatory for a useful contact)
    - **Role:** Text (Obligation: Optional)
    - **Organisation / Organization Name** (Note: A top-level field for the dataset's primary organization also exists)
      - **Description:** The organization of the contact.
      - **Data Type:** Text, CharacterString
      - **Obligation:** Mandatory for the top-level dataset organization field.
    - **Electronic mail address / Email:** Text, CharacterString (Obligation: Mandatory for contact email as per external schema if applicable)
    - **Address (Physical address):** CharacterString / Class (Obligation: Optional)
    - **Phone No. / Phone Number / Phone:** CharacterString / Class (Obligation: Optional)
    - **Weblink:** URL String (Obligation: Optional)
    - **Hours Of Services**: Character String (Obligation: Optional)

### 5.5. Distribution Information

Many specific fields are likely part of a structured distribution details field or covered by general fields.

- **Distribution Information / Data Distribution Information / Distributor Info**
  - **Description:** Information about distribution or how resources may be obtained.
  - **Data Type:** Text, Aggregated Class (Likely covered by specific fields like distribution format, access method, download URL, API endpoint and a structured distribution details blob)
- **Distributor Name**
  - **Description:** Name of the distributing entity.
  - **Data Type:** CharacterString (Likely part of structured distribution details)
  - **Obligation:** Mandatory (as per external schema if applicable)
- **Distributor / Distributor Contact / Distributor Contract**
  - **Description:** Party from which the resources may be obtained.
  - **Data Type:** Alphanumeric String, Class (Likely part of structured contact info or distribution details)
  - **Obligation:** Optional
- **Resource Description**
  - **Description:** A textual description of the dataset resource (can be similar to abstract).
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory (as per external schema if applicable)
- **Distribution Liability**
  - **Description:** Legal statement on distribution conditions or disclaimer.
  - **Data Type:** CharacterString (Likely part of structured distribution details or usage terms)
  - **Obligation:** Optional
- **Custom Order Process**
  - **Description:** Instructions for custom ordering of data.
  - **Data Type:** CharacterString (Likely part of structured distribution details)
  - **Obligation:** Optional
- **Technical Prerequisites**
  - **Description:** Requirements for accessing/using the data.
  - **Data Type:** CharacterString (Likely part of structured distribution details or access restrictions)
  - **Obligation:** Optional
- **Standard Order Process / MD_Standard Process**
  - **Description:** Common ways resources may be obtained, related instructions, and fee information.
  - **Data Type:** Aggregated Class (Likely part of structured distribution details)
  - **Obligation:** Optional
- **Ordering Instructions**
  - **Description:** Detailed steps for obtaining the data or general terms by the distributor.
  - **Data Type:** CharacterString (Likely part of structured distribution details)
  - **Obligation:** Mandatory (as per external schema if applicable)
- **Fees**
  - **Description:** Costs associated with data access or obtaining resources.
  - **Data Type:** CharacterString (Likely part of structured distribution details)
  - **Obligation:** Optional
- **Turnaround Time**
  - **Description:** Expected time to fulfill an order.
  - **Data Type:** CharacterString (Likely part of structured distribution details)
  - **Obligation:** Optional
- **Form Type / Distribution Format**
  - **Description:** Format type (Digital/Non-Digital) or computer language structure of the data.
  - **Data Type:** CodeList, CharacterString, Aggregated Class
  - **Obligation:** Mandatory
  - **Sub-elements (Distribution Format from external schema):** Name Format Name (Character string), Version Format Version (Character string)
- **Distributor Transfer Options**
  - **Description:** Information about the technical means of transfer.
  - **Data Type:** Association (Likely related to access method, download URL, API endpoint)
  - **Obligation:** Optional
- **Access Method**
  - **Description:** Method to access the data (e.g., Download, API).
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Download URL**
  - **Description:** Direct download URL for the data.
  - **Data Type:** URL String
  - **Obligation:** Optional
- **API Endpoint**
  - **Description:** API endpoint to access the data.
  - **Data Type:** URL String
  - **Obligation:** Optional
- **License Type**
  - **Description:** Type of license governing the data usage.
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **Usage Terms**
  - **Description:** Terms and conditions for using the data.
  - **Data Type:** Text (CharacterString)
  - **Obligation:** Mandatory
- **Attribution Requirements**
  - **Description:** Requirements for attributing the data source.
  - **Data Type:** Text (CharacterString)
  - **Obligation:** Mandatory
- **Access Restrictions**
  - **Description:** Any restrictions on accessing the data.
  - **Data Type:** Array of CharacterString
  - **Obligation:** Optional (may default to empty)
- **File Format**
  - **Description:** Specific file format of the data (e.g., GeoTIFF, Shapefile, CSV, GeoJSON).
  - **Data Type:** CharacterString
  - **Obligation:** Mandatory
- **File Size**
  - **Description:** Size of the data file.
  - **Data Type:** Number (BigInt or similar)
  - **Obligation:** Optional
- **Number of Features**
  - **Description:** Number of features in a vector dataset.
  - **Data Type:** Integer
  - **Obligation:** Optional

### 5.6. Data Quality Information

Many specific fields are likely part of structured quality information fields.

- **Logical Consistency Report**
  - **Description:** Assessment or report on the logical consistency of the data.
  - **Data Type:** CharacterString (Likely part of structured data quality info)
  - **Obligation:** Optional
- **Completeness Report**
  - **Description:** Description of data completeness.
  - **Data Type:** CharacterString (Likely part of structured data quality info)
  - **Obligation:** Optional
- **Cloud Cover**
  - **Description:** Percentage of cloud cover affecting image data.
  - **Data Type:** Real, Integer (Likely Number within structured data quality info)
  - **Obligation:** Optional
- **Attribute Accuracy Report**
  - **Description:** Evaluation or assessment of attribute accuracy.
  - **Data Type:** CharacterString (Likely part of structured data quality info)
  - **Obligation:** Optional
- **Positional Accuracy**
  - **Description:** Measures for spatial accuracy.
  - **Data Type:** Class / Structured Object (Likely part of structured quality info)
  - **Obligation:** Optional (for parent, sub-fields are optional)
  - **Related fields:** Horizontal Accuracy (CharacterString, Optional), Vertical Accuracy (CharacterString, Optional)
- **Type of Source Media**
  - **Description:** Format of the original data source or medium.
  - **Data Type:** CharacterString (Likely part of structured data processing info)
  - **Obligation:** Optional

### 5.7. Source and Lineage Information

Many specific fields are likely part of a structured data processing information field.

- **Source Citation / Citation Title**
  - **Description:** Reference to source materials or the title of the citation.
  - **Data Type:** CharacterString (Likely part of structured data processing info)
  - **Obligation:** Mandatory (Citation Title as per external schema if applicable)
- **Source Citation Abbreviation**
  - **Description:** Abbreviated reference to source materials.
  - **Data Type:** CharacterString
  - **Obligation:** Optional
- **Source Contribution**
  - **Description:** Contribution of the source to the dataset.
  - **Data Type:** CharacterString (Likely part of structured data processing info)
  - **Obligation:** Optional
- **Contract/Grant Reference**
  - **Description:** Identifier for funding support or reference to contract/grant.
  - **Data Type:** CharacterString (Likely part of structured data processing info)
  - **Obligation:** Optional
- **Resource lineage Statement**
  - **Description:** Statement describing the data lineage.
  - **Data Type:** Text (Likely part of structured data processing info)
  - **Obligation:** Optional
- **Hierarchy level**
  - **Description:** Hierarchy level of the resource lineage.
  - **Data Type:** Number (Likely Integer within structured data processing info)
  - **Obligation:** Mandatory (as per external schema if applicable)
- **Process Steps** (Likely part of structured data processing info)
  - **Description:** Information about data processing steps.
  - **Sub-elements:**
    - Process Description: CharacterString, Mandatory
    - Process Software Version: CharacterString, Optional
    - Process Date: Date, Mandatory
    - Process Test: CharacterString, Optional
    - Process Contact: CharacterString (Contact Info reference), Mandatory

### 5.8. Metadata Administration

Many specific fields are likely part of a structured metadata reference information field.

- **Metadata Contact / Contact Information** (Similar to Section 5.4, but specifically for metadata admin)
  - **Description:** Contact details of metadata creator or maintainer.
  - **Data Type:** Alphanumeric String, Class (A general contact info structure or a specific metadata reference structure could hold this)
  - **Sub-elements:** Role, Organisation, Electronic mail address.
- **Metadata Date**
  - **Description:** The date when metadata was last updated (an internal `updatedAt` timestamp serves a similar role for the record).
  - **Data Type:** Date (Internal system maintains an `updatedAt` DateTime)
  - **Obligation:** (Internal `updatedAt` is auto-managed)
- **Metadata Review Date**
  - **Description:** The date for the next scheduled review of metadata.
  - **Data Type:** Date (Likely DateTime or String within a structured metadata reference field)
  - **Obligation:** Optional
- **Metadata linkage**
  - **Description:** Linkage to other metadata records.
  - **Data Type:** Alphanumeric String / URL (Likely String within a structured metadata reference field)
  - **Obligation:** Optional
- **Metadata standard**
  - **Description:** Standard used for the metadata (e.g., ISO 19115).
  - **Data Type:** Alphanumeric String (Likely String within a structured metadata reference field)
  - **Obligation:** Optional

### 5.9. System Specific / Other Internal Fields

These fields are primarily for internal record management and relations.

- **Database Record ID**
  - **Description:** Unique identifier for the metadata database entry.
  - **Data Type:** UUID String (or similar unique identifier)
  - **Obligation:** Mandatory (Auto-generated)
- **User ID (Creator/Owner)**
  - **Description:** Reference to the internal User ID who created/owns this metadata entry.
  - **Data Type:** String (Foreign Key to User ID)
  - **Obligation:** Mandatory
- **Organization (Primary)**
  - **Description:** Primary organization associated with the dataset. This is often a denormalized string field for quick filtering/display, distinct from detailed contact organizations.
  - **Data Type:** String
  - **Obligation:** Mandatory
- **Creation Timestamp**
  - **Description:** Timestamp of when the metadata entry was created in the database.
  - **Data Type:** DateTime
  - **Obligation:** Mandatory (Auto-generated)
- **Last Update Timestamp**
  - **Description:** Timestamp of when the metadata entry was last updated in the database.
  - **Data Type:** DateTime
  - **Obligation:** Mandatory (Auto-managed by system)
- **Legacy Fields**
  - **Description:** For backward compatibility, stores fields from a previous or external metadata model.
  - **Data Type:** JSON or similar flexible structure
  - **Obligation:** Optional
- **Fundamental Datasets**
  - **Description:** A structured field (e.g., JSON) intended to store information if this metadata record describes or relates to one or more "fundamental datasets." The exact structure within this field would be defined by NGDI or relevant standards for fundamental datasets. This could include identifiers, names, themes, or links to other fundamental dataset records.
  - **Data Type:** JSON or similar flexible structure
  - **Obligation:** Optional

This consolidated schema aims to provide a comprehensive view for metadata management within the NGDI portal.

## 6. Security - Role-Based Access Control (RBAC)

The system employs RBAC to manage user permissions, ensuring that users can only perform actions and access data appropriate to their roles and affiliations.

### 6.1. User Roles (Base Roles)

The system supports several base user roles, drawing concepts from foundational role definitions. These provide a primary level of access control:

- **Public User (Anonymous):**

  - **Description:** Any visitor to the portal who has not logged in.
  - **Permissions:**
    - Search and discover publicly available metadata.
    - View full details of publicly available metadata records.
    - Access general content pages (About, Contact, Documentation, etc.).

- **Registered User (Authenticated Basic User):**

  - **Display Name:** "Registered User"
  - **Description:** Users who have created an account and are logged in. This role provides basic authenticated access.
  - **Permissions:**
    - All permissions of a Public User.
    - Search and discover metadata.
    - View full details of metadata records they are permitted to see (public or organization-specific, if applicable, based on other potential roles).
    - Manage their own user profile (e.g., update contact information, change password).
    - (Future) Save searches, set preferences, or receive notifications.
  - **Note:** This role explicitly _does not_ have permissions to create, update, or delete metadata records. Such actions require more specialized roles (e.g., Metadata Creator, Node Officer).

- **Node Officer:**

  - **Display Name:** "Node Officer"
  - **Description:** Users responsible for managing metadata for their specific node/organization.
  - **Permissions (generally within their organizational context, as defined by the system's permission model):**
    - All permissions of a Registered User.
    - Create metadata for their organization.
    - Read, Update, and Delete metadata records belonging to their organization.
    - Manage user access (for `MetadataCreator`, `MetadataApprover` roles) within their organization (see Section 4.1).
    - View analytics and reports relevant to their organization's metadata.

- **System Administrator:**
  - **Display Name:** "System Administrator"
  - **Description:** Users with full access to all system functionalities and data.
  - **Permissions (as defined by the system's permission model):**
    - Create, Read, Update, and Delete any metadata record.
    - Create, Read, Update, and Delete any user account.
    - Manage all roles and permissions across the system.
    - Access and manage system-wide settings and configurations.
    - View comprehensive system-wide analytics and audit logs.
    - Perform all actions available to Node Officers and other roles.

### 6.2. Granular Permissions (Database Driven Conceptual Model)

The system's design includes support for a more granular, database-driven permission system, which can extend or override the base role permissions. This involves conceptual entities such as:

- **Permission Entity:**

  - Attributes: Unique name (e.g., "metadata:create", "user:delete"), description, action (e.g., "create", "read", "update", "delete", "manage"), subject (e.g., "metadata", "user", "settings", "organization"), conditions (for conditional logic, e.g., ownership, specific attributes).

- **Custom Role Entity:**

  - Attributes: Unique name, description, system flag (if it's a non-deletable system role).
  - Linked to users and role-permission associations.

- **Role-Permission Association:**

  - Links Custom Roles to Permissions, assigning specific permissions to custom roles.

- **User-Permission Association:**

  - Links Users directly to Permissions, allowing for overriding or granting specific permissions to individual users.
  - Attributes: Granted status (Boolean), expiration date (for temporary permissions).

- **Permission Grouping Entities:**
  - Allow grouping of permissions for easier management and assignment.

**RBAC Logic (Conceptual):**
A core permission-checking function is central to verifying user capabilities.

- Administrators generally have all permissions.
- The system checks if a user's assigned role (or roles) has the specified permission.
- Resource-based checks are included:
  - Users can typically access/modify their own resources (e.g., based on resource ownership).
  - Node Officers have broader access to resources within their own organization (e.g., based on organizational affiliation).

This dual system (base roles and granular permissions) allows for both simplicity for common cases and flexibility for specific needs. The granular system is intended for more advanced configurations or future enhancements.

### 6.3. Metadata Validation and Approval Workflow

A robust and structured workflow is essential to ensure the quality, consistency, and accuracy of metadata before it is published on the NGDI Portal. This workflow involves multiple stages, roles, and types of validation, operating primarily within the context of an organization contributing metadata, with oversight capabilities for System Administrators.

**Roles in the Workflow:**

- **Metadata Creator:** An individual (e.g., Node Officer, or a delegate within an organization) responsible for inputting, editing, and submitting metadata records.
- **Metadata Approver/Reviewer:** A designated individual or group within an organization responsible for reviewing submitted metadata against defined quality criteria and making an approval or rejection decision. This role requires subject matter expertise and understanding of metadata standards.
- **System (Automated Validation Tools):** Integrated tools that perform initial checks for schema compliance, structural integrity, and other predefined rules.
- **System Administrator:** Has oversight of the entire workflow, can manage configurations, and may intervene in exceptional cases.

**Workflow Stages:**

1.  **Creation & Submission:**

    - The `MetadataCreator` populates or updates a metadata record using the portal's interface.
    - The initial status of the record is typically "Draft" or "In Progress."
    - Upon completion, the `MetadataCreator` submits the record for approval. The status changes to "Pending Validation" or "Submitted for Review."

2.  **Automated Validation:**

    - Upon submission, the system automatically performs a series of validation checks:
      - **Schema Compliance:** Ensures the metadata record conforms to the defined metadata schema (e.g., correct fields, data types, mandatory elements).
      - **Structural Integrity:** Checks for well-formedness (e.g., valid XML/JSON if applicable).
      - **Link Validity:** Verifies that any URLs provided (e.g., for data access, documentation) are active and reachable.
      - **Controlled Vocabulary Adherence:** Checks if terms used in specific fields align with predefined lists or taxonomies.
    - Results of automated validation are logged. Minor, auto-correctable issues might be fixed, while significant errors may prevent progression to manual review, returning the record to the `MetadataCreator` with error reports.

3.  **Manual Review & Validation:**

    - If automated validation passes (or issues are flagged for manual attention), the metadata record moves to a queue for the designated `MetadataApprover(s)` within the organization.
    - The `MetadataApprover` conducts a comprehensive review focusing on:
      - **Content Accuracy:** Verifying that the metadata accurately and truthfully describes the geospatial dataset.
      - **Completeness:** Ensuring all relevant mandatory and important optional fields are filled with meaningful information.
      - **Clarity & Understandability:** Assessing if the abstract, purpose, and other descriptive fields are clear, concise, and understandable to the target audience.
      - **Consistency:** Checking for consistency with other metadata records from the organization and adherence to organizational guidelines.
      - **Fitness for Use:** Evaluating if the metadata provides sufficient information for a user to determine if the data is suitable for their needs.
      - **Compliance:** Ensuring adherence to any specific NGDI policies, data governance rules, or legal requirements (e.g., licensing, usage constraints).
    - Reviewers should use checklists and guidelines to ensure a consistent review process.

4.  **Decision & Feedback:**

    - Based on the review, the `MetadataApprover` makes one of the following decisions:
      - **Approve:** If the metadata meets all quality criteria.
        - The metadata status changes to "Approved" (and subsequently "Published," or directly to "Published" based on system configuration).
        - Approved metadata becomes discoverable through the portal as per its visibility settings.
      - **Reject (Return for Revision):** If the metadata fails to meet quality criteria.
        - The metadata status changes to "Needs Revision" or "Rejected."
        - The `MetadataApprover` _must_ provide specific, constructive feedback detailing the reasons for rejection and the required corrections. This feedback is crucial for the `MetadataCreator` to understand and address the issues.
      - **Escalate (Optional):** In complex cases or disputes, there might be a mechanism to escalate the review to another authority or a committee.

5.  **Revision (if Rejected):**

    - The `MetadataCreator` is notified of the rejection and receives the feedback.
    - They revise the metadata record to address the identified issues.
    - The `MetadataCreator` resubmits the revised metadata, and the workflow returns to Stage 2 (Automated Validation) or Stage 3 (Manual Review) as appropriate.

6.  **Publication:**
    - Once "Approved," the metadata record is published according to the portal's policies. This may be immediate or involve a final publishing step by a Node Officer or Administrator.

**Key Supporting Mechanisms:**

- **Notifications:** Automated notifications are sent to relevant users at each stage transition (e.g., submission confirmation, review assignment, approval/rejection notice).
- **Audit Trail:** All actions performed on a metadata record (creation, submission, validation checks, reviews, approvals, rejections, revisions, publication) are logged with user details, timestamps, and any associated comments or feedback. This provides a complete history for accountability and troubleshooting.
- **Status Tracking:** The portal provides a clear way for users to track the status of their submitted metadata records.
- **Reporting & Analytics:** The system may provide reports on metadata workflow performance, such as time taken for review, rejection rates, and common issues, to help identify bottlenecks and areas for improvement.

**Continuous Improvement:**

- The metadata validation and approval workflow itself should be periodically reviewed and refined based on feedback from users, analysis of workflow metrics, and evolving metadata standards or portal requirements.
- Training and documentation for `MetadataCreators` and `MetadataApprovers` should be regularly updated.

## 7. Non-Functional Requirements

- **Performance:**
  - Page load times should be within acceptable limits (e.g., < 3 seconds for key pages).
  - Search and filtering operations should be responsive, even with a large number of metadata records.
  - Database queries should be optimized (e.g., through appropriate indexing).
- **Scalability:** The system should be able to handle a growing number of users, metadata records, and data requests.
- **Usability & Accessibility:**
  - Intuitive navigation and user interface.
  - Compliance with web accessibility standards (e.g., WCAG).
  - Responsive design for various screen sizes (desktop, tablet, mobile).
- **Reliability & Availability:** The portal should be highly available with minimal downtime. Implement robust error handling.
- **Maintainability:** Code should be well-structured, documented, and follow best practices to facilitate easy maintenance and updates. General good practices like using a monorepo structure, TypeScript, linters, and code formatters are beneficial.
- **Security:**
  - Protection against common web vulnerabilities (XSS, CSRF, SQL Injection).
  - Secure handling of sensitive data (user credentials, PII).
  - Regular security audits and updates.
  - HTTPS for all communications.
  - Consideration for API rate limiting, configurable via system settings.

## 8. Technical Considerations

- **Framework:** Next.js (App Router) for both frontend and backend API routes. Chosen for its robust features, performance optimizations, and seamless deployment on Vercel.
- **Database and Authentication:** Supabase, utilizing its managed PostgreSQL database and built-in authentication services (specifically email/password; no social logins).
- **UI Components:** Shadcn UI, built on Radix UI and Tailwind CSS, for a collection of accessible and customizable components.
- **Styling:** Tailwind CSS for utility-first CSS styling, integrated with Shadcn UI.
- **Language:** TypeScript for static typing across the entire codebase, enhancing code quality and maintainability.
- **Mapping/Geospatial Libraries:**
  - Consider Leaflet or MapLibre GL JS for interactive map components.
  - Potentially Deck.gl for advanced 2D/3D geospatial visualizations if required.
- **State Management:**
  - React Query (TanStack Query) for server state management, caching, and synchronization with Supabase data.
  - Zustand or Jotai for lightweight client-side global state management, as an alternative to React Context for more complex scenarios.
- **Form Handling & Validation:**
  - React Hook Form for performant and flexible form building.
  - Zod for schema declaration and validation, consistent with its use in other parts of the project (e.g., API validation).
- **Utility Libraries:**
  - `clsx` and `tailwind-merge` for conditionally joining class names, especially useful with Tailwind CSS and Shadcn UI.
  - `date-fns` or `dayjs` for robust date and time manipulation.
- **Deployment:** Vercel, leveraging its tight integration with Next.js for CI/CD, serverless functions, and global CDN.
- **Testing:**
  - Playwright for end-to-end (E2E) testing.
  - Vitest or Jest with React Testing Library for unit and integration testing of components and utilities.

## 9. Future Considerations / Potential Enhancements

- Advanced geospatial data processing and analysis tools.
- Integration with external data sources and services.
- Enhanced collaboration features (e.g., data sharing workflows, commenting).
- Machine learning-powered metadata enrichment and recommendations.
- Support for multiple languages (internationalization).
- Public API for programmatic access to metadata.
- Data subscription and notification services.
- Automated metadata harvesting from other catalogs.
- **AI-Powered Metadata Enhancement:** (Priority: Medium)
- **Advanced Geospatial Analytics Tools:** (Priority: Low-Medium)
- **Integration with National Data Portals:** (Priority: High)
- **Mobile Application:** (Priority: Low)
- **User-Generated Content (e.g., data stories, map annotations):** (Priority: Low-Medium)
- **Multilingual Support:** (Priority: Medium, depending on national requirements)
- **Enhanced API Quota Management and Monetization Options (if applicable):** (Priority: Low)
- **Full support for OGC API suite (Features, Records, Maps, Tiles, etc.):** (Priority: Medium-High, as a roadmap from initial OGC service support)
- **Decentralized Data Storage/Access (e.g., IPFS, Solid):** (Priority: Low - Research)
- **Digital Twin Integration Capabilities:** (Priority: Low - Research)
