---
inclusion: auto
---

# Enum ↔ DB ↔ Frontend Alignment Rules

All string constants shared between frontend, backend, and DB MUST use **lowercase** values. JavaScript comparisons are case-sensitive — `'CLIENT' !== 'client'`.

## Single Source of Truth
- Backend enums in `src/shared/enums/index.ts` define the canonical values.
- DB column enums must match those values exactly.
- Frontend must compare using lowercase (or use `.toLowerCase()` when comparing API responses).

## Current DB enum definitions
```sql
-- users.role
enum('super_admin','admin','consultant','client')

-- contacts.status
enum('uninvited','invited','active')

-- invitations.status
enum('PENDING','ACCEPTED','EXPIRED')  -- exception: this one is uppercase in DB
```

## Rules
1. When adding a new enum value, update ALL THREE: TypeScript enum → DB migration → frontend constants.
2. Never hardcode string literals for roles/statuses — always reference the enum or a shared constant.
3. When writing `switch` or `if` comparisons on the frontend against API data, always use lowercase: `case "client"` not `case "CLIENT"`.
4. Backend code must never pass `deleted_at: null` to `findOne()` — `BaseRepository` already adds `whereNull('deleted_at')`. Passing it as a property generates `WHERE deleted_at = NULL` which never matches in SQL.
5. When the frontend sends a role or status to the backend, the backend should normalize it: `value.toLowerCase()` before comparing or storing.
