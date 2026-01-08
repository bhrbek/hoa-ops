# /build - Build and Verify

Build the Next.js application and catch compile-time errors.

## Usage
```
/build           # Full production build
/build check     # Type check only (faster)
```

## Commands

### Full Production Build
```bash
npm run build
```

This runs:
1. TypeScript compilation
2. Next.js optimization
3. Static page generation
4. Bundle analysis

### Type Check Only (faster)
```bash
npx tsc --noEmit
```

## Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Type 'X' is not assignable" | Type mismatch | Check type definitions in `src/types/supabase.ts` |
| "Cannot find module" | Missing import | Check file exists, path is correct |
| "Property does not exist" | Schema changed | Update type or fix property name |
| "'X' is defined but never used" | Dead code | Remove unused import/variable |

## Build Output

Successful build shows:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        89.2 kB
├ ○ /commitment-board                    3.1 kB        87.1 kB
├ ○ /rocks                               4.8 kB        88.8 kB
├ ○ /stream                              3.5 kB        87.5 kB
└ ...
```

## Pre-Deploy Checklist

1. `npm run build` - Must succeed
2. `npm run test:run` - All tests pass
3. `npm run lint` - No lint errors
4. Check `.next/` folder created

## Troubleshooting

### Clear cache and rebuild
```bash
rm -rf .next
npm run build
```

### Check for circular dependencies
```bash
npx madge --circular src/
```

### Analyze bundle size
```bash
ANALYZE=true npm run build
```
