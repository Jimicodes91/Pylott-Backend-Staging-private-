# Database Migration Guide

This guide explains how to run the database migrations for the Pylot Platform Enhancement project.

## Prerequisites

1. MySQL 8.0+ installed and running
2. Database created (e.g., `pylott_db`)
3. `.env` file configured with database credentials:
   ```
   DB_CLIENT=mysql2
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=pylott_db
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

## Migration Files Overview

The following migrations have been created for the platform enhancement:

### New Tables

1. **20250120000000_create_workspaces_table.ts**
   - Creates `workspaces` table for multi-tenancy
   - Fields: id, name, status, timestamps

2. **20250120000002_create_user_permissions_table.ts**
   - Creates `user_permissions` table for granular permissions
   - Fields: id, user_id, permission_key, granted_at, granted_by
   - Unique constraint on (user_id, permission_key)

3. **20250120000004_create_contact_invites_table.ts**
   - Creates `contact_invites` table for invitation workflow
   - Fields: id, contact_id, token, status, expires_at, invited_by, approved_by, custom_message, timestamps

4. **20250120000007_create_notifications_table.ts**
   - Creates `notifications` table for in-app notifications
   - Fields: id, user_id, type, title, message, link, read_at, created_at
   - Composite index on (user_id, read_at) for unread queries

5. **20250120000008_create_audit_logs_table.ts**
   - Creates `audit_logs` table for action tracking
   - Fields: id, workspace_id, user_id, action, entity_type, entity_id, details, created_at

6. **20250120000009_create_security_logs_table.ts**
   - Creates `security_logs` table for security event tracking
   - Fields: id, event_type, user_id, ip_address, user_agent, details, created_at

### Table Modifications

1. **20250120000001_alter_users_table_add_workspace_fields.ts**
   - Adds workspace_id (foreign key to workspaces)
   - Adds status enum ('active', 'deactivated', 'invited')
   - Adds is_primary_admin boolean
   - Adds deactivated_at and deactivated_by fields
   - Adds indexes on workspace_id, role, status

2. **20250120000003_alter_contacts_table_add_workspace_and_status.ts**
   - Adds workspace_id (foreign key to workspaces)
   - Adds status enum ('uninvited', 'invited', 'active')
   - Adds user_id (foreign key to users, nullable)
   - Adds invited_at and invited_by fields
   - Adds closed_projects counter
   - Converts active_projects and total_projects from string to integer
   - Adds indexes on workspace_id, status, user_id

3. **20250120000005_alter_project_tasks_table.ts**
   - Adds visibility enum ('inhouse', 'client_facing')
   - Adds document_url field
   - Adds task_type_id field
   - Renames end_date to due_date
   - Drops start_date column
   - Makes description nullable
   - Updates status enum to only ('pending', 'completed')
   - Adds index on visibility

4. **20250120000006_alter_projects_table_add_client_contact.ts**
   - Adds client_contact_id (foreign key to contacts)
   - Adds notes field
   - Adds index on client_contact_id

## Running Migrations

### Step 1: Install Dependencies

```bash
cd Pylott-Backend
npm install
```

### Step 2: Run All Migrations

```bash
npm run db:migrate
```

This will run all pending migrations in order.

### Step 3: Verify Migrations

Check the `knex_migrations` table to see which migrations have been run:

```sql
SELECT * FROM knex_migrations ORDER BY id DESC;
```

### Step 4: Run Seeds (Optional)

After migrations, you can seed default data:

```bash
npm run db:seed
```

This will:
- Create default journeys (Business Setup, Relocation, Compliance) for all workspaces
- Create default task types (Document Upload, Review, Approval, Meeting, Follow-up) for all workspaces

## Rollback Migrations

If you need to rollback the last batch of migrations:

```bash
npm run db:migrate:rollback
```

To rollback all migrations:

```bash
npm run db:migrate:rollback --all
```

## Database Schema Verification

After running migrations, verify the schema:

```sql
-- Check workspaces table
DESCRIBE workspaces;

