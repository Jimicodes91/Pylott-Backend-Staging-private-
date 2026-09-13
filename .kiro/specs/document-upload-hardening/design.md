# Design Document

## Overview

This design hardens the shared document-upload path so it can safely become the single path for all client file submissions (Part A, tracked separately). The changes are localized to the docs module and the Cloudinary storage utility. Cost-bearing items (signed delivery, malware scanning) are isolated behind configuration/feature flags so the no-cost hardening can ship independently.

Affected files:

- `src/shared/utils/cloud-storage/cloudinary.ts` — Storage_Provider integration (keys, delivery disposition, signed URLs).
- `src/modules/docs/services/docs.service.ts` — upload orchestration (validation, size, scanning hooks, tenant scope).
- `src/repositories/documents.repository.ts` — tenant-scoped reads. **(Already updated for the detail read.)**
- `src/modules/docs/docs.controller.ts` — thread `company_id` into detail read. **(Already updated.)**
- `src/shared/validations/docs.ts` — base64 shape validation (unchanged; content validation moves to the service, post-decode).
- `src/config/env.ts` — new config: allowed types, max size, signing toggle/duration, scanning toggle/provider.

## Architecture

The upload flow gains a validation-and-scan gate between "decode base64" and "store in Cloudinary":

```
Controller (auth + company_id)
  -> DocsService.uploadDocument
       1. decode Attachment_Payload -> Decoded_File buffer
       2. detect content type (magic bytes)         [Req 1, NO COST]
       3. check size <= Max_File_Size               [Req 2, NO COST]
       4. malware scan (if enabled)                 [Req 7, MAY COST]
       5. Cloudinary.upload with random key +        [Req 3/4, NO COST]
          attachment disposition
       6. persist Document + Attachment (URL only)
       7. auto-complete linked task (existing)
Reads
  -> DocsService.getDocumentDetails(company_id)      [Req 6, NO COST, DONE]
  -> deliver via Signed_URL / proxy                  [Req 5, MAY COST]
```

## Components and Interfaces

### 1. Content-type validation (Req 1) — NO COST

Add a helper (e.g. `validateFileType(buffer, allowedTypes)`) using an open-source detector such as `file-type` (MIT). Runs on the decoded buffer inside `uploadDocument` before calling Cloudinary. Rejects with a 400-style `ServiceType` when the detected MIME is not in `Allowed_Type_Set`. `Allowed_Type_Set` comes from `env` config so it is changeable without touching logic.

### 2. Size enforcement (Req 2) — NO COST

After decoding, compute `buffer.byteLength` and compare to `Max_File_Size` from config. Reject before upload. Independent of the global `bodyParser.json({ limit: '10mb' })` in `app.ts`, so the effective real-file cap is explicit rather than an accident of base64 inflation.

### 3. Randomized storage keys + disposition (Req 3, 4) — NO COST

In `Cloudinary.upload`:

- Generate `public_id` from a server-side UUID (optionally namespaced by `env`/directory), not the client file name.
- Set `unique_filename: true` and stop passing a predictable client-derived `public_id`.
- Add `flags: 'attachment'` (or configure delivery type) so files download rather than render inline, and constrain `resource_type` where possible instead of blanket `auto`.
- Continue returning the URL; the human-readable name is already stored separately on the `documents` record (`name`).

### 4. Restricted access (Req 5) — MAY COST

Two implementation options, chosen after confirming the Cloudinary tier:

- **Option A (Cloudinary private/authenticated delivery):** upload as `type: 'private'`/`authenticated`; generate expiring signed URLs at read time. Requires a supporting plan tier.
- **Option B (proxy download endpoint):** keep storage private and stream the file through an authenticated backend route that checks tenant + visibility, then redirects to a short-lived signed URL. Works regardless of tier but adds a route and bandwidth through the app.

Config: `SIGNED_URL_ENABLED`, `SIGNED_URL_TTL_SECONDS`.

