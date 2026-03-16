# Staging Deployment Checklist

## Pre-Deploy

### 1. Commit all local changes
```bash
# Backend (on main branch)
cd Pylott-Backend
git add -A
git commit -m "feat: all enhancements for staging deploy"

# Frontend (on dev branch)
cd Pylott-Web-App
git add -A
git commit -m "feat: all enhancements for staging deploy"
```

### 2. Set staging env vars on hosting platform

**Backend env vars:**
```env
NODE_ENV=staging
FRONTEND_URL=https://staging.pylott.io
GOOGLE_CLIENT_ID=64137840102-tduveel440afs5eo78nkt95f5dr18na7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=<generate-a-new-staging-secret>
SENDGRID_API_KEY=<same-as-prod>
DB_HOST=<staging-db-host>
DB_DATABASE=<staging-db-name>
DB_USERNAME=<staging-db-user>
DB_PASSWORD=<staging-db-password>
DB_PORT=3306
DB_CLIENT=mysql2
CLOUDINARY_CLOUD_NAME=<same-as-prod>
CLOUDINARY_API_KEY=<same-as-prod>
CLOUDINARY_API_SECRET=<same-as-prod>
```

**Frontend env vars (on hosting platform, NOT in .env file):**
```env
VITE_API_BASE_URL=https://staging-api.pylott.io/api/v1
```

### 3. Google OAuth test users
Go to Google Cloud Console → pylott-staging project → OAuth consent screen → Test users.
Add all team Gmail addresses that need to test Google login.

---

## Deploy Order

### Step 1: Run migrations on staging DB
```bash
cd Pylott-Backend
# Option A: If you have staging DB env vars locally
DB_HOST=<host> DB_DATABASE=<db> DB_USERNAME=<user> DB_PASSWORD=<pass> DB_PORT=3306 npm run db:migrate

# Option B: If staging env vars are in a .env.staging file
cp .env .env.local.backup
cp .env.staging .env
npm run db:migrate
cp .env.local.backup .env
```

**Migrations that will run:**
1. `20260306000000` — Add `order` to milestones
2. `20260306000001` — Add `api_locator` to project_form_fields
3. `20260314000001` — Add `task_category`, `required_information`, `additional_info` to project_tasks
4. `20260314000002` — Create `task_client_assignees` table
5. `20260314000003` — Create `task_client_responses` table

### Step 2: Deploy backend
```bash
cd Pylott-Backend
./deploy-to-staging.sh
```

### Step 3: Verify backend
- Check hosting logs for `[ENTRYPOINT] Route registration complete`
- Hit the root endpoint to confirm it's alive

### Step 4: Deploy frontend
```bash
cd Pylott-Web-App
./deploy-to-staging.sh
```

### Step 5: Verify frontend
- Open https://staging.pylott.io
- Check browser console for errors

---

## Post-Deploy Smoke Test

| # | Test | Expected |
|---|------|----------|
| 1 | Open staging.pylott.io | Page loads, login screen shows |
| 2 | Login with email/password | Dashboard loads, no 500 error |
| 3 | Check sidebar order | Home → Projects → Admin → Tasks → Contact → Billing |
| 4 | Go to Admin → Task tab | Task types list shows |
| 5 | Click "Create Task" from Admin | Goes to task type selector |
| 6 | Create internal task | Form works, back button goes to /admin?selectedTab=task |
| 7 | Create external task from project | Form works, back goes to project |
| 8 | View project milestones | SVG arrow shapes render correctly |
| 9 | Open /notifications | Notifications page loads |
| 10 | Switch organization | Org switch works, data changes |
| 11 | Login as client role | Client dashboard loads |
| 12 | Client views task detail | /tasks/:projectId/:taskId works |
| 13 | Check responsive layout | Pages work on mobile/tablet widths |
| 14 | Create a contact | Contact form works |
| 15 | Check email delivery | Task creation triggers email (check SendGrid) |

---

## Rollback Plan

If something breaks:

```bash
# Backend: revert v1 to previous commit
cd Pylott-Backend
git checkout v1
git reset --hard HEAD~1
git push origin v1 --force
git checkout main

# Frontend: revert v1 to previous commit
cd Pylott-Web-App
git checkout v1
git reset --hard HEAD~1
git push origin v1 --force
git checkout dev
```

**Database rollback** (if migrations caused issues):
```bash
cd Pylott-Backend
# This rolls back the last batch of migrations
DB_HOST=<host> DB_DATABASE=<db> DB_USERNAME=<user> DB_PASSWORD=<pass> npm run db:migrate:rollback
```

---

## Known Considerations

1. **JWT tokens**: Existing staging users will have old JWT tokens without `company_id`. They'll need to re-login after deploy.
2. **Role casing**: DB may have lowercase roles. Frontend normalizes to uppercase. Backend comparisons are case-insensitive.
3. **Deleted migrations**: 8 old duplicate migration files were removed. Rollback for those specific migrations won't work.
4. **Google OAuth**: App is in "Testing" mode — only added test users can use Google login.
5. **SendGrid**: Using same prod API key. Staging emails count toward the same monthly quota.
6. **sonner package**: Frontend added `sonner` toast library. `npm install` runs during build.
