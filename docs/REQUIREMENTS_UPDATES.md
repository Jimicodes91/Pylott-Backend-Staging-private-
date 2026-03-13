# Pylott Requirements Updates — Summary

**Purpose:** Understand and track all updates from the product spec. Items marked **FIXED** have been implemented.

---

## Column reference (from your sheet)

| Col | Meaning |
|-----|--------|
| A | Row # / EPIC label |
| B | Objective |
| C | User (As a…) |
| D | I want |
| E | So that |
| F+ | Acceptance criteria / details |

---

## 1. Self-Serve Account Creation (Row 2) — **FIXED**

**Objective:** Any new user can create a workspace account and become the primary admin (Super User). Only admins can invite others.

| Ref | Item |
|-----|------|
| **User** | As a new user |
| **I want** | To create an account directly |
| **So that** | I become the primary admin (Super Admin) of my workspace |
| **AC 1** | Sign up via **email + password** only (for new workspace creation). |
| **AC 2** | On account creation: a **new workspace is automatically created**. |
| **AC 3** | On account creation: user is assigned role **super_admin**. |
| **AC 4** | **No approval** required for this flow. |
| **AC 5** | In DB: `role = super_admin`. |
| **AC 6** | Super_admin role is the one that **seeds** (creates/configures) all other user roles in the system. |

**Implied:** There must be a dedicated “create workspace / sign up as first admin” flow (e.g. separate from invite flows).

**Implementation:** `POST /auth/workspace-signup` with body `{ email, password, name }`. Creates a new company (workspace), creates user with `role = SUPER_ADMIN`, links via `user_companies`, sets `company.admin_id`. No OTP; `is_verified: true` so user can log in immediately.

---

## 2. Prevent Non-Admin Account Creation (Row 3) — **FIXED**

**Objective:** Platform must prevent non-admin users from signing up on their own.

| Ref | Item |
|-----|------|
| **User** | As a platform |
| **I want** | To prevent non-admin users from signing up independently |
| **So that** | All other roles are invited by an admin |
| **AC 1** | **No public signup** for: Consultants, Clients, Secondary Admins. |
| **AC 2** | These roles only enter the system via **invite** (from Super Admin or Admin with rights). |

**Implied:** Remove or restrict any public/self-serve signup that allows selecting Consultant/Client/Admin. Only the “create workspace → become super_admin” path is self-serve.

**Implementation:** Backend keeps `admin-signup` and `company-admin-signup` endpoints; **frontend** should not expose these APIs (no signup UI for Admin/Consultant/Client). Google auth: no new user creation—if no account exists, returns 403 with message to sign up for a workspace or request an invite.

---

## 3. User vs Contact Separation (Rows 5–6) — **FIXED**

**Objective:** Single place for client creation — Contacts only. No creating clients from User Management.

| Ref | Item |
|-----|------|
| **User** | As a Super Admin |
| **I want** | To prevent clients from being created in User Management |
| **So that** | All client lifecycle starts in Contacts |
| **AC 1** | In **Admin user table / Add user flow**: only these roles available: **Admin**, **Consultant**. |
| **AC 2** | **Client** role is **not** available in Add user. |
| **AC 3** | **Existing clients** remain unaffected (no data migration that removes them). |

**Current state (from codebase):**  
- Add user exists in firm-admin (`addUser` with any `UserRoles`).  
- Add client exists in auth (`addClient` + `/add-client` route).  
- Contacts have `addToContact` (Contact only, no user).

**Change:** Restrict “Add user” to Admin/Consultant only; remove “Add client” from User Management; client creation only via Contacts (see next section).

**Implementation:** Added `ROLES_ALLOWED_IN_ADD_USER = [ADMIN, CONSULTANT]` in shared/enums. Firm-admin `addUser` and user module `addUserToCompany` reject role CLIENT (and SUPER_ADMIN) with 400; message: only Admin and Consultant can be added here; client creation is done from Contacts. Existing clients unchanged.

---