### 5. Tenant-scoped reads (Req 6) — NO COST — ALREADY APPLIED

`getDocumentAndAttachments(project_id, document_id, company_id?)` now filters by `company_id` when provided; `DocsService.getDocumentDetails` accepts and forwards it; the controller passes `req.user.company_id`. The list endpoint already scoped by company via the repository/settings. Remaining: confirm all other read paths (attachments, requests) apply the same scope.

### 6. Malware scanning (Req 7) — MAY COST — FEATURE-FLAGGED

Introduce a `IFileScanner` interface with a no-op default implementation so the platform runs without cost until a provider is chosen:

- `NoopScanner` (default): returns clean; type + size gate remains the minimum.
- `ClamAvScanner`: connects to a self-hosted ClamAV daemon (infra cost).
- `ApiScanner`: calls a paid scanning API (recurring cost).

Selected via `SCANNER_PROVIDER` config. Scanning runs after size/type checks and before Cloudinary upload.

## Data Models

No schema change required. `documents.name` already holds the display name; the storage URL lives on `document_attachments.media_url`. If proxy delivery (Option B) is chosen, no column change is needed either — the stored value remains a reference.

## Error Handling

All rejections return the existing `ServiceType` shape (`{ status:false, message, statusCode }`) so the controller/`genericResponse` behavior is unchanged. Validation failures use 400; not-found/tenant-mismatch uses 404 (indistinguishable from missing, per Req 6.2).

## Testing Strategy

- Unit: type detection accepts allowlist and rejects disallowed content; size boundary at Max_File_Size; storage key is random and not derived from client name; disposition flag present.
- Unit: `getDocumentDetails` returns not-found for a document in another company.
- Contract: scanner interface — Noop passes through, a malicious-stub scanner blocks and prevents persistence.
- Regression: existing `document_upload` task auto-completion still succeeds for a valid file.

## Rollout / Cost Gating

Ship in two waves so no-cost hardening is not blocked by budget decisions:

1. **Wave 1 (NO COST):** Requirements 1, 2, 3, 4, 6. Deployable immediately.
2. **Wave 2 (MAY COST):** Requirements 5 and 7, after the Cloudinary tier and scanning-provider decisions are made.

---

# Part A Design — Unify Client-Response Files Onto the Document Path (Wave 3)

## Overview

Part A makes the client-response flow reuse the hardened `DocsService` so client-submitted files stop being stored as base64 in `task_client_responses.file_url` and instead become real documents with a Document_Reference. It depends on Wave 1 being complete.

**Investigation finding:** `task_client_responses` has a model + repository but no service/controller/route consumes them, and no `client-response` route is registered. So Part A implements (or completes) the endpoint in addition to changing storage.

Affected areas:

- **Backend (new/completed):** a client-response service + controller + route under `src/modules/projects` (or `src/modules/docs`) consuming `TaskClientResponsesRepository` and calling into `DocsService`.
- **Backend (reuse):** `DocsService.uploadDocument` logic for storing the file and linking it to the task/project.
- **Frontend:** `src/hooks/project-modules/tasks/use-update-client-response.tsx` and `client-task-view.tsx` — decide whether the client keeps sending base64 (server routes it) or switches to the document-upload hook directly.
- **Migration (optional):** a runner that converts Legacy_Base64_Response rows into documents.

## Architecture

```
Client submits response (with optional file)
  -> POST projects/tasks/:taskId/client-response   [Req 10]
       1. auth: requesting user is an assigned client of the task   [Req 10.2/10.4]
       2. if file present:
            a. reuse hardened DocsService upload (type + size + scan + random key)  [Req 8.1, 9.1, 9.2]
            b. create Document linked to task_id + project_id                        [Req 8.2]
            c. Document_Reference = document id (or hosted URL)
       3. upsert task_client_responses row:
            required_item, is_completed, comment,
            file_url = Document_Reference (not base64)                               [Req 8.4, 10.3]
       4. if no file: upsert response with file_url = null                           [Req 8.3]
Reads
  -> distinguish Document_Reference vs Legacy_Base64_Response                        [Req 11.3]
     - reference  -> resolve to (signed) URL / document
     - base64     -> serve as today (compat)                                         [Req 11.1]
```

