# NGDI Portal Development Roadmap & Tracking

## 1. Overview

This document outlines the development roadmap for building the NGDI (National Geospatial Data Infrastructure) Portal, based on the NGDI Portal Product Requirements Document (PRD) and utilizing the existing Next.js application template. It also suggests a method for tracking implementation progress.

**Project Goal:** To develop a comprehensive web-based platform for the discovery, access, management, and visualization of geospatial metadata and data.

**Foundation:** Existing Next.js App Template (Next.js, Tailwind, Shadcn, Drizzle ORM, Clerk, Stripe, PostHog).

## 2. Development Phases

The development is broken down into the following phases. Each phase has specific objectives, key PRD sections it addresses, and high-level tasks.

---

### Phase 1: Core Setup, Enhanced User Roles & Organization Management

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Establish foundational user roles, a granular permissions structure, and organization management capabilities, extending the template's current authentication.
- **Key PRD Sections:** 4.1 (User Auth), 4.5 (Admin - User & Org Management), 6 (RBAC).
- **Estimated Effort:** Medium
- **Key Deliverables:**
  - Defined user roles (`Registered User`, `Node Officer`, `Metadata Creator`, `Metadata Approver`, `System Administrator`) integrated with Clerk and database.
  - Database schemas for roles, permissions, organizations, and their relationships.
  - Basic Admin UI for managing organizations and assigning Node Officers.
  - Initial RBAC helper functions.
- **Tracking Checklist:**
  - `[ ]` Define custom roles in Clerk/Database
    - `[ ]` UserRoles schema
    - `[ ]` Roles schema
    - `[ ]` Permissions schema
    - `[ ]` RolePermissions schema
  - `[ ]` Organization Schema & Management
    - `[ ]` Organizations schema
    - `[ ]` CRUD actions for organizations
    - `[ ]` Admin UI for organization management
  - `[ ]` Extend User Profile for organization affiliation
  - `[ ]` Basic RBAC implementation (helper functions)
  - `[ ]` Initial Admin Area Setup (`/app/(admin)/dashboard`)
    - `[ ]` User listing & role assignment UI

---

### Phase 2: Metadata Schema, Basic CRUD & "My Metadata"

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Implement the core metadata data model and provide functionality for authorized users to create, view, edit, and manage their own metadata records.
- **Key PRD Sections:** 4.2 (Metadata Management - Create, View, Edit, Delete, Drafts, My Metadata), 5 (Data Model).
- **Estimated Effort:** Large
- **Key Deliverables:**
  - Comprehensive Drizzle schemas for metadata records and related information.
  - Server actions for metadata CRUD operations.
  - A multi-step metadata creation/editing form with draft functionality.
  - "My Metadata" page for users.
  - Metadata view page.
- **Tracking Checklist:**
  - `[ ]` Define Metadata Drizzle Schemas
    - `[ ]` `metadataRecords` core table
    - `[ ]` Related tables/JSON for spatial, temporal, contact, distribution, quality, lineage info
    - `[ ]` Status and validation fields
  - `[ ]` Server Actions for Metadata CRUD
    - `[ ]` `createMetadataRecordAction`
    - `[ ]` `getMetadataRecordByIdAction`
    - `[ ]` `updateMetadataRecordAction`
    - `[ ]` `deleteMetadataRecordAction`
    - `[ ]` `getMetadataRecordsByUserAction`
    - `[ ]` `getMetadataRecordsByOrganizationAction`
  - `[ ]` Metadata Creation/Edit Form
    - `[ ]` Route setup
    - `[ ]` Form implementation (react-hook-form, zod)
    - `[ ]` Multi-step/section layout
    - `[ ]` "Save as Draft" functionality
  - `[ ]` "My Metadata" Page
    - `[ ]` Route and UI
    - `[ ]` Data fetching and display
  - `[ ]` Metadata View Page
    - `[ ]` Route and UI
    - `[ ]` Structured display of metadata

---

### Phase 3: Metadata Validation & Approval Workflow

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Implement the workflow for submitting, validating (automated & manual), approving, and publishing metadata.
- **Key PRD Sections:** 4.1.3 (Metadata Creator), 4.1.4 (Metadata Approver), 4.2 (Validation), 6.3 (Workflow).
- **Estimated Effort:** Medium-Large
- **Key Deliverables:**
  - Workflow state management in the metadata schema.
  - Logic for metadata submission by Creators.
  - Placeholder for automated validation.
  - UI and actions for Approvers to review, approve, or reject metadata.
  - Basic notification system for workflow steps.
  - Audit trail for metadata changes.
