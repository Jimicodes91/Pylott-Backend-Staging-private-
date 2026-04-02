---
inclusion: auto
---

# Migration Safety Rules

## NEVER do in migrations:
- DELETE or TRUNCATE existing data rows (projects, contacts, tasks, users, etc.)
- DROP tables that contain user data
- Remove columns that existing code reads from
- Use CASCADE DELETE on foreign keys pointing to tables with user data
- Write "cleanup" migrations that delete records based on business logic

## ALWAYS do in migrations:
- Only CREATE new tables or ADD new columns (additive changes)
- Make new columns NULLABLE with defaults so existing rows aren't broken
- Use application-layer data mapping (like normalizeTaskStatus) instead of data migrations
- Test migrations on a copy of staging data before running on staging
- Back up the database before running migrations on staging/production

## Before running `knex migrate:latest` on staging:
1. Check which migrations are pending: `knex migrate:status`
2. Review each pending migration file for any DELETE, DROP, or TRUNCATE statements
3. If any destructive operations exist, flag them and get approval before running

## Migration naming convention:
- `YYYYMMDD000000_create_<table>_table.ts` — new tables only
- `YYYYMMDD000000_alter_<table>_<description>.ts` — additive column changes only
- NEVER name a migration `cleanup_*` or `fix_*` if it deletes data
