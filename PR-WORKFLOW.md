# PR Workflow: v1 Branch as Staging Environment

## Summary
This PR establishes a new Git workflow where:
- All feature/bugfix PRs should target the `v1` branch (acting as staging)
- Only changes from `v1` branch should be merged to `main` (production)
- All PRs must pass CI checks before merging
- All PRs require detailed descriptions

## Description
To improve our deployment stability and code quality, we're implementing a more structured PR workflow. The `v1` branch will now serve as our staging environment, allowing us to test changes before they reach production.

## New PR Requirements
1. **Branch Targeting**:
   - Feature/bugfix branches → `v1` branch
   - `v1` branch → `main` branch

2. **CI Requirements**:
   - All automated tests must pass
   - Code quality checks must pass
   - No breaking changes detected

3. **PR Description Requirements**:
   - Clear explanation of changes
   - Link to relevant issue(s)
   - Testing details
   - Screenshots/videos for UI changes
   - Any deployment considerations
   
## Implementation Details
- Updated branch protection rules for `v1` and `main`