- **Tracking Checklist:**
  - `[ ]` Workflow State Management in schema
  - `[ ]` Submission Logic for Metadata Creators
  - `[ ]` Automated Validation (Initial Stub/Placeholder)
  - `[ ]` Approval/Rejection UI & Actions (for Metadata Approver)
    - `[ ]` Review queue UI
    - `[ ]` `approveMetadataAction`
    - `[ ]` `rejectMetadataAction` (with feedback mechanism)
  - `[ ]` Notifications (Basic Email/In-App)
  - `[ ]` Metadata Audit Trail
    - `[ ]` `metadataAuditLog` schema
    - `[ ]` Logging in metadata actions

---

### Phase 4: Search & Discovery

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Enable users to find metadata records through keyword, faceted, and basic spatial search.
- **Key PRD Sections:** 4.3 (Search and Discovery).
- **Estimated Effort:** Medium-Large
- **Key Deliverables:**
  - Backend and frontend for keyword search.
  - Backend and frontend for faceted search based on key metadata attributes.
  - Basic spatial search functionality (drawing a bounding box).
  - A consolidated search results page.
- **Tracking Checklist:**
  - `[ ]` Keyword Search
    - `[ ]` Backend server action
    - `[ ]` Frontend input
  - `[ ]` Faceted Search
    - `[ ]` Backend server action with filtering
    - `[ ]` Frontend UI for facet selection
  - `[ ]` Spatial Search (Basic BBox)
    - `[ ]` Map integration for BBox drawing
    - `[ ]` Backend server action for spatial query
  - `[ ]` Search Results Page
    - `[ ]` Route and UI
    - `[ ]` Display results, sorting, pagination
    - `[ ]` Integration of all search inputs

---

### Phase 5: Map Visualization

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Provide an interactive map to visualize geospatial datasets linked from metadata records.
- **Key PRD Sections:** 4.4 (Map Visualization).
- **Estimated Effort:** Medium
- **Key Deliverables:**
  - Reusable map component using Leaflet or MapLibre GL JS.
  - Ability to display data layers from URLs in metadata.
  - Basic map tools (pan, zoom).
- **Tracking Checklist:**
  - `[ ]` Choose and Integrate Mapping Library (Leaflet/MapLibre GL JS)
  - `[ ]` Create Reusable Map Component
  - `[ ]` Display Data Layers from Metadata URLs
    - `[ ]` Logic to extract viewable service URLs
    - `[ ]` Add/remove layer functionality
  - `[ ]` Basic Map Tools (Pan, Zoom)
  - `[ ]` Link Map to Metadata Record

---

### Phase 6: Admin Dashboard - Phase 1

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Build out essential features of the Admin Dashboard for system oversight and management.
- **Key PRD Sections:** 4.5 (Admin Dashboard).
- **Estimated Effort:** Large
- **Key Deliverables:**
  - Admin dashboard overview with key statistics.
  - Comprehensive user management interface (list, search, edit roles, status).
  - Organization management interface (create, edit, assign Node Officers).
  - Basic platform-wide metadata oversight tools.
  - Minimal viable system configuration UI.
- **Tracking Checklist:**
  - `[ ]` Dashboard Overview Page
    - `[ ]` Stats fetching and display
  - `[ ]` User Management UI
    - `[ ]` User listing, searching, filtering
    - `[ ]` Profile editing, role modification
    - `[ ]` Account status actions
  - `[ ]` Organization Management UI
    - `[ ]` Org listing, searching, filtering
    - `[ ]` Create/edit organization
    - `[ ]` Assign Node Officers
  - `[ ]` Platform-Wide Metadata Oversight (Basic)
    - `[ ]` Global metadata listing with admin filters
    - `[ ]` UI for bulk status changes
  - `[ ]` System Configuration (Minimal Viable)
    - `[ ]` `systemSettings` schema
    - `[ ]` Basic UI for key-value settings

---

### Phase 7: Node Officer Dashboard

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Create a dedicated dashboard for Node Officers to manage their organization's metadata and users.
- **Key PRD Sections:** 4.1.2 (Node Officer), 4.7 (Node Officer Dashboard).
- **Estimated Effort:** Medium-Large
- **Key Deliverables:**
  - Node Officer dashboard with organization-specific overview statistics.
  - Interface for managing their organization's metadata.
  - Tools for managing `MetadataCreator` and `MetadataApprover` roles within their organization.
  - Basic reporting for their organization's metadata.
