# Security and Permissions Matrix

This document outlines the Role-Based Access Control (RBAC) matrix for the NGDI Portal. It defines what actions each user role can perform on various resources or features within the system.

## User Roles

- **RU:** Registered User (Authenticated, default role)
- **MC:** Metadata Creator (Can create and manage their metadata within their org)
- **MA:** Metadata Approver (Can review and approve/reject metadata within their org)
- **NO:** Node Officer (Manages an organization, its users, and metadata workflow)
- **SA:** System Administrator (Full control over the system)
- **Public:** Unauthenticated User

## Permissions Matrix

_Permissions can be denoted as: `C` (Create), `R` (Read), `U` (Update), `D` (Delete), `L` (List), `A` (Approve), `S` (Submit), `X` (Execute/Perform Action), `-` (No Access)_

_Context (e.g., "Own", "Org", "All") is crucial and should be specified where applicable._

### I. User Authentication & Profile

| Feature/Action          | Public | RU  | MC  | MA  | NO  | SA  |
| ----------------------- | ------ | --- | --- | --- | --- | --- |
| Register (Sign Up)      | C      | -   | -   | -   | -   | -   |
| Login                   | X      | -   | -   | -   | -   | -   |
| Logout                  | -      | X   | X   | X   | X   | X   |
| View Own Profile        | -      | R   | R   | R   | R   | R   |
| Edit Own Profile        | -      | U   | U   | U   | U   | U   |
| View Any User Profile   | -      | -   | -   | -   | R   | R   |
| Edit Any User Profile   | -      | -   | -   | -   | -   | U   |
| Change Own Password     | -      | U   | U   | U   | U   | U   |
| Reset Password (Forgot) | X      | -   | -   | -   | -   | -   |

### II. Organization Management

| Feature/Action                                        | Public | RU  | MC  | MA  | NO (Own Org) | SA (All Orgs) |
| ----------------------------------------------------- | ------ | --- | --- | --- | ------------ | ------------- |
| List Organizations (Public Info)                      | L      | L   | L   | L   | L            | L             |
| View Organization Details (Public)                    | R      | R   | R   | R   | R            | R             |
| Create Organization                                   | -      | -   | -   | -   | -            | C             |
| Edit Organization Details                             | -      | -   | -   | -   | U            | U             |
| Delete Organization                                   | -      | -   | -   | -   | -            | D             |
| View Own Organization Users                           | -      | -   | -   | -   | L            | L (Any Org)   |
| Add User to Own Organization                          | -      | -   | -   | -   | C            | C (Any Org)   |
| Remove User from Own Organization                     | -      | -   | -   | -   | D            | D (Any Org)   |
| Assign/Revoke Org-Specific Roles (MC, MA for Own Org) | -      | -   | -   | -   | U            | U (Any Org)   |

### III. Metadata Record Management

| Feature/Action                       | Public | RU  | MC (Own/Org) | MA (Own/Org)        | NO (Own/Org)             | SA (All)                 |
| ------------------------------------ | ------ | --- | ------------ | ------------------- | ------------------------ | ------------------------ |
| List Published Metadata              | L      | L   | L            | L                   | L                        | L                        |
| View Published Metadata Details      | R      | R   | R            | R                   | R                        | R                        |
| Create Metadata Draft                | -      | -   | C            | C (Can view draft)  | C (Can view draft)       | C                        |
| View Own/Org Metadata (All Statuses) | -      | -   | R            | R                   | R                        | R                        |
| Edit Own/Org Metadata Draft          | -      | -   | U            | U (If assigned)     | U                        | U                        |
| Delete Own/Org Metadata Draft        | -      | -   | D            | D (If assigned)     | D                        | D                        |
| Submit Metadata for Approval         | -      | -   | S            | S (If also creator) | S (If also creator)      | S                        |
| View Metadata Pending Approval (Org) | -      | -   | R (Own)      | R                   | R                        | R (All)                  |
| Approve Metadata (Org)               | -      | -   | -            | A                   | A                        | A (All)                  |
| Reject Metadata (Org)                | -      | -   | -            | X                   | X                        | X (All)                  |
| Publish Approved Metadata            | -      | -   | -            | -                   | S (Or auto by SA)        | S                        |
| Edit Published Metadata (Re-version) | -      | -   | -            | -                   | U (Triggers re-approval) | U (Triggers re-approval) |
| Archive/Unarchive Metadata           | -      | -   | -            | -                   | X                        | X                        |

### IV. System Administration & Configuration

| Feature/Action                         | Public | RU  | MC  | MA  | NO  | SA  |
| -------------------------------------- | ------ | --- | --- | --- | --- | --- |
| Access Admin Dashboard                 | -      | -   | -   | -   | -   | X   |
| Manage System-Wide User Roles (SA, NO) | -      | -   | -   | -   | -   | U   |
| View System Audit Logs                 | -      | -   | -   | -   | -   | R   |
| Manage System Settings                 | -      | -   | -   | -   | -   | U   |
| View Platform Analytics                | -      | -   | -   | -   | -   | R   |

### V. Node Officer Dashboard

| Feature/Action                     | Public | RU  | MC  | MA  | NO (Own Org) | SA                       |
| ---------------------------------- | ------ | --- | --- | --- | ------------ | ------------------------ |
| Access Node Officer Dashboard      | -      | -   | -   | -   | X            | R (Can view any NO dash) |
| View Org-Specific Metadata Summary | -      | -   | -   | -   | R            | R                        |
| Manage Org Users (MC, MA roles)    | -      | -   | -   | -   | U            | -                        |

---

_This matrix is an initial draft and will be refined as development progresses and more granular permissions are identified. It should be used as a guide for implementing RBAC logic in middleware, server actions, and UI components._
