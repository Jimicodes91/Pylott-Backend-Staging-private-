#!/bin/bash
# ============================================================
# PYLOTT BACKEND - STAGING DEPLOYMENT SCRIPT
# ============================================================
# Run from: Pylott-Backend directory
# Target branch: v1 (staging)
# Current branch: main
#
# PREREQUISITES:
#   1. All local changes committed to main
#   2. Staging env vars set on hosting platform
#   3. Staging DB accessible
# ============================================================

set -e  # Exit on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  PYLOTT BACKEND - STAGING DEPLOYMENT${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ---- STEP 0: Pre-flight checks ----
echo -e "${YELLOW}[STEP 0] Pre-flight checks...${NC}"

CURRENT_BRANCH=$(git branch --show-current)
echo "  Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo -e "${RED}  WARNING: You have uncommitted changes!${NC}"
    echo ""
    git status --short
    echo ""
    read -p "  Do you want to commit them first? (y/n): " COMMIT_CHOICE
    if [ "$COMMIT_CHOICE" = "y" ]; then
        read -p "  Commit message: " COMMIT_MSG
        git add -A
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}  Changes committed.${NC}"
    else
        echo -e "${YELLOW}  Proceeding without committing (changes will NOT be deployed).${NC}"
        echo -e "${YELLOW}  Only committed changes on main will be merged to v1.${NC}"
        read -p "  Continue? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            echo "  Aborted."
            exit 1
        fi
    fi
fi

echo ""

# ---- STEP 1: Fetch latest ----
echo -e "${YELLOW}[STEP 1] Fetching latest from origin...${NC}"
git fetch origin
echo -e "${GREEN}  Done.${NC}"
echo ""

# ---- STEP 2: Switch to v1 and merge main ----
echo -e "${YELLOW}[STEP 2] Switching to v1 branch and merging main...${NC}"
git checkout v1
git pull origin v1
echo ""
echo "  Merging main into v1..."
git merge main --no-edit
echo -e "${GREEN}  Merge complete.${NC}"
echo ""

# ---- STEP 3: Verify migrations ----
echo -e "${YELLOW}[STEP 3] Checking migrations to run...${NC}"
echo ""
echo "  New migrations that will run on staging DB:"
echo "  ─────────────────────────────────────────────"
echo "  1. 20260306000000 - Add 'order' column to milestones"
echo "  2. 20260306000001 - Add 'api_locator' to project_form_fields"
echo "  3. 20260314000001 - Add task_category, required_information, additional_info to project_tasks"
echo "  4. 20260314000002 - Create task_client_assignees table"
echo "  5. 20260314000003 - Create task_client_responses table"
echo ""
echo -e "${YELLOW}  NOTE: Run migrations on staging DB BEFORE deploying:${NC}"
echo "    npm run db:migrate"
echo ""
echo -e "${YELLOW}  Or if connecting to remote staging DB:${NC}"
echo "    DB_HOST=<staging-host> DB_DATABASE=<staging-db> DB_USERNAME=<user> DB_PASSWORD=<pass> DB_PORT=3306 npm run db:migrate"
echo ""

read -p "  Have you run migrations on staging DB? (y/n/skip): " MIGRATE_CHOICE
if [ "$MIGRATE_CHOICE" = "n" ]; then
    echo ""
    echo -e "${YELLOW}  Please run migrations first, then re-run this script.${NC}"
    echo "  Switching back to $CURRENT_BRANCH..."
    git checkout "$CURRENT_BRANCH"
    exit 1
fi
echo ""

# ---- STEP 4: Push to v1 ----
echo -e "${YELLOW}[STEP 4] Pushing v1 to origin (triggers staging deploy)...${NC}"
read -p "  Ready to push? This will trigger staging deployment. (y/n): " PUSH_CHOICE
if [ "$PUSH_CHOICE" != "y" ]; then
    echo "  Aborted. You're still on v1 branch."
    echo "  To push manually later: git push origin v1"
    exit 0
fi

git push origin v1
echo -e "${GREEN}  Pushed to origin/v1 successfully!${NC}"
echo ""

# ---- STEP 5: Switch back ----
echo -e "${YELLOW}[STEP 5] Switching back to $CURRENT_BRANCH...${NC}"
git checkout "$CURRENT_BRANCH"
echo -e "${GREEN}  Back on $CURRENT_BRANCH.${NC}"
echo ""

# ---- STEP 6: Post-deploy checklist ----
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  BACKEND DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}  POST-DEPLOY CHECKLIST:${NC}"
echo ""
echo "  [ ] Verify staging backend starts (check logs for entrypoint errors)"
echo "  [ ] Check: GET https://staging-api.pylott.io/ returns 'Welcome to Pylott'"
echo "  [ ] Verify all route modules registered (check for '[ENTRYPOINT]' logs)"
echo "  [ ] Test login endpoint works"
echo ""
echo -e "${YELLOW}  STAGING ENV VARS (verify these are set):${NC}"
echo ""
echo "  FRONTEND_URL=https://staging.pylott.io"
echo "  GOOGLE_CLIENT_ID=64137840102-tduveel440afs5eo78nkt95f5dr18na7.apps.googleusercontent.com"
echo "  GOOGLE_CLIENT_SECRET=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"
echo "  JWT_SECRET=<staging-specific-secret>"
echo "  SENDGRID_API_KEY=<same-as-prod>"
echo "  NODE_ENV=staging"
echo ""
echo -e "${GREEN}  Done! Now deploy the frontend.${NC}"