- **Tracking Checklist:**
  - `[ ]` Dashboard Route & Layout for Node Officers
  - `[ ]` Overview Stats (Organization-Specific)
  - `[ ]` Metadata Management UI (Organization-Specific)
  - `[ ]` Organizational User Management (Metadata Creator/Approver roles)
    - `[ ]` UI for assigning/revoking these roles
    - `[ ]` Schema support for org-specific roles
  - `[ ]` Quick Actions & Basic Reporting (CSV export)

---

### Phase 8: Content Pages, Refinements, and Advanced Features (Selection)

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Add static content pages and begin implementing selected advanced features based on priority.
- **Key PRD Sections:** 4.6 (Content Pages), other advanced features.
- **Estimated Effort:** Variable (depends on selected features)
- **Key Deliverables:**
  - Static content pages (About, Contact, Docs, etc.).
  - Implementation of 1-2 selected advanced features from Admin/Node Officer dashboards or search.
- **Tracking Checklist:**
  - `[ ]` Content Pages (About, Docs, Contact, TOS, Privacy)
  - `[ ]` Admin Dashboard - Phase 2 (Select 1-2 features)
    - `[ ]` e.g., Granular Role/Permission UI
    - `[ ]` e.g., Basic System Analytics UI
    - `[ ]` e.g., Audit Trail Viewer
  - `[ ]` Advanced Search Features (Select 1-2 refinements)
  - `[ ]` Further Metadata Workflow Enhancements (Select 1-2)

---

### Phase 9: Testing, Deployment Prep, and Iteration

- **Status:** `[ ] Not Started` / `[ ] In Progress` / `[ ] Completed`
- **Objective:** Ensure application quality, prepare for deployment, and establish processes for ongoing iteration.
- **Key PRD Sections:** 7 (Non-Functional Requirements), 8 (Technical Considerations - Testing).
- **Estimated Effort:** Medium (ongoing for iteration)
- **Key Deliverables:**
  - Testing setup (unit, integration, E2E).
  - A suite of tests covering critical paths.
  - Addressed key non-functional requirements (performance, accessibility, security).
  - Smooth Vercel deployment pipeline.
  - User and technical documentation.
- **Tracking Checklist:**
  - `[ ]` Testing Setup (Vitest/Jest, Playwright)
  - `[ ]` Write Unit & Integration Tests
  - `[ ]` Write E2E Tests
  - `[ ]` Address Non-Functional Requirements
    - `[ ]` Performance review & optimization
    - `[ ]` Accessibility audit & fixes
    - `[ ]` Security review & fixes
  - `[ ]` Deployment Configuration (Vercel)
    - `[ ]` Production environment variables setup
    - `[ ]` Update `.env.example`
  - `[ ]` Documentation
    - `[ ]` User Guides (for each role)
    - `[ ]` Technical Documentation

---

## 3. Tracking Implementation

This roadmap can be tracked using the following methods:

1.  **Markdown Checklists (Basic):**

    - The checklists provided under each phase in this document can be directly updated by changing `[ ]` to `[x]` as tasks are completed.
    - This file (`NGDI_PORTAL_ROADMAP.md`) should be committed to the project repository and updated regularly.
    - **Pros:** Simple, integrated with code, version controlled.
    - **Cons:** Limited collaboration features, no automated progress tracking or reporting.

2.  **GitHub Issues / Project Boards (Recommended for Team Collaboration):**

    - Create GitHub Issues for each major task or sub-task within a phase.
    - Organize these issues using a GitHub Project board (e.g., with columns like "Backlog," "To Do," "In Progress," "Review," "Done").
    - Assign issues to team members and set milestones corresponding to phases.
    - Link PRs to issues to automatically track when work is merged.
    - **Pros:** Excellent for collaboration, version control integration, progress visualization, discussion threads per task.
    - **Cons:** Requires setup and active management.

3.  **Dedicated Project Management Tools (e.g., Jira, Asana, Trello):**
    - For more complex projects or larger teams, these tools offer advanced features like custom workflows, detailed reporting, time tracking, and integrations.
    - **Pros:** Powerful, feature-rich.
    - **Cons:** Can be overkill for smaller projects, may require subscription costs, separate from the codebase.

**Initial Recommendation:** Start with **Markdown Checklists** within this document for simplicity. If the team grows or more detailed tracking is needed, transition to **GitHub Issues and Project Boards**.

## 4. Review and Updates

This roadmap is a living document. It should be reviewed and updated:

- At the end of each phase.
- When significant new requirements arise.
- If priorities change.

Regularly communicate progress and any changes to the roadmap to all stakeholders.
