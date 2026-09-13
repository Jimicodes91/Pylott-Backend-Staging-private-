# Requirements Document

## Introduction

This feature hardens the shared document-upload path in the PYLOTT backend (`src/modules/docs`, `src/shared/utils/cloud-storage/cloudinary.ts`) so that it is safe to route **all** client file submissions through it. Today the document path stores files in Cloudinary and keeps only a URL (good), but it does not validate file type by content, does not enforce an explicit per-file size limit, uses client-influenced non-random storage keys, serves permanent public URLs, and has one endpoint (`getDocumentDetails`) that was missing a tenant scope. This is "Part B" of the broader plan to unify client-response file attachments onto the document path (Part A is tracked separately).

Each requirement is tagged with a cost classification so the money decisions are visible:

- **[NO COST]** — pure code change using existing libraries/services.
- **[MAY COST]** — may incur recurring or plan-tier cost depending on the chosen option.

## Glossary

- **Document_Upload_Service**: The service handling document creation and Cloudinary upload (`DocsService.uploadDocument`, `updateDocumentAttachment`).
- **Storage_Provider**: Cloudinary, the current file storage/delivery service (`Cloudinary` class).
- **Attachment_Payload**: The base64-encoded file string submitted in the JSON body as `attachment`.
- **Decoded_File**: The binary buffer produced from decoding the Attachment_Payload.
- **Allowed_Type_Set**: The configured allowlist of accepted file MIME types (e.g. PDF, PNG, JPEG, DOCX).
- **Max_File_Size**: The configured maximum size, in bytes, of a Decoded_File.
- **Storage_Key**: The `public_id` used to store a file in the Storage_Provider.
- **Signed_URL**: A time-limited, authenticated delivery URL for a stored file.
- **Tenant**: A company, identified by `company_id`, that owns projects and documents.

## Requirements

### Requirement 1: Validate File Type By Content — [NO COST]

**User Story:** As a platform operator, I want uploaded files validated by their actual content, so that a client cannot store an executable or script disguised as a document.

#### Acceptance Criteria

1. WHEN a Decoded_File is produced from an Attachment_Payload, THE Document_Upload_Service SHALL determine the file's type from its content (magic bytes), not from a client-supplied name or extension.
2. IF the detected type is not in the Allowed_Type_Set, THEN THE Document_Upload_Service SHALL reject the upload with a validation error and SHALL NOT store the file.
3. WHERE the detected type is in the Allowed_Type_Set, THE Document_Upload_Service SHALL proceed with the upload.
4. THE Allowed_Type_Set SHALL be configurable without code changes to the validation logic.

_Cost note: implemented with an open-source detection library (e.g. `file-type`, MIT). No new billed service._

### Requirement 2: Enforce Maximum File Size — [NO COST]

**User Story:** As a platform operator, I want an explicit per-file size limit, so that clients cannot degrade the system with oversized uploads.

#### Acceptance Criteria

1. WHEN a Decoded_File is produced, THE Document_Upload_Service SHALL measure its size in bytes before uploading to the Storage_Provider.
2. IF the Decoded_File size exceeds Max_File_Size, THEN THE Document_Upload_Service SHALL reject the upload with a validation error and SHALL NOT store the file.
3. THE Max_File_Size SHALL be configurable.
4. THE size check SHALL run independently of the global request-body limit.

_Cost note: buffer length check. Lowering the limit can reduce storage/bandwidth spend._

### Requirement 3: Randomized, Non-Predictable Storage Keys — [NO COST]

**User Story:** As a platform operator, I want storage keys to be randomized and not client-controlled, so that files cannot be overwritten or enumerated by guessing names.

#### Acceptance Criteria

1. WHEN a file is uploaded to the Storage_Provider, THE Document_Upload_Service SHALL generate the Storage_Key from a server-generated random identifier.
2. THE Document_Upload_Service SHALL NOT use the client-supplied file name as the sole or predictable basis for the Storage_Key.
3. THE Storage_Provider upload SHALL be configured so a new upload does not overwrite an existing file with a colliding name (`unique_filename: true` or equivalent).
4. THE stored document record SHALL retain the original human-readable file name for display purposes, separate from the Storage_Key.

_Cost note: configuration/code change in `cloudinary.ts`. No new billed service._

### Requirement 4: Non-Executable Delivery Disposition — [NO COST]

**User Story:** As a platform operator, I want files delivered as downloads rather than rendered inline, so that a malicious file cannot execute in a browser context.

#### Acceptance Criteria

1. WHEN a stored file's delivery URL is produced, THE Document_Upload_Service SHALL configure delivery so the file is served with an attachment disposition (forced download) rather than inline rendering.
2. THE delivery configuration SHALL pin or constrain the delivered content type so it is not interpreted as executable content in the browser.

_Cost note: Cloudinary delivery flag (`flags: attachment`). No metered charge._

### Requirement 5: Restricted, Time-Limited File Access — [MAY COST]

