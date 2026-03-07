# Database Setup Quick Start Guide

This guide will help you quickly set up the database for the Pylot Platform Enhancement project.

## Prerequisites

- MySQL 8.0+ installed and running
- Node.js 17+ installed
- Git repository cloned

## Step-by-Step Setup

### 1. Create MySQL Database

```sql
CREATE DATABASE pylott_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Environment Variables

Create a `.env` file in the `Pylott-Backend` directory:

```bash
cd Pylott-Backend
cp .env.example .env
```

Edit `.env` and set your database credentials:

```env
# Database Configuration
DB_CLIENT=mysql2
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=pylott_db
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password

# JWT Secret
JWT_SECRET=your_secure_random_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (for development, use Mailtrap or similar)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
SMTP_SENDER=noreply@pylott.io
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
npm run db:migrate
```

Expected output:
```
Batch 1 run: 10 migrations
✅ 20250120000000_create_workspaces_table.ts
✅ 20250120000001_alter_users_table_add_workspace_fields.ts
✅ 20250120000002_create_user_permissions_table.ts
✅ 20250120000003_alter_contacts_table_add_workspace_and_status.ts
✅ 20250120000004_create_contact_invites_table.ts
✅ 20250120000005_alter_project_tasks_table.ts
✅ 20250120000006_alter_projects_table_add_client_contact.ts
✅ 20250120000007_create_notifications_table.ts
✅ 20250120000008_create_audit_logs_table.ts
✅ 20250120000009_create_security_logs_table.ts
```

### 5. Verify Schema

```bash
npm run db:verify
```

This will check that all tables and columns are created correctly.

### 6. Run Seeds (Optional)

```bash
npm run db:seed
```

This will populate:
- Default journeys (Business Setup, Relocation, Compliance)
- Default task types (Document Upload, Review, Approval, Meeting, Follow-up)

## What Was Created?

### New Tables

1. **workspaces** - Multi-tenant workspace management
2. **user_permissions** - Granular user permissions
3. **contact_invites** - Client invitation workflow
4. **notifications** - In-app notification system
5. **audit_logs** - Action audit trail
6. **security_logs** - Security event logging

### Modified Tables

1. **users** - Added workspace_id, status, is_primary_admin, deactivation tracking
2. **contacts** - Added workspace_id, status, user_id, invitation tracking, closed_projects
3. **project_tasks** - Added visibility, document_url, renamed end_date to due_date, removed start_date
4. **projects** - Added client_contact_id, notes

### Indexes Added

- users: workspace_id, role, status
- contacts: workspace_id, status, user_id, email
- contact_invites: token (unique), contact_id, expires_at, status
- project_tasks: visibility
- projects: client_contact_id
- notifications: user_id, (user_id, read_at) composite

## Troubleshooting

### Error: "Access denied for user"

Check your MySQL credentials in `.env` file.

### Error: "Unknown database"

Create the database first:
```sql
CREATE DATABASE pylott_db;
```

### Error: "Table already exists"

If you have existing tables, you may need to:
1. Backup your data
2. Drop the database and recreate it
3. Or manually run specific migrations

### Error: "Cannot add foreign key constraint"

Ensure migrations run in order. If you have existing data, it must be compatible with the new schema.

## Next Steps

After successful migration:

1. ✅ Start the backend server: `npm run dev`
2. ✅ Test database connection
3. ✅ Proceed with implementing authentication endpoints (Task 2)
4. ✅ Test signup flow with workspace creation

## Useful Commands

```bash
# Check migration status
npm run knex -- migrate:status

# Rollback last migration batch
npm run db:migrate:rollback

# Create new migration
npm run db:migrate:make migration_name

# Create new seed
npm run db:seed:make seed_name

# Verify schema
npm run db:verify
```

## Database Connection Test

You can test the database connection with this simple script:

```typescript
// test-db.ts
import knex from 'knex';
import config from './knexfile';

const db = knex(config);

async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful!');
    await db.destroy();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run with: `ts-node -r dotenv/config test-db.ts`

## Support

If you encounter issues:

1. Check the detailed [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Verify your MySQL version: `mysql --version` (should be 8.0+)
3. Check MySQL is running: `mysql -u root -p`
4. Review migration logs in the console output

## Schema Diagram

```
workspaces
    ↓ (1:N)
users ←→ user_permissions
    ↓ (1:N)
contacts ←→ contact_invites
    ↓ (1:N)
projects
    ↓ (1:N)
project_tasks ←→ task_assignees
    ↓ (1:N)
notifications
```

All tables are linked through workspace_id for multi-tenancy support.
