# /lint - Code Quality Checks

Run ESLint to catch code quality issues and enforce consistency.

## Usage
```
/lint            # Check all files
/lint fix        # Auto-fix issues
/lint [path]     # Check specific path
```

## Commands

### Check All Files
```bash
npm run lint
```

### Auto-Fix Issues
```bash
npm run lint -- --fix
```

### Check Specific Directory
```bash
npx eslint src/app/actions/
npx eslint src/components/climb/
```

## Common Lint Rules

| Rule | What it catches |
|------|-----------------|
| `@typescript-eslint/no-explicit-any` | Using `any` type (disabled in actions) |
| `@typescript-eslint/no-unused-vars` | Unused variables |
| `react-hooks/rules-of-hooks` | Invalid hook usage |
| `react-hooks/exhaustive-deps` | Missing useEffect dependencies |
| `@next/next/no-img-element` | Using `<img>` instead of `<Image>` |

## Suppressing Lint Errors

### File-level disable
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Line-level disable
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unusedVar = 'needed for type inference'
```

### In server actions (already configured)
Server actions use `(supabase as any)` due to Supabase client typing limitations. This is intentional.

## Pre-Commit

Run before committing:
```bash
npm run lint && npm run build && npm run test:run
```
