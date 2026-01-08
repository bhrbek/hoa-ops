# /commit - Safe Git Commits

Create well-formatted git commits following project conventions.

## Usage
```
/commit          # Interactive commit
/commit "msg"    # Quick commit with message
```

## Pre-Commit Checklist

Before committing, verify:

1. **Build passes**
   ```bash
   npm run build
   ```

2. **Tests pass**
   ```bash
   npm run test:run
   ```

3. **Lint passes**
   ```bash
   npm run lint
   ```

4. **Version updated** (for releases)
   ```bash
   echo "YYYYMMDD-vN" > VERSION
   ```

## Commit Message Format

```
<type>: <short description>

<optional body - what and why>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code change that neither fixes nor adds
- `docs:` - Documentation only
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

### Examples
```
feat: Add key results to Rocks page

fix: Resolve RLS circular dependency in team_memberships

refactor: Rename build_signals to key_results

test: Add modal component tests for CreateRockDialog
```

## Git Commands

### Stage and commit
```bash
git add .
git commit -m "feat: Description here"
```

### Amend last commit (before push)
```bash
git commit --amend -m "New message"
```

### View what will be committed
```bash
git status
git diff --staged
```

## Project Rules

From CLAUDE.md:
- **NEVER** add "Generated with Claude Code" attribution
- **NEVER** add "Co-Authored-By: Claude" to commits
- Commit messages describe changes, not who made them

## After Committing

```bash
# Push to remote
git push

# Verify deployment (after push to main)
./scripts/check-deploy.sh
```
