# Workflow Diagrams

This document serves as a central reference for workflow diagrams created for the NGDI Portal. These diagrams are crucial for understanding complex processes involving multiple user roles, system actions, and status changes.

## Tools for Workflow Diagramming

Recommended tools include:

- Lucidchart
- diagrams.net (draw.io)
- Miro
- Visio
- BPMN modeling tools

## Key Workflows for Diagramming

### 1. User Registration & Initial Role Assignment

- **Description:** Flow from user signup (via Clerk) to initial role assignment (e.g., default `Registered User`) and potential paths for role escalation or assignment by an Admin.
- _Diagram/Link:_ [Placeholder for description or link to diagram]

### 2. Organization Creation & Node Officer Assignment (Admin Workflow)

- **Description:** Steps for a System Administrator to create a new organization and assign one or more Node Officers to it.
- _Diagram/Link:_ [Placeholder for description or link to diagram]

### 3. Metadata Creation & Submission Workflow (Creator & System)

- **Actors:** Metadata Creator, System
- **Description:** Process starting from a Metadata Creator initiating a new metadata record, saving drafts, filling required fields, and submitting it for approval.
- _Diagram/Link:_ [Placeholder for description or link to diagram]

### 4. Metadata Validation & Approval/Rejection Workflow (Approver, Creator & System)

- **Actors:** Metadata Approver, Metadata Creator, System
- **Description:** The core workflow. This covers:
  - Notification to relevant Metadata Approver(s) upon submission.
  - Automated validation checks (initial pass).
  - Manual review by Metadata Approver.
  - Decision points: Approve, Reject (with comments), or Request Revision.
  - Notifications back to Metadata Creator.
  - Status changes of the metadata record.
- _Diagram/Link:_ [Placeholder for description or link to diagram]

### 5. Metadata Publication Workflow (System & Admin/Approver)

- **Actors:** System, Metadata Approver, System Administrator
- **Description:** Steps after a metadata record is approved, leading to its publication and becoming discoverable in the main portal search.
- _Diagram/Link:_ [Placeholder for description or link to diagram]

### 6. User Role Management Workflow (Admin & Node Officer)

- **Actors:** System Administrator, Node Officer
- **Description:** How System Admins manage global roles and assign Node Officers. How Node Officers manage organization-specific roles like Metadata Creator and Metadata Approver within their assigned organization(s).
- _Diagram/Link:_ [Placeholder for description or link to diagram]

---

_This document should be updated with links to the actual workflow diagrams or embedded images/descriptions as they are created._
