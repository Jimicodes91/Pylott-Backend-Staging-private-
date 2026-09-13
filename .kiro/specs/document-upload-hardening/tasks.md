# Implementation Plan: Document Upload Hardening (Part B)

## Overview

Harden the shared document-upload path in the backend so all client file submissions can safely route through it. Tasks are grouped into two waves: **Wave 1 is entirely NO COST** and can ship immediately; **Wave 2 items MAY COST money** and are gated on the Cloudinary-tier and scanning-provider decisions. Each task carries a cost tag.

Reference: `requirements.md` and `design.md` in this spec folder. Affected code lives in `src/modules/docs`, `src/shared/utils/cloud-storage/cloudinary.ts`, `src/repositories/documents.repository.ts`, and `src/config/env.ts`.

## Tasks

### Wave 1 — No-Cost Hardening (deployable independently)

- [x] 0. Tenant-scope the document detail read — **[NO COST]**
  - `getDocumentAndAttachments` accepts optional `company_id` and filters by it; `DocsService.getDocumentDetails` forwards `company_id`; controller passes `req.user.company_id`
  - _Already applied in this session._
  - _Requirements: 6.1, 6.2_

- [ ] 1. Add upload-hardening config — **[NO COST]**
  - Add to `src/config/env.ts`: `ALLOWED_DOC_MIME_TYPES` (list), `MAX_DOC_FILE_BYTES` (number), `SIGNED_URL_ENABLED` (bool), `SIGNED_URL_TTL_SECONDS` (number), `SCANNER_PROVIDER` (`noop|clamav|api`)
  - Provide safe defaults (noop scanner, signing off) so Wave 2 stays inert until enabled
  - _Requirements: 1.4, 2.3, 5.1, 7.4_

- [ ] 2. Content-based file-type validation — **[NO COST]**
  - Add `file-type` (MIT) as a dependency
  - In `DocsService.uploadDocument`, after decoding the base64 buffer, detect the MIME from content and reject when not in `ALLOWED_DOC_MIME_TYPES` (return `{ status:false, statusCode:400 }`), before any Cloudinary call
  - Apply the same gate in `updateDocumentAttachment`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Enforce max file size — **[NO COST]**
  - In `uploadDocument` and `updateDocumentAttachment`, compute `buffer.byteLength` and reject when it exceeds `MAX_DOC_FILE_BYTES`, before upload
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 4. Randomized storage keys + non-executable delivery — **[NO COST]**
  - In `Cloudinary.upload`, generate `public_id` from a server-side UUID (namespaced by `env`/directory), stop deriving it from the client file name, set `unique_filename: true`
  - Add `flags: 'attachment'` (forced download) and constrain `resource_type` where feasible
  - Ensure the `documents.name` display value is preserved separately from the storage key
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [ ] 5. Confirm tenant scope across remaining read paths — **[NO COST]**
  - Audit attachment and document-request read paths; apply `company_id` scoping consistent with task 0
  - _Requirements: 6.3_

- [ ] 6. Checkpoint — Wave 1 tests
  - Unit tests: type allow/deny, size boundary, random key not derived from client name, attachment disposition present, cross-tenant detail read returns not-found
  - Regression: `document_upload` task auto-completion still succeeds for a valid file
  - Run the backend test suite; resolve failures before Wave 2

### Wave 2 — Cost-Gated Hardening (decide budget first)

- [ ] 7. Restricted, time-limited file access — **[MAY COST — Cloudinary plan tier]**
  - Decide Option A (Cloudinary private/authenticated + signed URLs) or Option B (authenticated proxy-download endpoint)
  - Stop exposing permanent public URLs for client-submitted files; issue expiring access when `SIGNED_URL_ENABLED`
  - _Requirements: 5.1, 5.2, 5.3_
  - _Blocked on: current Cloudinary tier confirmation_

- [ ] 8. Malware scanning behind a feature flag — **[MAY COST — scanning service/infra]**
  - Define `IFileScanner` with `NoopScanner` default; add `ClamAvScanner` and/or `ApiScanner` per chosen provider
  - Run the scan after type/size validation and before Cloudinary upload; reject and do not persist on a malicious result
  - Wire selection via `SCANNER_PROVIDER`; keep type+size as the minimum gate when scanning is off
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - _Blocked on: scanning provider + budget decision_

- [ ] 9. Checkpoint — Wave 2 tests
  - Tests: expired signed URL denies access (or proxy enforces auth); malicious-stub scanner blocks persistence; noop scanner passes through
  - Run the backend test suite

## Cost Summary