-- Check users table modifications
DESCRIBE users;
SHOW INDEX FROM users;

-- Check user_permissions table
DESCRIBE user_permissions;

-- Check contacts table modifications
DESCRIBE contacts;
SHOW INDEX FROM contacts;

-- Check contact_invites table
DESCRIBE contact_invites;
SHOW INDEX FROM contact_invites;

-- Check project_tasks table modifications
DESCRIBE project_tasks;
SHOW INDEX FROM project_tasks;

-- Check projects table modifications
DESCRIBE projects;
SHOW INDEX FROM projects;

-- Check notifications table
DESCRIBE notifications;
SHOW INDEX FROM notifications;

-- Check audit_logs table
DESCRIBE audit_logs;

-- Check security_logs table
DESCRIBE security_logs;
```

## Expected Indexes

The following indexes should be created for performance:

### Users Table
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `workspace_id`
- INDEX on `role`
- INDEX on `status`

### Contacts Table
- PRIMARY KEY on `id`
- INDEX on `email`
- INDEX on `workspace_id`
- INDEX on `status`
- INDEX on `user_id`

### Contact Invites Table
- PRIMARY KEY on `id`
- UNIQUE INDEX on `token`
- INDEX on `contact_id`
- INDEX on `expires_at`
- INDEX on `status`

### Project Tasks Table
- PRIMARY KEY on `id`
- INDEX on `project_id`
- INDEX on `visibility`

### Projects Table
- PRIMARY KEY on `id`
- INDEX on `client_contact_id`

### Notifications Table
- PRIMARY KEY on `id`
- INDEX on `user_id`
- COMPOSITE INDEX on `(user_id, read_at)`
- INDEX on `created_at`

## Troubleshooting

### Migration Fails with "Table already exists"

If a migration fails because a table already exists, you can:

1. Check which migrations have been run:
   ```sql
   SELECT * FROM knex_migrations;
   ```

2. Manually mark a migration as run (if you're sure the table exists):
   ```sql
   INSERT INTO knex_migrations (name, batch, migration_time) 
   VALUES ('20250120000000_create_workspaces_table.ts', 1, NOW());
   ```

### Foreign Key Constraint Errors

If you get foreign key constraint errors:

1. Ensure migrations run in the correct order (they are numbered sequentially)
2. Check that referenced tables exist before creating foreign keys
3. Verify that the referenced columns have the correct data type

### Enum Value Errors

If you get errors about enum values:

1. Check existing data in the table
2. Update existing data to match new enum values before running migration
3. For the `users.role` field, map existing values:
   - `SUPER_ADMIN` → `super_admin`
   - `ADMIN` → `admin`
   - `CONSULTANT` → `consultant`
   - `CLIENT` → `client`

### Data Type Conversion Errors

For the contacts table conversion of `active_projects` and `total_projects` from string to integer:

1. Ensure all existing values are numeric or NULL
2. Update any non-numeric values before running the migration:
   ```sql
   UPDATE contacts SET active_projects = 0 WHERE active_projects IS NULL OR active_projects = '';
   UPDATE contacts SET total_projects = 0 WHERE total_projects IS NULL OR total_projects = '';
   ```

## Next Steps

After successfully running migrations:

1. Verify all tables and indexes are created correctly
2. Run seed files to populate default data
3. Test database connections from the backend application
4. Proceed with implementing backend services and endpoints

## Additional Commands

### Create a new migration

```bash
npm run db:migrate:make migration_name
```

### Create a new seed file

```bash
npm run db:seed:make seed_name
```

### Check migration status

```bash
npm run knex -- migrate:status
```

## Notes

- All migrations use UUID for primary keys
- Timestamps are automatically managed by Knex (created_at, updated_at)
- Foreign keys use CASCADE or SET NULL on delete depending on the relationship
- All string fields have appropriate length limits for performance
- Indexes are strategically placed on frequently queried columns
- The migrations are designed to be idempotent where possible