## 4. Client Creation Only via Contacts (Row 6) — **FIXED**

**Objective:** Clients are created only from the Contacts view; contact and client share the same lifecycle.

| Ref | Item |
|-----|------|
| **User** | As a Super Admin or consultant |
| **I want** | To create clients from the Contacts view |
| **So that** | Contacts and clients share the same lifecycle |
| **AC 1** | In **Contacts**, “Add Contact” form has: **Name**, **Email**, **Phone**. |
| **AC 2** | On save: **Contact is created**; **Status = "Uninvited"**. |
| **AC 3** | **Add and display Status** on the contacts grid. |
| **AC 4** | **No invite email** is sent automatically on contact creation. |

**Implied:** Contact model/table needs a **status** field (e.g. `Uninvited` | `Invited` | `Active`). Backend and frontend for contact form and grid must support it.

**Implementation:** Added `status` to contacts (migration `20260313120000_add_contact_status.ts`, default `Uninvited`). Contact model and AddContactDto include `status`; add-contact sets `status: 'Uninvited'` on create. No invite email is sent on contact creation. List/get contact APIs return `status` so the grid can display it. Add-contact form already has Name, Email, Phone (optional fields remain for backward compatibility).

---

## 5. Controlled Client Activation (Row 7) — **FIXED**

**Objective:** Decouple “creating a contact” from “giving platform access”; invite is explicit.

| Ref | Item |
|-----|------|
| **User** | As an Admin or consultant |
| **I want** | To manually send an invite to a contact |
| **So that** | I control when they get platform access |
| **AC 1** | In Contacts table: if **Status = Uninvited** → show **“Send Invite”** button. |
| **AC 2** | On click: **confirmation modal** appears. |
| **AC 3** | Then: **invite email** sent, **invite token** generated. |
| **AC 4** | **Status** updates to **Invited**. |
| **AC 5** | When client **sets password** (completes registration): **Status** updates to **Active**. |

**Implied:** Invite flow for clients is contact-based (contact id/email), token lifecycle, and status transitions: Uninvited → Invited → Active.

**Implementation:** **FIXED.** Backend: `POST /auth/contacts/:contactId/send-invite` (Admin or Consultant). Loads contact by id, checks company and status (Uninvited only); creates CLIENT invitation and sends email via `createAndSendInvite`; sets contact `status` to `Invited`. In `completeRegistration`, when role is CLIENT: new contacts created with `status: 'Active'`; existing contact updated to `status: 'Active'`. AC 1–2 (button and modal) are frontend.

---

## 6. Account and Role Creation — Invites (Rows 8–11) — **FIXED**

### 6.1 Invite Admin (Row 8)

| Ref | Item |
|-----|------|
| **User** | As a super admin |
| **I want** | To invite a new admin |
| **So that** | They can help manage the workspace |
| **AC 1** | **Only Super Admin** can invite Admins. |
| **AC 2** | Super Admin **assigns admin actions** (what the admin can do). |
| **AC 3** | Invite is sent via **email**; invited user **sets password**; role assigned is **Admin**. |

### 6.2 Invite Consultant (Row 9)

| Ref | Item |
|-----|------|
| **User** | As a Super Admin or Admin |
| **I want** | To invite a Consultant |
| **So that** | They can work on assigned clients and projects |
| **AC 1** | **Super Admin and Admin** can send Consultant invites. |
| **AC 2** | Consultant role is created with **zero permissions by default**. |
| **AC 3** | Super Admin and Admin (with rights) **assign actions** the consultant can perform (per matrix). |

### 6.3 Invite Client — Rights (Row 10)

| Ref | Item |
|-----|------|
| **User** | As a super admin |
| **I want** | To give consultant and admin “client invite” rights |
| **So that** | They can invite clients to the system |
| **AC 1** | Super Admin can grant **admin** and **consultant** the right to **invite clients**. |
| **AC 2** | **Send email to client** is **not** available to consultant by default (only when given rights). |

### 6.4 Approve Client Invites (Row 11)