**User Story:** As a platform operator, I want file access to be authenticated and time-limited, so that a leaked URL does not grant permanent open access.

#### Acceptance Criteria

1. WHEN a client or team member is granted access to a stored file, THE Document_Upload_Service SHALL provide a Signed_URL that expires after a configured duration OR route the download through an authorized proxy endpoint.
2. THE Document_Upload_Service SHALL NOT expose a permanent, unauthenticated public URL for client-submitted files.
3. WHERE a Signed_URL has expired, THE Storage_Provider SHALL deny access to the file.

_Cost note: signing itself is not metered, but Cloudinary authenticated/private delivery may require a paid plan tier. Confirm current Cloudinary tier before implementation._

### Requirement 6: Tenant-Scoped Document Reads — [NO COST]

**User Story:** As a platform operator, I want every document read scoped to the requesting user's company, so that documents cannot be read across tenants.

#### Acceptance Criteria

1. WHEN a document detail is requested, THE Document_Upload_Service SHALL scope the lookup by the requesting user's `company_id` in addition to `project_id` and `document_id`.
2. IF a document does not belong to the requesting user's Tenant, THEN THE Document_Upload_Service SHALL respond as if the document were not found.
3. THE tenant scope SHALL be applied consistently across document read endpoints (list and detail).

_Cost note: query change. No new billed service. **The detail-endpoint fix in this requirement has already been applied** (`getDocumentDetails` + repository now accept and enforce `company_id`)._

### Requirement 7: Malware Scanning — [MAY COST]

**User Story:** As a platform operator, I want uploaded files scanned for malware, so that the platform does not store or distribute infected files.

#### Acceptance Criteria

1. WHEN a Decoded_File passes type and size validation, THE Document_Upload_Service SHALL submit it for malware scanning before it is considered successfully stored, WHERE scanning is enabled.
2. IF a scan reports the file as malicious, THEN THE Document_Upload_Service SHALL reject the upload and SHALL NOT retain the file.
3. WHERE malware scanning is not enabled, THE Document_Upload_Service SHALL still enforce type and size validation (Requirements 1 and 2) as the minimum gate.
4. THE scanning integration SHALL be feature-flaggable so it can be deferred without blocking the other hardening work.

_Cost note: this is the primary cost item. Options — paid scanning API (recurring per-scan/subscription), self-hosted ClamAV (infra + ops cost, no license fee), or a paid Storage_Provider add-on. May be deferred; type + size gating is the zero-cost minimum._

## Cost Summary

| Requirement | Classification |
|---|---|
| 1. File-type validation by content | NO COST |
| 2. Max file size | NO COST |
| 3. Randomized storage keys | NO COST |
| 4. Non-executable delivery | NO COST |
| 5. Time-limited access (signed URLs) | MAY COST (Cloudinary plan tier) |
| 6. Tenant-scoped reads | NO COST (detail fix already applied) |
| 7. Malware scanning | MAY COST (scanning service / infra) |

## Open Questions (decide before implementing MAY COST items)

- What is the current Cloudinary plan tier? (Determines availability of authenticated/private/signed delivery for Requirement 5.)
- Expected upload volume? (Determines per-scan pricing viability for Requirement 7.)
- Is a proxy-download endpoint acceptable as an alternative to signed URLs if the Cloudinary tier does not support private delivery?

---

# Part A — Unify Client-Response File Field Onto the Document Path (Wave 3)

## Introduction

Part A closes the "completed-file content issue": today, when a client completes a **non-upload** task (`signing`, `information_request`, general `task`), the attached file is base64-encoded into the `file_url` column of `task_client_responses` instead of flowing through the hardened document path. Part A routes those file attachments through the same `DocsService` document path (hardened in Wave 1), so `file_url` holds a **reference to a stored document** rather than raw base64. Because the file then travels the hardened road, it automatically inherits Wave 1's type validation, size limits, randomized keys, download disposition, and (in Wave 2) restricted access.

**Prerequisite:** Wave 1 must be complete first, so files are unified onto an already-hardened path.

**Investigation finding (must be confirmed before implementation):** In this backend repo, `task_client_responses` has a model and repository, but **no service, controller, or route currently consumes them**, and no `client-response` route is registered. The frontend posts to `projects/tasks/{taskId}/client-response`. Part A therefore includes confirming/implementing the client-response endpoint, not just changing how it stores files.

## Additional Glossary

- **Client_Response_Endpoint**: The backend endpoint that records a client's task response (`POST projects/tasks/:taskId/client-response`), consuming `TaskClientResponsesRepository`.
- **Document_Reference**: A stable pointer to a stored document (its document id or hosted URL) kept on the client response instead of base64.
- **Legacy_Base64_Response**: An existing `task_client_responses` row whose `file_url` holds raw base64 rather than a Document_Reference.

## Requirements

### Requirement 8: Client-Response Files Route Through the Document Path — [NO COST]

**User Story:** As a platform operator, I want a client's task-response file to be stored via the hardened document path, so that every client file — not just document-upload tasks — gets the same validation and safe delivery.

