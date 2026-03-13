# Pylott — Implementation & API Reference (Client Document)

**Version:** 1.0  
**Last updated:** March 2025  
**Audience:** Client / product stakeholders

This document describes the **implemented features** from the product requirements and the **API endpoints** that support them. It is intended for the client to understand what has been delivered, how to integrate with the backend, and what to expect from each endpoint.

---

## Table of contents

1. [Overview](#1-overview)
2. [Base URL & authentication](#2-base-url--authentication)
3. [Standard response format](#3-standard-response-format)
4. [Account & workspace](#4-account--workspace)
5. [Contacts & client lifecycle](#5-contacts--client-lifecycle)
6. [Invites & permissions](#6-invites--permissions)
7. [User management & deactivation](#7-user-management--deactivation)
8. [Projects](#8-projects)
9. [Tasks](#9-tasks)
10. [Defaults on workspace creation](#10-defaults-on-workspace-creation)

---

## 1. Overview

The Pylott backend has been updated to support:

- **Self-serve workspace creation** — New users can create a workspace and become the primary (Super) admin.
- **Strict role entry** — Only the workspace signup flow is self-serve; Admins and Consultants are invited; Clients are created only via **Contacts** and then invited from there.
- **Contact-centric client lifecycle** — Contacts have a status (**Uninvited** → **Invited** → **Active**); sending an invite and completing registration drive status changes.
- **Client invite rights & approval** — Super Admin can grant “invite clients” and “approve client invites” to Admins/Consultants; Consultants’ client invites can require Admin approval.
- **Task model updates** — Optional description, single **due date** (no start date), two statuses (**Pending** / **Completed**), **Inhouse** vs **Client facing** visibility, and an endpoint for “assigned to me” task count for the sidebar.
- **Project creation with contact linking** — Optional client email/phone/name on project create to create or link contacts.
- **Defaults** — Default journey (project type) and default task types are created when a new workspace is created.

All endpoints below are relative to the **API base URL** (e.g. `https://your-api-host/api/v1`).

---

## 2. Base URL & authentication

- **Base path:** `/api/v1`
- **Auth:** Most endpoints (except signup, login, password reset, complete registration, set password, Google OAuth) require an authenticated user. Send the session/token as per your existing integration (e.g. Bearer token in `Authorization` header or session cookie).
- **Role checks:** Described per endpoint where relevant (e.g. Super Admin only, or Admin/Consultant).

---

## 3. Standard response format

- **Success:** `{ "success": true, "message": "<text>", "data": <object or array> }`
- **Error:** `{ "success": false, "message": "<error message>", "data": <optional details> }`
- HTTP status codes: `200` (OK), `201` (Created), `400` (Bad Request), `401` (Unauthorized), `403` (Forbidden), `404` (Not Found), `500` (Internal Server Error).

---

## 4. Account & workspace

### 4.1 Self-serve workspace signup

Any new user can create a workspace and become the **primary admin (Super Admin)**. No approval is required.

**Endpoint:** `POST /api/v1/auth/workspace-signup`

**Request body:**

| Field     | Type   | Required | Description                |
|----------|--------|----------|----------------------------|
| `name`   | string | Yes      | User’s display name        |
| `email`  | string | Yes      | Valid email                |
| `password` | string | Yes    | Min 8 characters           |

**Example request:**

```json
{
  "name": "Jane Admin",
  "email": "jane@example.com",
  "password": "SecurePass123"
}
```

**Success response (e.g. 200):**

```json
{
  "success": true,
  "message": "Workspace created successfully. You are the primary admin.",
  "data": { ... }
}
```

**Error examples:**  
- `400` — Validation error (e.g. invalid email, short password).  
- `409` or similar — Email already in use (exact code as implemented).

---

### 4.2 Login

**Endpoint:** `POST /api/v1/auth/login`

**Request body:**

| Field      | Type   | Required | Description   |
|-----------|--------|----------|---------------|
| `email`   | string | Yes      | User email    |
| `password`| string | Yes      | Min 8 chars   |

**Success response:** Returns session/token and user info as per current implementation.  
**Error:** `401` for invalid credentials; login is blocked for deactivated users or when password setup is required (e.g. after reactivation).

---

### 4.3 Other auth endpoints (reference)

| Purpose | Method | Path | Request body (main fields) |
|--------|--------|------|---------------------------|
| Forgot password | POST | `/api/v1/auth/forgot-password` | `{ "email" }` |
| Reset password (with token from email) | POST | `/api/v1/auth/reset-password` | `{ "token", "newPassword" }` |
| Resend verification email | POST | `/api/v1/auth/resend-verification` | `{ "email" }` |
| Update password (logged-in user) | POST | `/api/v1/auth/update-password` | `{ "userId", "currentPassword", "newPassword" }` |
| Switch organization | POST | `/api/v1/auth/switch-organization` | As implemented |
| Logout | POST | `/api/v1/auth/logout` | — |
| Get company users | GET | `/api/v1/auth/companies/:companyId/users` | — |

Success/error format is the same as in §3.

---

### 4.4 Google OAuth

- **Get Google auth URL:** `GET /api/v1/auth/auth/google` — Returns URL to redirect the user to Google.
- **Callback:** `GET /api/v1/auth/auth/google/callback` — Handles callback from Google.

**Behaviour:** If no account exists for the Google user, the backend returns **403** with a message that the user must sign up for a workspace or request an invite (no new user creation via Google).

---

### 4.5 Complete registration (invited users)

After receiving an invite (Admin, Consultant, or Client), the user completes registration with token and password.

**Endpoint:** `POST /api/v1/auth/complete-registration`

**Request body:**

| Field      | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `token`   | string | Yes      | Invite token       |
| `password`| string | Yes      | New password       |
| `name`    | string | Yes      | User’s name        |

**Success response:** User and company/role info as per current implementation. For **Client** role, the linked contact’s status is set to **Active**.

---

### 4.6 Set password with token

Used after **reactivation** (or any flow that sends a “set password” link). The user must set a new password before they can log in again.

**Endpoint:** `POST /api/v1/auth/set-password`

**Request body:**

| Field         | Type   | Required | Description   |
|--------------|--------|----------|---------------|
| `token`      | string | Yes      | Set-password token from email |
| `newPassword`| string | Yes      | Min 8 characters |

**Success response:** Confirmation that password was set.  
**Error:** `400` for invalid/expired token or validation failure.

---

## 5. Contacts & client lifecycle

Clients are **only** created via the Contacts flow. Contacts have a **status**: `Uninvited` | `Invited` | `Active`.

### 5.1 Add contact

Creates a contact in the workspace. Status is set to **Uninvited**. No invite email is sent.

**Endpoint:** `POST /api/v1/contacts`

**Headers:** Authenticated user (Admin or Consultant; company inferred from user).

**Request body:**

| Field         | Type   | Required | Description                    |
|--------------|--------|----------|--------------------------------|
| `name`       | string | Yes      | Contact name                   |
| `email`      | string | Yes      | Valid email                    |
| `phone`      | string | Yes      | Phone number                   |
| `organization`| string | No      | Optional                       |
| `address`    | string | No       | Optional                       |
| `company_id` | string | No       | Optional; usually from context |
| `assigned_to`| array  | No       | Optional assignees             |

**Success response (e.g. 200/201):**

```json
{
  "success": true,
  "message": "...",
  "data": {
    "id": "<contact-uuid>",
    "name": "...",
    "email": "...",
    "phone": "...",
    "status": "Uninvited",
    ...
  }
}
```

**Error:** `400` if email already exists for the company or validation fails.

---

### 5.2 List contacts

**Endpoint:** `GET /api/v1/contacts`

**Query parameters:** Pagination and search as implemented (e.g. `page`, `limit`, `search`).  
**Optional:** `GET /api/v1/contacts/company/:companyId` for company-scoped list.

**Success response:** List of contacts including `status` and, where implemented, `added_by_user_id` (or equivalent) so Admins/Super Admin can see who added each contact.

---

### 5.3 Get contact by ID

**Endpoint:** `GET /api/v1/contacts/:id`

**Success response:** Single contact object including `status`.

---

### 5.4 Update contact

**Endpoint:** `PUT /api/v1/contacts/:id`

**Request body:** Same fields as add (all optional for update).  
**Success response:** Updated contact.  
**Error:** `400` for validation; `404` if contact not found.

---

### 5.5 Send invite to contact (client invite)

Manually send an invite to a contact. Allowed only if the contact’s status is **Uninvited** and the user has **client invite** rights (or is Super Admin). If the inviter is a **Consultant**, the system may create a **pending client invite request** that an Admin must approve before the invite is sent.

**Endpoint:** `POST /api/v1/auth/contacts/:contactId/send-invite`

**Path parameters:**

| Name        | Type   | Description   |
|------------|--------|---------------|
| `contactId`| string | Contact UUID  |

**Headers:** Authenticated user (Admin or Consultant with client-invite right).

**Request body:** None.

**Success response:**

```json
{
  "success": true,
  "message": "Invite sent successfully",
  "data": { ... }
}
```

If the invite requires approval (Consultant flow):

- Response may indicate that the request is **pending approval**.
- Contact remains **Uninvited** until an Admin approves (see [6.4](#64-approve-client-invite-request) and [6.5](#65-reject-client-invite-request)).

**Error:**

- `400` — Contact not in Uninvited status or missing contact ID.
- `403` — User does not have permission to invite clients.
- `404` — Contact not found or not in this company.

---

## 6. Invites & permissions

### 6.1 Invite Admin (Super Admin only)

**Endpoint:** `POST /api/v1/auth/invite-admin`

**Request body:**

| Field  | Type   | Required | Description   |
|--------|--------|----------|---------------|
| `email`| string | Yes      | Admin’s email |

**Success response:** Invite sent; invited user receives email and completes registration with token/password/name. Role assigned: **Admin**.

**Error:** `403` if caller is not Super Admin; `400` for validation.

---

### 6.2 Invite Consultant (Super Admin or Admin)

**Endpoint:** `POST /api/v1/auth/invite-consultant`

**Request body:**

| Field  | Type   | Required | Description   |
|--------|--------|----------|---------------|
| `email`| string | Yes      | Consultant’s email |

**Success response:** Invite sent; invited user completes registration. Role: **Consultant** (permissions assigned separately).

**Error:** `403` if caller is not Super Admin or Admin; `400` for validation.

---

### 6.3 Set client-invite permissions (Super Admin only)

Super Admin grants or revokes “invite clients” and “approve client invites” for a user (Admin or Consultant).

**Endpoint:** `PATCH /api/v1/auth/users/:userId/client-invite-permissions`

**Path parameters:**

| Name     | Type   | Description   |
|----------|--------|---------------|
| `userId` | string | Target user UUID |

**Request body:**

| Field                      | Type    | Required | Description                          |
|---------------------------|---------|----------|--------------------------------------|
| `can_invite_clients`      | boolean | No       | Allow user to send client invites    |
| `can_approve_client_invites` | boolean | No   | Allow user to approve consultant’s client invites |

**Example:**

```json
{
  "can_invite_clients": true,
  "can_approve_client_invites": false
}
```

**Success response:** Confirmation and updated user/company link.  
**Error:** `403` if caller is not Super Admin; `404` if user not found.

---

### 6.4 List pending client invite requests

Admins (or Super Admin) with **approve client invites** permission can list pending requests created when a Consultant sends a client invite.

**Endpoint:** `GET /api/v1/auth/client-invite-requests/pending`

**Headers:** Authenticated user.

**Request body:** None.

**Success response:**

```json
{
  "success": true,
  "message": "Pending requests retrieved",
  "data": {
    "pendingRequests": [
      {
        "id": "<request-uuid>",
        "contact_id": "...",
        "requested_by_user_id": "...",
        "contact": { ... },
        ...
      }
    ]
  }
}
```

**Error:** `403` if user does not have permission to approve client invites.

---

### 6.5 Approve client invite request

Approves a pending client invite request: sends the invite email and updates the contact status to **Invited**.

**Endpoint:** `POST /api/v1/auth/client-invite-requests/:requestId/approve`

**Path parameters:**

| Name        | Type   | Description    |
|-------------|--------|----------------|
| `requestId` | string | Request UUID   |

**Request body:** None.

**Success response:** Message that invite was sent and request approved.  
**Error:** `403` if no permission; `404` if request not found or already processed.

---

### 6.6 Reject client invite request

Rejects a pending client invite request. Invite is not sent; contact remains **Uninvited**.

**Endpoint:** `POST /api/v1/auth/client-invite-requests/:requestId/reject`

**Path parameters:** `requestId` — Request UUID.

**Request body:** None.

**Success response:** Confirmation of rejection.  
**Error:** `403` if no permission; `404` if request not found or already processed.

---

## 7. User management & deactivation

### 7.1 Add user (Admin / Consultant only)

Adding users from **User Management** is restricted to **Admin** and **Consultant** roles. **Client** cannot be added here; clients are created via Contacts.

- **Endpoint:** As per your existing “add user” or “add user to company” API (e.g. firm-admin or user module).
- **Behaviour:** If the requested role is **Client** (or Super Admin), the backend returns **400** with a message that only Admin and Consultant can be added here and that client creation is done from Contacts.

---

### 7.2 Deactivate user (Super Admin only)

Deactivates an Admin or Consultant; they lose access to the system.

**Endpoint:** `PATCH /api/v1/auth/users/:userId/deactivate`

**Path parameters:** `userId` — User UUID.

**Request body:** None.

**Success response:** Confirmation that the user was deactivated.  
**Error:** `403` if caller is not Super Admin; `404` if user not found.

---

### 7.3 Reactivate user (Super Admin only)

Reactivates a previously deactivated Admin or Consultant. The user receives a **set-password** email and must call **Set password with token** before they can log in again.

**Endpoint:** `PATCH /api/v1/auth/users/:userId/reactivate`

**Path parameters:** `userId` — User UUID.

**Request body:** None.

**Success response:** Confirmation; set-password email sent to the user.  
**Error:** `403` if caller is not Super Admin; `404` if user not found.

---

## 8. Projects

### 8.1 Create project (with optional contact by email)

Create a project. Optionally, client can be specified by **email** (and optional phone/name): the backend will **create or link** a contact and attach them to the project. Alternatively, an existing contact/client can be specified by ID (e.g. via `project_client` or existing form fields).

**Endpoint:** `POST /api/v1/projects`

**Headers:** Authenticated user.

**Request body (relevant fields):**

| Field              | Type   | Required | Description                                      |
|--------------------|--------|----------|--------------------------------------------------|
| `name`             | string | Yes      | Project name                                     |
| `project_type_id`  | string | Yes      | Journey/project type UUID                        |
| `client_id`        | string | No*      | Existing contact/client ID                       |
| `client_email`     | string | No       | Create or link contact by email                  |
| `client_phone`     | string | No       | Used when creating a new contact                 |
| `client_name`      | string | No       | Used when creating a new contact                 |
| `start_date`       | string | No       | ISO date (YYYY-MM-DD)                            |
| `end_date`         | string | No       | ISO date (YYYY-MM-DD)                            |
| `description`      | string | No       | Optional                                         |
| `consultant_id`    | string | No       | Consultant UUID                                  |
| `milestone_id`     | string | No       | Milestone UUID                                   |
| `status`           | string | No       | Project status                                   |
| `custom_fields`    | object | No       | Form custom fields                               |

*Depending on form configuration, either a client (by ID or by email) may be required by the UI; backend accepts `client_email` to create or link a contact when provided.

**Behaviour:** If `client_email` is provided and non-empty, the backend looks up a contact by company + email; if none exists, it creates a new contact (status **Uninvited**) with optional `client_name` and `client_phone`, then associates that contact with the project. Existing project form fields (e.g. `project_client`) may also be used; the exact payload may include form-specific fields.

**Success response:** Created project object.  
**Error:** `400` for validation; `404` if project type, client, or milestone not found.

---

### 8.2 Get project / List projects

- **Get one:** `GET /api/v1/projects/:project_id`  
- **List:** `GET /api/v1/projects`  
- **Search:** `GET /api/v1/projects/query` (with query parameters as implemented)

**Success response:** Project(s) with structure as in current API (e.g. form_fields, timeline).  
**Client visibility:** For **Client** role, list is filtered to projects they are members of.

---

### 8.3 Update project

**Endpoint:** `PATCH /api/v1/projects/:project_id`

**Request body:** Fields to update (name, description, client_id, consultant_id, start_date, end_date, status, etc. as allowed).  
**Success response:** Updated project.  
**Error:** `400` / `404` as applicable.

---

## 9. Tasks

### 9.1 Task model (implemented behaviour)

- **Description:** Optional (max length 500 characters).
- **Due date:** Single field **due_date** (ISO date). No start date.
- **Status:** Only **Pending** and **Completed** (no “In progress”).
- **Visibility:** **Inhouse** (`is_visible_to_client: false`) — client does not see the task; **Client facing** (`is_visible_to_client: true`) — client and internal users see it.
- **Filter:** Task list can be filtered by `is_visible_to_client` (query parameter `true` or `false`).

---

### 9.2 Create task

**Endpoint:** `POST /api/v1/projects/:project_id/tasks`

**Request body:**

| Field                 | Type    | Required | Description                          |
|-----------------------|---------|----------|--------------------------------------|
| `name`                | string  | Yes      | Task name                            |
| `due_date`            | string  | Yes      | ISO 8601 date                        |
| `project_type_id`     | string  | Yes      | Project type UUID                    |
| `is_visible_to_client`| boolean | Yes      | false = Inhouse, true = Client facing |
| `description`         | string  | No       | Optional, max 500 chars              |
| `status`              | string  | No       | `pending` \| `completed`             |
| `assignees`           | array   | No       | Array of user IDs                    |
| `task_type_id`       | string  | No       | Task type UUID                       |
| `attachments`        | array   | No       | Attachment IDs                       |

**Success response:** Created task (includes `due_date`, `is_visible_to_client`, `status`).  
**Error:** `400` for validation; `404` if project or project type not found.

---

### 9.3 Update task

**Endpoint:** `PATCH /api/v1/projects/:project_id/tasks/:task_id`

**Request body:** Same fields as create (all optional for update). `status` only accepts `pending` or `completed`.  
**Success response:** Updated task.  
**Error:** `400` / `404` as applicable.

---

### 9.4 Get task by ID

**Endpoint:** `GET /api/v1/projects/:project_id/tasks/:task_id`

**Behaviour:** For **Client** role, the API returns **404** (or equivalent) if the task is Inhouse (`is_visible_to_client: false`). Internal users (Admin, Consultant, Super Admin) see all tasks.

**Success response:** Task object with `due_date`, `status`, `is_visible_to_client`, etc.  
**Error:** `404` if task not found or (for clients) not visible.

---

### 9.5 List tasks (with visibility filter)

**Endpoint:** `GET /api/v1/projects/tasks`

**Query parameters:** As implemented; optional `is_visible_to_client=true` or `is_visible_to_client=false` to filter by Inhouse vs Client facing.  
**Behaviour:** Client users only see client-facing tasks; internal users see all (or filtered by query).

**Success response:** List of tasks.  
**Error:** Standard (e.g. `401` if not authenticated).

---

### 9.6 Assigned-to-me task count (sidebar badge)

Returns the count of tasks assigned to the current user that are **not completed**. Used for the tasks sidebar badge/notification.

**Endpoint:** `GET /api/v1/projects/tasks/assigned-to-me/count`

**Headers:** Authenticated user.

**Request body:** None.

**Success response:**

```json
{
  "success": true,
  "message": "...",
  "data": {
    "count": 5
  }
}
```

**Explanation:** Count decreases when tasks are marked **Completed** because the query excludes completed tasks. Frontend can poll this endpoint to update the sidebar badge.

---

### 9.7 Delete task

**Endpoint:** `DELETE /api/v1/projects/:project_id/tasks/:task_id`

**Success response:** Confirmation of deletion.  
**Error:** `403` / `404` as applicable.

---

## 10. Defaults on workspace creation

When a **Super Admin** creates a workspace via **Workspace signup**:

1. **Default journey (project type)** — A default project type (e.g. “Default Journey”) is created automatically so the workspace has at least one journey to use for projects.
2. **Default task types** — Default task types are created (e.g. “Document upload”, “General”) so the workspace can create tasks without extra setup.

These are created in the same transaction as the workspace and do not require separate API calls. **Document upload** is intended for tasks that show an upload field in the task form (UI behaviour).

---

## Summary table of main endpoints

| Feature | Method | Path |
|--------|--------|------|
| Workspace signup | POST | `/api/v1/auth/workspace-signup` |
| Login | POST | `/api/v1/auth/login` |
| Complete registration | POST | `/api/v1/auth/complete-registration` |
| Set password (token) | POST | `/api/v1/auth/set-password` |
| Add contact | POST | `/api/v1/contacts` |
| List contacts | GET | `/api/v1/contacts` |
| Send contact invite | POST | `/api/v1/auth/contacts/:contactId/send-invite` |
| Invite Admin | POST | `/api/v1/auth/invite-admin` |
| Invite Consultant | POST | `/api/v1/auth/invite-consultant` |
| Client invite permissions | PATCH | `/api/v1/auth/users/:userId/client-invite-permissions` |
| Pending client invite requests | GET | `/api/v1/auth/client-invite-requests/pending` |
| Approve client invite | POST | `/api/v1/auth/client-invite-requests/:requestId/approve` |
| Reject client invite | POST | `/api/v1/auth/client-invite-requests/:requestId/reject` |
| Deactivate user | PATCH | `/api/v1/auth/users/:userId/deactivate` |
| Reactivate user | PATCH | `/api/v1/auth/users/:userId/reactivate` |
| Create project | POST | `/api/v1/projects` |
| Create task | POST | `/api/v1/projects/:project_id/tasks` |
| Get task | GET | `/api/v1/projects/:project_id/tasks/:task_id` |
| Assigned-to-me count | GET | `/api/v1/projects/tasks/assigned-to-me/count` |

---

## References

- **Requirements tracking:** `docs/REQUIREMENTS_UPDATES.md` — Detailed mapping of product requirements to implementation and status (FIXED/implemented).
- **Auth routes:** `src/modules/auth/auth.route.ts`
- **Contact routes:** `src/modules/contact/contact.route.ts`
- **Project routes:** `src/modules/projects/projects.route.ts`

If you need request/response samples for a specific environment (e.g. Postman) or more detail on error codes for a given endpoint, that can be added in a follow-up.
