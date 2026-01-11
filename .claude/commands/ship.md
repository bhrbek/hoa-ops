---
allowed-tools: Read, Write, Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git log:*), Bash(cat VERSION), Bash(npm run test:run), Bash(npm run build)
description: Version bump, commit, and push changes
---

# Ship Command

Automates versioning, committing, and pushing code changes.

## Usage

When the user says `/ship` or asks to "ship", "deploy", or "push" changes:

## Steps

### 1. Check for uncommitted changes
```bash
git status --short
```

If no changes, inform user and exit.

### 2. Read current version
Read the `VERSION` file at project root.

Format: `YYYYMMDD-vN` (e.g., `20260111-v1`)

### 3. Increment version
- If today's date matches the version date: increment the version number
  - Example: `20260111-v1` → `20260111-v2`
- If today's date is different: reset to v1 with new date
  - Example: `20260108-v5` → `20260111-v1`

### 4. Update VERSION file
Write the new version to the `VERSION` file.

### 5. Run tests and build
```bash
npm run test:run && npm run build
```

If tests or build fail, stop and report the error. Do not commit broken code.

### 6. Stage all changes
```bash
git add -A
```

### 7. Create commit
Ask user for a brief description of the changes, then commit with format:
```
<description> (YYYYMMDD-vN)
```

Example: `Fix security issues from code review (20260111-v2)`

### 8. Push to remote
```bash
git push
```

### 9. Confirm deployment
Tell the user:
- The new version number
- That they should see the version in the app footer after Vercel deploys (~1-2 min)
- Remind them to push any pending Supabase migrations if applicable

## Important

- Always read the CURRENT version from the VERSION file first
- Other agents may have pushed versions, so always read before incrementing
- The VERSION file is read by next.config.ts and injected as NEXT_PUBLIC_APP_VERSION
- Version displays in bottom-right corner of the app (click to copy)
