# /typecheck - TypeScript Type Checking

Run TypeScript compiler to catch type errors without building.

## Usage
```
/typecheck       # Check all files
/typecheck watch # Watch mode
```

## Commands

### Check All Files
```bash
npx tsc --noEmit
```

### Watch Mode
```bash
npx tsc --noEmit --watch
```

### Check Specific Files
```bash
npx tsc --noEmit src/app/actions/rocks.ts
```

## Common Type Errors

### 1. Type mismatch after schema change
```
Type 'BuildSignal' does not exist
```
**Fix**: Check `src/types/supabase.ts` for renamed/removed types

### 2. Missing property
```
Property 'slug' does not exist on type 'Org'
```
**Fix**: Remove reference or add property to type

### 3. Null/undefined handling
```
Object is possibly 'undefined'
```
**Fix**: Add null check or use optional chaining (`?.`)

### 4. Supabase client typing
```
Property 'from' does not exist on type...
```
**Fix**: Cast to `any` in server actions (already done)

## Type Definition Files

| File | Purpose |
|------|---------|
| `src/types/supabase.ts` | Main types (Database, entities, relations) |
| `src/types/database.ts` | Re-exports (may have stale types) |

## After Schema Changes

When database schema changes:

1. Update `src/types/supabase.ts` with new types
2. Run `npx tsc --noEmit` to find all broken references
3. Fix each error
4. Run tests to verify runtime behavior

## Type Safety Best Practices

### Use explicit return types on server actions
```typescript
export async function getRocks(teamId: string): Promise<RockWithProjects[]> {
```

### Use `satisfies` for type checking without widening
```typescript
const config = {
  status: 'active'
} satisfies Partial<Rock>
```

### Use discriminated unions for state
```typescript
type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: Rock[] }
```