| Ref | Item |
|-----|------|
| **User** | As a super admin |
| **I want** | To give admin rights to approve/reject client invites sent by consultant |
| **So that** | Client invites from consultants go through an approval flow |
| **AC 1** | Consultant with **client invite rights** can send **contact/client** email invites. |
| **AC 2** | An **admin with rights** must **approve** that client/contact before the consultant can send the invite. |
| **AC 3** | **Super admin and admin** can see **contacts added by consultants**. |

**Implied:** Permission model: “client_invite”, “approve_client_invite”; approval state on contact or invite (e.g. pending_approval → approved → invite sent).

**Implementation:** **FIXED.** (6.3) Migration adds `user_companies.can_invite_clients` and `can_approve_client_invites` (default false). Super Admin grants via `PATCH /auth/users/:userId/client-invite-permissions` (body: `can_invite_clients`, `can_approve_client_invites`). `sendContactInvite` allows only if user has `can_invite_clients` (Super Admin bypass). (6.4) Consultant with right: creates pending `client_invite_requests`; Admin/Super Admin with `can_approve_client_invites` can `GET /auth/client-invite-requests/pending`, `POST .../approve` (sends invite), `POST .../reject`. Contacts have `added_by_user_id`; list returns it so Super Admin/Admin can see contacts added by consultants.

---

## 7. Deactivate Admin or Consultant (Row 12) — **FIXED**

| Ref | Item |
|-----|------|
| **User** | As a super admin |
| **I want** | To deactivate an admin or consultant |
| **So that** | They do not have access to the system |
| **AC 1** | When Super Admin **deactivates** admin or consultant: **they cannot access** the system. |
| **AC 2** | Super Admin can **reactivate** them. |
| **AC 3** | If **reactivated**, they must **set/confirm password** again to get access. |

**Implied:** Deactivation (e.g. `is_active` or equivalent) and reactivation flow; optional “must reset password on reactivation” rule.

**Implementation:** Super Admin only: PATCH /auth/users/:userId/deactivate and PATCH /auth/users/:userId/reactivate. Reactivate sends set-password email; POST /auth/set-password (token, newPassword) required before login. Login blocks when no active company or when password_setup_token set.

---

## 8. Default Journeys (Row 13)

| Ref | Item |
|-----|------|
| **User** | As a system administrator |
| **I want** | To automatically create **default journeys** when a super admin is created |
| **So that** | Onboarding is structured immediately |
| **AC 1** | When a **super admin is created** (workspace created), **default journeys** are created automatically. |

**Note:** The doc doesn’t list the exact default journey names; these need to be defined (or already exist in another spec).

**Implementation:** **FIXED.** In `AuthService.workspaceSignup`, after creating company and user (inside the same transaction), default project types (journeys) are created via `ProjectTypeRepository`. Default name used: `"Default Journey"` (single journey, `is_system: true`). Constant `defaultJourneyNames` allows adding more names later.

---

## 9. Default Task Types (Row 14)

| Ref | Item |
|-----|------|
| **User** | As a system administrator |
| **I want** | To automatically create **default task types** when a super admin is created |
| **So that** | Onboarding is structured immediately |
| **AC 1** | Create **default task types** on super admin/workspace creation. |
| **AC 2** | **Document upload:** when task type is “Document upload”, the task form should show an **upload field** for adding tasks. |

**Implied:** Seed default task types; task creation UI/API supports “document upload” type with file upload.

---

**Implementation:** **FIXED (AC 1).** In `AuthService.workspaceSignup`, after default journeys, default task types are created via `MetadataRepository` with `type: MetadataType.TASK`, `is_system: true`. Default names: `"Document upload"`, `"General"`. AC 2 (upload field when type is "Document upload") is frontend: task form should show an upload field when the selected task type name is "Document upload".

---

## 10. Task Structure — Description Optional (Row 15)

| Ref | Item |
|-----|------|
| **User** | As a super admin / admin / consultant creating a task |
| **I want** | Description to be optional |
| **So that** | I can quickly create tasks |
| **AC 1** | **Task description** field is **optional**. |