| Task | Wave | Cost |
|---|---|---|
| 0. Tenant-scope detail read (done) | 1 | NO COST |
| 1. Hardening config | 1 | NO COST |
| 2. File-type validation | 1 | NO COST |
| 3. Max file size | 1 | NO COST |
| 4. Random keys + disposition | 1 | NO COST |
| 5. Tenant scope audit | 1 | NO COST |
| 6. Wave 1 checkpoint | 1 | NO COST |
| 7. Signed/restricted access | 2 | MAY COST (Cloudinary tier) |
| 8. Malware scanning | 2 | MAY COST (service/infra) |
| 9. Wave 2 checkpoint | 2 | — |

## Notes

- Wave 1 is entirely no-cost and unblocks the security posture without waiting on budget.
- Wave 2 items are inert by default (signing off, noop scanner) so shipping Wave 1 does not silently enable a billed feature.
- Part A (routing client-response files through this hardened path) is a separate spec and should follow Wave 1 at minimum.
- Open questions to resolve before Wave 2: Cloudinary plan tier, expected upload volume, and whether a proxy-download endpoint is acceptable in place of signed URLs.

---

## Wave 3 — Part A: Unify Client-Response Files Onto the Document Path

Runs after Wave 1. All items are **[NO COST]** in software terms (files count toward existing Cloudinary quota only). Fixes the "completed-file content issue" for non-upload tasks.

- [ ] 10. Confirm the client-response endpoint status — **[NO COST]**
  - Verify whether `POST projects/tasks/:taskId/client-response` is implemented in this repo or elsewhere (investigation found a model + repository but no service/controller/route consuming them)
  - Record the finding; if implemented elsewhere, adjust the following tasks to that location
  - _Requirements: 10.1_

- [ ] 11. Extract a shared file-storage routine from the document path — **[NO COST]**
  - Refactor the storage core of `DocsService.uploadDocument` into a reusable method (e.g. `storeTaskFile(project_id, task_id, user, attachment, file_name)`) that applies Wave 1 validation/scan/keying and creates a linked Document
  - Keep `uploadDocument` behavior unchanged by having it call the extracted method
  - _Requirements: 8.1, 8.2, 9.1, 9.2_

- [ ] 12. Implement/complete the client-response service + controller + route — **[NO COST]**
  - Add a client-response service consuming `TaskClientResponsesRepository`; upsert on `(task_id, client_id, required_item)`
  - Authorize: only a client assigned to the task may submit (reject otherwise)
  - For response items with a file, call `storeTaskFile` and set `file_url` to the returned Document_Reference (hosted URL); for items with no file, set `file_url = null`
  - Register the authenticated route `POST projects/tasks/:taskId/client-response` matching the frontend contract
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.3, 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Backward-compatible read handling for legacy base64 — **[NO COST]**
  - In the read path for client responses, distinguish a Document_Reference (`http...`) from a Legacy_Base64_Response and render/download each correctly
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 14. Frontend: record a reference instead of base64 — **[NO COST]** _(frontend repo)_
  - In `client-task-view.tsx` non-upload path, prefer Option 2: upload the file via `useUploadDocument` (hardened path), then record the response with the returned reference; OR keep sending base64 and let the server route it (Option 1)
  - Update `use-update-client-response.tsx` payload typing if the contract changes
  - _Requirements: 8.1, 8.4_

- [x]* 15. Optional migration of legacy base64 rows — **[NO COST]**
  - Standalone runner: for each Legacy_Base64_Response, validate + upload the base64 via the Cloudinary uploader, create a linked `documents`/`attachments` record, and replace `file_url` with the hosted reference
  - Runnable independently; safe to defer thanks to dual-read (task 13)
  - Implemented at `scripts/migrate-client-response-files.ts`. Idempotent (skips already-hosted rows), supports `--dry-run` and `--limit=N`.
  - Run: `npx ts-node -r reflect-metadata -r dotenv/config -r tsconfig-paths/register scripts/migrate-client-response-files.ts --dry-run` (inspect), then without `--dry-run` to apply.
  - Verified via dry-run against staging (DB `defaultdb`): connects and queries cleanly; found 0 legacy base64 rows to migrate at that time.
  - _Requirements: 11.4_

- [ ] 16. Checkpoint — Wave 3 tests
  - Response with file creates a linked document and stores a reference (not base64); type/size violations rejected; non-assigned user rejected; legacy base64 read still works; `document_upload` path unregressed
  - Run the backend test suite

## Updated Cost Summary (all waves)

| Task | Wave | Cost |
|---|---|---|
| 0–6 | 1 | NO COST |
| 7. Signed/restricted access | 2 | MAY COST (Cloudinary tier) |
| 8. Malware scanning | 2 | MAY COST (service/infra) |
| 10–16. Part A unification | 3 | NO COST |

## Dependency Notes

- Wave 3 depends on Wave 1 (files must land on an already-hardened path).
- Wave 3 is independent of Wave 2; if Wave 2 is enabled later, unified client-response files inherit restricted delivery automatically.
- Task 14 is the only frontend-repo task; the rest of Wave 3 is backend.
