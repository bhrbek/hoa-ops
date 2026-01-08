# /test - Run Modal and Functional Tests

Run the test suite for modal components and page-level tests.

## Usage
```
/test              # Run all tests
/test watch        # Run in watch mode
/test coverage     # Run with coverage report
/test [pattern]    # Run tests matching pattern
```

## Commands

### Run All Tests (CI mode)
```bash
npm run test:run
```

### Watch Mode (development)
```bash
npm run test
```

### With Coverage
```bash
npm run test:coverage
```

### Specific Test Files
```bash
# Modal components
npm run test -- engagement-drawer
npm run test -- create-rock-dialog
npm run test -- create-project-dialog
npm run test -- create-commitment-dialog

# Page-level tests
npm run test -- vista
npm run test -- admin
```

## Test Coverage

| Component | Test File | Tests |
|-----------|-----------|-------|
| EngagementDrawer | `src/components/stream/__tests__/engagement-drawer.test.tsx` | 46 |
| CreateRockDialog | `src/components/climb/__tests__/create-rock-dialog.test.tsx` | 25 |
| CreateProjectDialog | `src/components/climb/__tests__/create-project-dialog.test.tsx` | 24 |
| CreateCommitmentDialog | `src/components/commitment/__tests__/create-commitment-dialog.test.tsx` | 24 |
| AdminSettingsPage | `src/app/settings/admin/__tests__/page.test.tsx` | 18 |
| VistaPage | `src/app/__tests__/vista.test.tsx` | 16 |

**Total: 153 tests**

## What Tests Verify

### Modal Components
- Open/close behavior (Cancel, X, Escape key)
- Form field presence and validation
- Required field enforcement
- Team context integration
- Loading states
- Accessibility (dialog role, labels)
- Clean unmount (no memory leaks)

### Page-Level Tests
- Access control (org admin vs regular user)
- Data loading states
- Error states with retry
- Empty states
- Role-based UI differences

## Debugging Failed Tests

### 1. Run single test file with verbose output
```bash
npm run test -- engagement-drawer --reporter=verbose
```

### 2. Check for mock issues
Tests mock server actions at module level:
```typescript
vi.mock('@/app/actions/rocks', () => ({
  getActiveRocks: vi.fn().mockResolvedValue(mockRocks),
}))
```

### 3. Common failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module" | Import path changed | Update mock path |
| "Type not found" | Type renamed/removed | Update type imports |
| "No element found" | Selector changed | Update test queries |
| "act() warning" | Async state update | Wrap in waitFor() |

### 4. Radix UI Select limitation
Dropdown option selection doesn't work in jsdom. Tests verify selectors exist but skip option clicking:
```typescript
// This works
expect(screen.getByRole('combobox')).toBeInTheDocument()

// This doesn't work in jsdom
await user.click(screen.getByText('Option 1'))  // fails
```

## Adding New Tests

### Test file location
```
src/components/[area]/__tests__/[component].test.tsx
src/app/__tests__/[page].test.tsx
src/app/[route]/__tests__/page.test.tsx
```

### Test template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../my-component'

// Mock server actions
vi.mock('@/app/actions/my-action', () => ({
  myAction: vi.fn().mockResolvedValue([]),
}))

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Pre-Commit Checklist

Before committing changes to tested components:
1. Run `npm run test:run`
2. Verify all 153 tests pass
3. If tests fail, fix before committing
4. For new components, add tests following the patterns above