**Implementation:** **FIXED.** `createTaskValidationRules`: description is `.optional()` with max length 500. `CreateTask` type: `description` is optional (`description?: string`). Task service create: uses `payload?.description ?? ''` when persisting.

---

## 11. Inhouse vs Client-Facing Tasks (Rows 16–17)

### 11.1 Classification (Row 16)

| Ref | Item |
|-----|------|
| **User** | As a super admin, admin or consultant |
| **I want** | To classify tasks as “Inhouse” or “Client” |
| **So that** | Internal work and client-facing tasks are separated |
| **AC 1** | When **adding a task**: add a **dropdown** to select **Inhouse** or **Client facing**. |
| **AC 2** | **Inhouse** → client **does not** see the task. |
| **AC 3** | **Client facing** → client and internal users see the task. |
| **AC 4** | **Filter** on tasks to filter by **Inhouse** vs **Client facing**. |

### 11.2 Preserve Existing Data (Row 17)

| Ref | Item |
|-----|------|
| **User** | As a system administrator |
| **I want** | To keep previously defined task types and data |
| **So that** | Existing data is not broken |
| **AC 1** | **Old tasks** remain stored. |
| **AC 2** | They are **mapped to “Inhouse”** (default classification). |
| **AC 3** | **No migration breaks**; **historical data** remains intact. |

**Implied:** New field on task (e.g. `visibility` or `classification`: inhouse | client_facing); migration to set existing tasks to inhouse.

**Implementation:** **FIXED.** (11.1) Tasks already use `is_visible_to_client`: false = Inhouse, true = Client facing. AC 1 (dropdown) is frontend. AC 2–3: Client list and getTaskById only see/return tasks with `is_visible_to_client === true`; internal users see all. AC 4: List tasks accepts `?is_visible_to_client=true|false`; repository filters when no assignee and visibility is set; query param parsed from string to boolean. (11.2) Migration `20260313120001_set_old_tasks_inhouse.ts`: sets `is_visible_to_client = false` where NULL so existing tasks map to Inhouse.

---

## 12. Task Notification on Creation (Row 18)

| Ref | Item |
|-----|------|
| **User** | As a super admin, admin or consultant |
| **I want** | To see a notification when a task is assigned (to me) |
| **So that** | I don’t miss tasks in the Pylott platform |
| **AC 1** | Add a **notification** (e.g. ticket/badge) on the **tasks sidebar**. |
| **AC 2** | Show **task count** in the **sticker/badge**. |
| **AC 3** | When task status is updated to **Completed**, **deduct** from the count. |

**Implied:** Notifications or counts for “my assigned tasks” that are not completed; update on status change.

**Implementation:** **FIXED.** Backend: new endpoint `GET /projects/tasks/assigned-to-me/count` returns `{ count }` = number of tasks assigned to the current user that are not completed (status ≠ completed, task and assignee not deleted). Frontend can poll this for the sidebar badge (AC 1–2). Count decreases when a task is marked completed (AC 3) because the query excludes completed tasks. Email on task assign already exists (`newTaskAssignedEmail`). Badge UI and placement on tasks sidebar are frontend.

---

## 13. Iterations — Task Dates and Status (Rows 20–21)

### 13.1 Task Start/End Dates (Row 20)

| Ref | Item |
|-----|------|
| **User** | As a super admin, admin or consultant |
| **I want** | (Simpler task dates) |
| **AC 1** | **Remove** task **start date**. |
| **AC 2** | **Rename** “end date” to **“due date”** (and use it as the single date field for tasks). |

### 13.2 Task Status (Row 21)

| Ref | Item |
|-----|------|
| **User** | As a super admin, admin or consultant |
| **AC 1** | **Only two states:** **Completed**, **Pending**. **Remove** “In-progress” (or any third state) for tasks. |

**Current state (from codebase):** Task status includes `pending`, `in_progress`, `completed`. This will be reduced to two states.

