# Modal Component Testability Issues

## Summary

This document captures known testability issues discovered while writing automated tests for modal components using Vitest + Testing Library + jsdom.

## Working Tests

### EngagementDrawer (46 tests passing)
Located at: `src/components/stream/__tests__/engagement-drawer.test.tsx`

Comprehensive tests covering:
- Drawer open/close behavior
- Data loading states
- Form fields presence
- Edit mode form population
- Domain/OEM badge selection (multi-select)
- Form validation (customer name required)
- Form submission (Save & Close, Save & Log Another)
- Success/error toast notifications
- Loading states during save
- Edge cases (empty revenue, whitespace validation, no rocks)
- Accessibility (dialog role, labels)
- Clean unmount

## Known Issues

### 1. Radix UI Select Dropdown Interactions

**Problem:** Radix UI Select components don't expose proper `role="option"` in jsdom. Clicking the trigger opens a portal but options cannot be selected reliably.

**Affected Components:**
- CreateRockDialog (owner, quarter selects)
- CreateProjectDialog (parent rock, owner selects)
- CreateCommitmentDialog (rock, project, build signal selects)
- EngagementDrawer (activity type, linked rock selects)

**Workaround:** Test that select triggers are present and have default values. Skip testing dropdown option selection. Document this limitation in test comments.

```typescript
// Instead of:
await user.click(screen.getByRole('combobox', { name: /owner/i }))
await user.click(screen.getByText('Test User'))

// Do:
// Verify the selector trigger exists
const ownerTrigger = document.getElementById('rock-owner')
expect(ownerTrigger).toBeInTheDocument()
```

### 2. Missing `hasPointerCapture` Function

**Problem:** Radix Select throws `TypeError: target.hasPointerCapture is not a function` when clicked.

**Solution:** Add mock to `src/test/setup.ts`:
```typescript
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
```

### 3. Incomplete `getComputedStyle` Mock

**Problem:** Radix UI calls `style.getPropertyValue()` which may not exist on mocked styles.

**Solution:** Use Proxy to provide complete mock:
```typescript
window.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
  const style = originalGetComputedStyle(element, pseudoElt)
  return new Proxy(style, {
    get(target, prop) {
      if (prop === 'getPropertyValue') {
        return (name: string) => {
          if (name === 'animation-duration') return '0s'
          return target.getPropertyValue(name)
        }
      }
      const value = target[prop as keyof CSSStyleDeclaration]
      if (typeof value === 'function') return value.bind(target)
      return value
    }
  }) as CSSStyleDeclaration
}
```

### 4. Multiple Elements with Same Text

**Problem:** When searching by text, multiple elements may match (e.g., "Q1 2026" appears in multiple places).

**Solution:** Use more specific selectors or `within()`:
```typescript
import { within } from '@testing-library/react'

const section = screen.getByRole('group', { name: /quarter/i })
expect(within(section).getByText('Q1 2026')).toBeInTheDocument()
```

### 5. Dynamic Import Mocking for Server Actions

**Problem:** Components use `await import()` for server actions, making them harder to mock.

**Solution:** Mock the module at the test file level:
```typescript
vi.mock('@/app/actions/rocks', () => ({
  getActiveRocks: () => mockGetActiveRocks(),
}))
```

## Test Infrastructure Setup

### Required Dependencies
```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@vitejs/plugin-react": "^5.1.2",
    "jsdom": "^27.4.0",
    "vitest": "^4.0.16"
  }
}
```

### Key Configuration Files
- `vitest.config.ts` - Test runner configuration
- `src/test/setup.ts` - Global mocks and setup
- `src/test/test-utils.tsx` - Custom render with providers, mock factories

### Essential Mocks (setup.ts)
- Next.js navigation (`useRouter`, `usePathname`)
- Next.js cache (`revalidatePath`, `revalidateTag`)
- Sonner toast
- ResizeObserver
- IntersectionObserver
- matchMedia
- scrollIntoView
- Pointer capture methods
- getComputedStyle

## Recommendations for Improving Testability

1. **Add data-testid attributes** to complex select components for easier targeting
2. **Consider headless UI alternatives** that are more jsdom-friendly
3. **Use E2E tests (Playwright/Cypress)** for full dropdown interaction testing
4. **Separate business logic** from UI components for easier unit testing

## Test Running Commands

```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

## Files Created

| File | Description |
|------|-------------|
| `vitest.config.ts` | Vitest configuration |
| `src/test/setup.ts` | Global test setup and mocks |
| `src/test/test-utils.tsx` | Custom render, providers, mock factories |
| `src/components/stream/__tests__/engagement-drawer.test.tsx` | 46 passing tests |
| `src/components/climb/__tests__/create-rock-dialog.test.tsx` | Partial tests (Radix issues) |
| `src/components/climb/__tests__/create-project-dialog.test.tsx` | Partial tests (Radix issues) |
| `src/components/commitment/__tests__/create-commitment-dialog.test.tsx` | Partial tests (Radix issues) |