## Components and Interfaces

### 1. Client-response service (Req 8, 9, 10)

New service method, e.g. `TaskClientResponseService.submitResponse(taskId, user, payload)`:

- Validates the user is an assigned client (via task client-assignees repository).
- For each response item with a file, calls a shared internal upload routine extracted from `DocsService.uploadDocument` (so validation/scan/keying is identical — no duplicated weaker path, satisfying Req 9).
- Persists via `TaskClientResponsesRepository` (upsert on `(task_id, client_id, required_item)`).
- Returns the existing `ServiceType` shape for controller/`genericResponse` parity.

To avoid circular deps, extract the file-storage core of `uploadDocument` into a reusable method (e.g. `DocsService.storeTaskFile(project_id, task_id, user, attachment, file_name)`) that both the docs upload and the client-response service call.

### 2. Document_Reference representation (Req 8.4, 11.3)

Keep `file_url` as the storage column but change its meaning for new rows to a reference. To distinguish cleanly from Legacy_Base64_Response at read time:

- **Preferred:** store the hosted document URL (starts with `http`) — trivially distinguishable from base64 (which does not start with `http`). This matches how `docs.service.ts` already tests `attachment.includes('http')`.
- **Alternative:** add a nullable `document_id` FK column to `task_client_responses` via migration; when present, it is a reference; when null with base64 in `file_url`, it is legacy. Cleaner but requires a schema change.

The URL-based approach is NO COST and needs no migration to start; the FK approach is more explicit. Recommend URL-based for the forward path, with the optional FK as a later normalization.

### 3. Backward compatibility (Req 11)

Read code checks the format of `file_url`:

- `http...` → Document_Reference → render/download as a normal document (inherits Wave 2 signed delivery if enabled).
- otherwise → Legacy_Base64_Response → keep current behavior (reconstruct/download from base64).

This dual-read keeps already-submitted data working with zero migration. A migration (Req 11.4) is optional cleanup.

### 4. Frontend decision

Two options for `client-task-view.tsx` non-upload path:

- **Option 1 (server-routed):** frontend keeps sending base64 in the response payload; the server routes it through the document path. Smallest frontend change; base64 still crosses the wire once but is never persisted as base64.
- **Option 2 (client-routed):** frontend uploads via `useUploadDocument` first (like the `document_upload` path already does), then records the response with the returned reference. Consistent with the existing document-upload task flow and avoids sending base64 to the response endpoint.

Recommend Option 2 for consistency with the already-working `document_upload` path, but Option 1 is acceptable if minimizing frontend change is preferred.

## Data Models

- No required schema change for the URL-based reference approach.
- Optional: add `document_id` (nullable, FK to `documents`) to `task_client_responses` for the explicit-reference approach (migration, still NO COST).

## Migration (Req 11.4) — optional

A standalone runner iterates Legacy_Base64_Response rows, uploads each base64 `file_url` via the shared storage routine, and replaces the value with the resulting Document_Reference. Runnable independently with the repo's migration/runner tooling; safe to defer given the dual-read support.

## Testing Strategy

- Response with file → creates a document linked to the task/project; `file_url` is a reference, not base64 (Req 8).
- Response file that violates type/size → rejected, no completed response recorded (Req 9).
- Non-assigned user → rejected (Req 10.4); assigned client → upsert succeeds (Req 10.3).
- Read of a legacy base64 row still yields a usable file (Req 11.1); read of a new reference row resolves correctly (Req 11.3).
- Regression: `document_upload` task path unchanged.

## Rollout

- **Wave 3** runs after Wave 1. It is NO COST and can ship before Wave 2; if Wave 2 is later enabled, unified files inherit restricted delivery automatically.
