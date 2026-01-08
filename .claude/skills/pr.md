# /pr - Create Pull Request

Create a well-formatted GitHub pull request.

## Usage
```
/pr              # Create PR from current branch
/pr draft        # Create as draft PR
```

## Pre-PR Checklist

1. **All changes committed**
   ```bash
   git status  # Should be clean
   ```

2. **Branch pushed to remote**
   ```bash
   git push -u origin <branch-name>
   ```

3. **Build passes**
   ```bash
   npm run build
   ```

4. **Tests pass**
   ```bash
   npm run test:run
   ```

## Creating PR via CLI

```bash
gh pr create --title "feat: Description" --body "$(cat <<'EOF'
## Summary
- Change 1
- Change 2

## Test plan
- [ ] Verify X works
- [ ] Check Y behavior

EOF
)"
```

### Draft PR
```bash
gh pr create --draft --title "WIP: Description" --body "Work in progress"
```

## PR Template

```markdown
## Summary
<1-3 bullet points describing the change>

## Test plan
- [ ] Manual testing completed
- [ ] Unit tests pass (`npm run test:run`)
- [ ] Build succeeds (`npm run build`)

## Screenshots
<if UI changes>
```

## After PR Created

1. **Request review** (if needed)
   ```bash
   gh pr edit --add-reviewer <username>
   ```

2. **Check CI status**
   ```bash
   gh pr checks
   ```

3. **Merge when ready**
   ```bash
   gh pr merge --squash
   ```

## PR Best Practices

- Keep PRs focused on single concern
- Include screenshots for UI changes
- Link related issues: `Fixes #123`
- Respond to review comments promptly
