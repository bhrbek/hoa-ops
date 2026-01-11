import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { TeamRole, Team, Org, Profile, TeamMembershipWithUser, RockStatus, ProjectStatus, KeyResultStatus } from '@/types/supabase'

// Mock team context value type
interface MockTeamContextValue {
  activeTeam: Team | null
  activeOrg: Org | null
  currentRole: TeamRole | null
  isOrgAdmin: boolean
  isLoading: boolean
  error: string | null
  user: (Profile & { email: string }) | null
  teamMembers: TeamMembershipWithUser[]
  availableTeams: (Team & { role: TeamRole; org: Org })[]
  switchTeam: (teamId: string) => Promise<void>
  refreshTeamData: () => Promise<void>
}

// Default mock team data
export const mockTeam: Team = {
  id: 'team-1',
  org_id: 'org-1',
  name: 'Test Team',
  description: 'A test team',
  created_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  deleted_by: null,
}

export const mockOrg: Org = {
  id: 'org-1',
  name: 'Test Organization',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockUser: Profile & { email: string } = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  capacity_hours: 40,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockTeamMembers: TeamMembershipWithUser[] = [
  {
    id: 'membership-1',
    team_id: 'team-1',
    user_id: 'user-1',
    role: 'manager' as TeamRole,
    created_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      capacity_hours: 40,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'membership-2',
    team_id: 'team-1',
    user_id: 'user-2',
    role: 'tsa' as TeamRole,
    created_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    user: {
      id: 'user-2',
      email: 'jane@example.com',
      full_name: 'Jane Smith',
      avatar_url: null,
      capacity_hours: 40,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
]

// Create mock team context
export const createMockTeamContext = (
  overrides: Partial<MockTeamContextValue> = {}
): MockTeamContextValue => ({
  activeTeam: mockTeam,
  activeOrg: mockOrg,
  currentRole: 'manager' as TeamRole,
  isOrgAdmin: false,
  isLoading: false,
  error: null,
  user: mockUser,
  teamMembers: mockTeamMembers,
  availableTeams: [{ ...mockTeam, role: 'manager' as TeamRole, org: mockOrg }],
  switchTeam: vi.fn().mockResolvedValue(undefined),
  refreshTeamData: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

// Mock TeamContext Provider
const MockTeamContext = React.createContext<MockTeamContextValue | null>(null)

interface MockTeamProviderProps {
  children: ReactNode
  value?: Partial<MockTeamContextValue>
}

export function MockTeamProvider({ children, value = {} }: MockTeamProviderProps) {
  const contextValue = createMockTeamContext(value)
  return (
    <MockTeamContext.Provider value={contextValue}>
      {children}
    </MockTeamContext.Provider>
  )
}

// Mock useTeam hook
vi.mock('@/contexts/team-context', () => ({
  useTeam: () => {
    const context = React.useContext(MockTeamContext)
    if (!context) {
      // Return default mock if no provider
      return createMockTeamContext()
    }
    return context
  },
  TeamProvider: ({ children }: { children: ReactNode }) => children,
  useActiveTeam: () => ({ team: mockTeam, isLoading: false }),
  useTeamMembers: () => ({ members: mockTeamMembers, isLoading: false }),
  useTeamRole: () => ({
    role: 'manager' as TeamRole,
    isOrgAdmin: false,
    isManager: true,
    isTSA: false,
    isLoading: false,
  }),
}))

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  teamContext?: Partial<MockTeamContextValue>
}

function customRender(
  ui: ReactElement,
  { teamContext = {}, ...options }: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup({
    // Disable pointer events check - Radix UI uses pointer events
    pointerEventsCheck: 0,
    // Ensure we wait for animations
    delay: null,
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return <MockTeamProvider value={teamContext}>{children}</MockTeamProvider>
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    user,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
export { userEvent }

// Utility to wait for Radix UI animations
export async function waitForRadixAnimation() {
  await new Promise((resolve) => setTimeout(resolve, 100))
}

// Utility to assert modal is open
export function expectModalToBeOpen(modalTitle: string) {
  const dialog = document.querySelector('[role="dialog"]')
  expect(dialog).toBeInTheDocument()
  expect(dialog).toHaveAttribute('data-state', 'open')
}

// Utility to assert modal is closed
export function expectModalToBeClosed() {
  const dialog = document.querySelector('[role="dialog"]')
  expect(dialog).not.toBeInTheDocument()
}

// Mock data factories
export const createMockRock = (overrides = {}) => ({
  id: `rock-${Math.random().toString(36).slice(2)}`,
  team_id: 'team-1',
  title: 'Test Rock',
  owner_id: 'user-1',
  quarter: 'Q1 2026',
  perfect_outcome: 'Perfect outcome description',
  worst_outcome: 'Worst outcome description',
  status: 'On Track' as RockStatus,
  progress_override: null,
  fiscal_year: null,
  priority_type: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  deleted_by: null,
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: `project-${Math.random().toString(36).slice(2)}`,
  team_id: 'team-1',
  rock_id: 'rock-1',
  title: 'Test Project',
  owner_id: 'user-1',
  status: 'Not Started' as ProjectStatus,
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  estimated_hours: 40,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  deleted_by: null,
  ...overrides,
})

export const createMockKeyResult = (overrides = {}) => ({
  id: `kr-${Math.random().toString(36).slice(2)}`,
  team_id: 'team-1',
  rock_id: 'rock-1',
  title: 'Test Key Result',
  description: 'A test key result',
  target_value: 100,
  current_value: 50,
  unit: 'count',
  status: 'in_progress' as KeyResultStatus,
  due_date: '2024-03-31',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  deleted_by: null,
  ...overrides,
})

export const createMockDomain = (overrides = {}) => ({
  id: `domain-${Math.random().toString(36).slice(2)}`,
  name: 'Test Domain',
  color: 'blue',
  ...overrides,
})

export const createMockOEM = (overrides = {}) => ({
  id: `oem-${Math.random().toString(36).slice(2)}`,
  name: 'Test OEM',
  logo_url: null,
  ...overrides,
})

export const createMockAsset = (overrides = {}) => ({
  id: `asset-${Math.random().toString(36).slice(2)}`,
  team_id: 'team-1',
  name: 'Test Asset',
  asset_type: 'demo',
  description: 'A test asset',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  deleted_by: null,
  ...overrides,
})