#### Acceptance Criteria

1. WHEN a client submits a task response containing a file, THE Client_Response_Endpoint SHALL store the file via the hardened Document_Upload_Service rather than persisting base64 in `file_url`.
2. WHEN a client-response file is stored via the Document_Upload_Service, THE resulting document SHALL be linked to the originating task and project.
3. WHERE a client-response submission contains no file, THE Client_Response_Endpoint SHALL record the response without creating a document.
4. WHEN a client-response file is stored, THE `file_url` field SHALL hold a Document_Reference, not raw base64.

### Requirement 9: Client-Response File Validation Parity — [NO COST]

**User Story:** As a platform operator, I want client-response files validated exactly like document uploads, so that there is no weaker side door.

#### Acceptance Criteria

1. WHEN a client-response file is processed, THE Client_Response_Endpoint SHALL apply the same file-type validation as Requirement 1.
2. WHEN a client-response file is processed, THE Client_Response_Endpoint SHALL apply the same size limit as Requirement 2.
3. IF a client-response file fails type or size validation, THEN THE Client_Response_Endpoint SHALL reject the submission and SHALL NOT record a completed response for that file.

### Requirement 10: Client-Response Endpoint Exists and Is Authorized — [NO COST]

**User Story:** As a platform operator, I want the client-response endpoint to be implemented and access-controlled, so that only an assigned client can submit a response.

#### Acceptance Criteria

1. THE backend SHALL expose an authenticated Client_Response_Endpoint matching the frontend contract (`POST projects/tasks/:taskId/client-response`).
2. WHEN a response is submitted, THE Client_Response_Endpoint SHALL verify the requesting user is a client assigned to the task before recording it.
3. WHEN a valid response is recorded, THE Client_Response_Endpoint SHALL upsert into `task_client_responses` keyed by task and client.
4. IF the requesting user is not an assigned client of the task, THEN THE Client_Response_Endpoint SHALL reject the submission.

### Requirement 11: Backward-Compatible Reads for Legacy Base64 Responses — [NO COST]

**User Story:** As a platform operator, I want existing base64 responses to keep working during and after the transition, so that nothing breaks for already-submitted data.

#### Acceptance Criteria

1. WHERE a Legacy_Base64_Response is read, THE system SHALL continue to expose its file in a usable form (not error out).
2. WHEN new responses are created after Part A ships, THE system SHALL store a Document_Reference per Requirement 8.
3. THE read path SHALL distinguish a Document_Reference from a Legacy_Base64_Response so the correct rendering/download behavior is chosen.
4. WHERE a data migration of Legacy_Base64_Response rows is performed, THE migration SHALL convert each base64 `file_url` into a stored document and replace the value with a Document_Reference, and SHALL be runnable independently.

## Part A Cost Summary

| Requirement | Classification |
|---|---|
| 8. Client-response files via document path | NO COST |
| 9. Validation parity | NO COST (reuses Wave 1) |
| 10. Endpoint exists + authorized | NO COST |
| 11. Backward-compatible legacy reads | NO COST |

_All Part A items are NO COST in software terms. The only spend is indirect: files that were base64 in the DB now count toward Cloudinary storage/bandwidth (same account, no new service), and if Wave 2 restricted delivery is enabled these files inherit any plan-tier cost from Requirement 5._

## Part A Open Questions

- Is the `client-response` endpoint truly unimplemented in this repo, or implemented in another workspace/service? Confirm before building (Requirement 10). — **RESOLVED: it did not exist; implemented in Part A.**
- Is a one-time migration of Legacy_Base64_Response rows desired, or is dual-format read support (Requirement 11.1/11.3) sufficient? — **Both delivered: dual-read + optional migration script (task 15).**
- Does the frontend need to change how it submits files for non-upload tasks (it currently base64-encodes into the response payload), or will the endpoint accept the existing payload and route it server-side? — **RESOLVED: server routes the base64 through the hardened path; frontend keeps sending base64 (Option 1).**

## Allowlist Verification (Wave 1 Requirement 1)

Confirmed the hardened path's allowlist (PDF/PNG/JPEG, ~7 MB) matches what the client upload UI already enforces:

- The client upload component `DragNdrop` (`src/components/ui/file-upload.tsx`) restricts to `.pdf,.png,.jpg,.jpeg`, max 5 MB — the exact set the hardened backend now enforces. No legitimate client upload is rejected.
- Task/project attachments that also permit `application/msword` (Word) flow through a **different** path (`task.service.ts` → `cloudinary.upload(DocumentsDirectory.TASKS, ...)`), which Wave 1 did **not** modify. Word/xlsx task attachments are unaffected.
- **Follow-up (out of scope):** the `task.service.ts` attachment path uploads to Cloudinary with no type/size validation and filename-derived keys — the same gap Wave 1 closed for documents. Consider extending the hardening (and `storeTaskFile` reuse) to that path for parity.
