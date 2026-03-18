# Staging Smoke Test Checklist

Run through this after every deploy to staging. If any step fails, the deploy is broken.

## Auth Flow
- [ ] Go to https://pylott-staging-frontend.onrender.com
- [ ] Sign up with a new workspace (name, email, workspace name, password)
- [ ] Verify redirect to onboarding page
- [ ] Complete onboarding (skip or invite team)
- [ ] Verify redirect to /home (dashboard)
- [ ] Log out
- [ ] Log back in with the same credentials
- [ ] Verify redirect to /home after login

## Dashboard (/home)
- [ ] Page loads without "Error loading data"
- [ ] Project report cards show (even if 0)
- [ ] Task report widget shows
- [ ] Most recent projects section shows (empty is fine)
- [ ] Top clients section shows
- [ ] Top pipeline section shows

## Projects (/projects)
- [ ] Navigate to Projects page
- [ ] Page loads without errors
- [ ] "Create Project" button visible
- [ ] Create a new project (fill required fields)
- [ ] Verify project appears in list
- [ ] Click into project details
- [ ] Verify project details page loads

## Tasks (/task)
- [ ] Navigate to Tasks page
- [ ] Page loads without errors
- [ ] Create a task within a project
- [ ] Verify task appears in task list
- [ ] Change task status (pending → in_progress → completed)
- [ ] Verify status updates persist

## Contacts (/contact)
- [ ] Navigate to Contacts page
- [ ] Page loads without errors
- [ ] Create a new contact
- [ ] Verify contact appears in list
- [ ] Edit contact details
- [ ] Verify edits persist

## Admin (/admin)
- [ ] Navigate to Admin page
- [ ] Page loads without errors
- [ ] Verify Journey/Pipeline tab loads
- [ ] Create or view a project type (journey)
- [ ] Verify Team tab loads
- [ ] Invite a team member (check email delivery)

## Finance (/finance)
- [ ] Navigate to Finance page
- [ ] Page loads without errors
- [ ] Verify invoices section loads (empty is fine)

## Profile & Settings
- [ ] Click profile/avatar
- [ ] Verify profile page loads
- [ ] Update a profile field
- [ ] Verify update persists after refresh

## Navigation & General
- [ ] Sidebar links all navigate correctly (no blank pages)
- [ ] Refresh on any sub-route loads correctly (no blank page)
- [ ] Log out and verify redirect to login
- [ ] Verify no console errors on any page (open DevTools)
- [ ] Test on mobile viewport (responsive layout)

## Post-Deploy Verification
- [ ] Backend health check: `curl https://pylott-staging-backend.onrender.com/api/v1/health`
- [ ] Frontend loads: `https://pylott-staging-frontend.onrender.com`
- [ ] No CORS errors in browser console
- [ ] API calls return proper JSON (not HTML error pages)
