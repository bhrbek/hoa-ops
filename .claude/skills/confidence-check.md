# /confidence-check - 95% Confidence Verification

Enforce the 95% confidence rule before making code changes.

## Usage
```
/confidence-check
```

## Pre-Change Checklist

### 1. ROOT CAUSE ANALYSIS
- [ ] Can you explain WHY this is failing, not just WHERE?
- [ ] Have you traced the full code path (client → server action → database)?
- [ ] Have you verified at the database layer with `/debug-rls`?
- [ ] Is this the root cause, or just a symptom?

### 2. EVIDENCE GATHERED
- [ ] Read all relevant source files
- [ ] Checked RLS policies if auth-related
- [ ] Tested with debug API/script
- [ ] Reviewed recent commits for related changes
- [ ] Checked for similar patterns elsewhere in codebase

### 3. CHANGE IMPACT
- [ ] Will this fix break anything else?
- [ ] Are there other places with the same pattern?
- [ ] Does this require a database migration?
- [ ] Will this affect other users/teams?

### 4. VERIFICATION PLAN
- [ ] How will you verify the fix worked?
- [ ] What logs/output should you check?
- [ ] Do you need to test in production specifically?

## Confidence Score

| Level | Meaning |
|-------|---------|
| 95%+ | Proceed with change |
| 80-94% | Gather more evidence first |
| <80% | Stop - investigate further |

## If Below 95%

1. **Add debug logging** to trace execution
2. **Run `/debug-rls`** to verify database access
3. **Check deployment** with `/check-deploy`
4. **Read more code** - don't assume
5. **Test in isolation** before full deploy

## Anti-Patterns to Avoid

- Fixing symptoms without understanding cause
- Making multiple speculative changes
- Skipping database verification
- Not checking if fix is actually deployed