**Implementation:** **FIXED.** (13.1) Migration `20260313120002_task_due_date_and_two_status.ts`: dropped `start_date`, renamed `end_date` to `due_date`. Model, CreateTask/DocumentRequestType, validations (create/update task, document request): single date field `due_date`. Task and docs-request services use `due_date` only; responses return `due_date`. (13.2) Migration sets existing `in_progress` to `pending`. Enum `ProjectTaskStatus`: removed `IN_PROGRESS`; only `PENDING`, `COMPLETED` (and `OVER_DUE` for computed display). Validations allow only `pending` and `completed`. `getTaskStatusCounts` uses `due_date` for overdue and returns `in_progress: 0`.

---

## 14. Project Add Form Updates (Rows 22–23)

**Objective:** Simplify and align project creation with contacts and new field rules.

| Ref | Item |
|-----|------|
| **Keep** | Project Name; Select journey. |
| **Remove** | Description (or replace with “Note” only); Client organization; Resident country; Postcode; End date; “Project client” as a separate concept if replaced by emails/contacts. |
| **Change** | **Use emails** for project clients (link to contacts by email). |
| **Optional** | Project value; Nationality; Start date (keep but not mandatory). |
| **Keep** | Phone number (search by phone); Email (search by email); Client name (not mandatory). |
| **Remove** | End date from project form. |

### Row 23 — Contacts from Project

| Ref | Item |
|-----|------|
| **User** | As a super admin, admin or consultant |
| **I want** | To add client email and phone when creating a project |
| **So that** | Contacts are created (or linked) |
| **AC 1** | When creating a project, user can add **client email & phone**; this creates or links **contacts**. |

**Implied:** Project form uses email/phone (and optionally name) to attach contacts; contact creation/linking when creating a project.

**Implementation:** **FIXED.** (Row 22) Create project accepts `client_email` (and optional `client_phone`, `client_name`). When `client_email` is provided, contact is found by company_id + email or created (Uninvited) with name/phone; contact id is added to `project_client` so existing logic adds them as project member if they have a user. (Row 23) Same flow: adding client email/phone on project create creates or links the contact. `CreateProjectType`: `client_id`, `start_date`, `end_date` optional; added `client_email?`, `client_phone?`, `client_name?`. Project create stores `start_date`/`end_date` as null when not provided (end date removed from required; start date optional). Form field changes (remove Description, Client organization, etc.) and default form field list are frontend/config; backend accepts the new optional shape.

---

## Quick reference: A–AB (your columns)

| Col | Content |
|-----|--------|
| A | Row number / EPIC |
| B | Objective |
| C | User (As a…) |
| D | I want |
| E | So that |
| F–AB | Acceptance criteria and notes |

---

## Implementation order (suggested)

1. **Auth & roles:** Self-serve workspace creation (super_admin) ✅ **DONE**; remove public signup for non-admins (2, 3) ✅ **DONE**.  
2. **Contacts & clients:** Contact status (Uninvited/Invited/Active), client creation only via Contacts (4) ✅ **DONE**; Send Invite flow (5).  
3. **User management:** Restrict Add user to Admin/Consultant; remove Add client from user management (3) ✅ **DONE**.  
4. **Invites & permissions:** Admin/Consultant invite flows, client invite rights, approval workflow for consultant-invited clients (6.1–6.4) ✅ **DONE**.  
5. **Deactivation:** Deactivate/reactivate admin and consultant; optional password reset on reactivation (7) ✅ **DONE**.  
6. **Defaults:** Default journeys and task types on workspace creation (8, 9).  
7. **Tasks:** Optional description; inhouse vs client-facing; migration; remove start date, rename end → due date; status = Pending | Completed only (10, 11, 13, 17).  
8. **Task UX:** Notifications and count badge on tasks sidebar (12).  
9. **Projects:** Project form changes and contact creation/linking when adding client email/phone (14, 22, 23).  

---

*Document generated from product spec. Items marked FIXED/DONE have been implemented.*
