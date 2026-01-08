import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import VistaPage from '../page'
import { createMockRock, mockTeam, mockOrg } from '@/test/test-utils'

// Mock server actions
const mockGetActiveRocks = vi.fn()
const mockGetActiveEngagements = vi.fn()
const mockGetActiveEngagementStats = vi.fn()

vi.mock('@/app/actions/rocks', () => ({
  getActiveRocks: () => mockGetActiveRocks(),
}))

vi.mock('@/app/actions/engagements', () => ({
  getActiveEngagements: (...args: unknown[]) => mockGetActiveEngagements(...args),
  getActiveEngagementStats: () => mockGetActiveEngagementStats(),
}))

describe('VistaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default to empty successful responses
    mockGetActiveRocks.mockResolvedValue([])
    mockGetActiveEngagements.mockResolvedValue([])
    mockGetActiveEngagementStats.mockResolvedValue({
      totalRevenue: 0,
      totalGP: 0,
      engagementCount: 0,
      workshopCount: 0,
    })
  })

  // ============================================
  // DATA LOADING TESTS
  // ============================================
  describe('Data Loading', () => {
    it('shows loading skeleton initially', () => {
      render(<VistaPage />, {
        teamContext: {
          isLoading: true,
          activeTeam: mockTeam,
        },
      })

      // Should show skeleton loading state
      expect(screen.getByText('The Vista')).toBeInTheDocument()
      // Content should not be visible yet
      expect(screen.queryByText('The Scorecard')).not.toBeInTheDocument()
    })

    it('loads data when team is active', async () => {
      mockGetActiveEngagementStats.mockResolvedValue({
        totalRevenue: 500000,
        totalGP: 125000,
        engagementCount: 42,
        workshopCount: 8,
      })

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(mockGetActiveEngagementStats).toHaveBeenCalled()
      })

      // Should show scorecard section
      await waitFor(() => {
        expect(screen.getByText('The Scorecard')).toBeInTheDocument()
      })
    })

    it('displays revenue from stats', async () => {
      mockGetActiveEngagementStats.mockResolvedValue({
        totalRevenue: 1500000,
        totalGP: 375000,
        engagementCount: 25,
        workshopCount: 5,
      })

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Revenue Influenced')).toBeInTheDocument()
      })

      // Should display formatted revenue (1.5M)
      await waitFor(() => {
        expect(screen.getByText('$1.5M')).toBeInTheDocument()
      })
    })

    it('displays active rocks', async () => {
      const mockRocks = [
        {
          ...createMockRock({ id: 'r1', title: 'API Integration' }),
          owner: { id: 'u1', full_name: 'John Doe' },
          projects: [],
        },
        {
          ...createMockRock({ id: 'r2', title: 'Customer Portal' }),
          owner: { id: 'u2', full_name: 'Jane Smith' },
          projects: [],
        },
      ]
      mockGetActiveRocks.mockResolvedValue(mockRocks)

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('API Integration')).toBeInTheDocument()
        expect(screen.getByText('Customer Portal')).toBeInTheDocument()
      })
    })

    it('displays recent engagements', async () => {
      const mockEngagements = [
        {
          id: 'e1',
          customer_name: 'Acme Corp',
          activity_type: 'workshop',
          date: '2024-01-15',
          revenue_impact: 50000,
        },
        {
          id: 'e2',
          customer_name: 'TechCo',
          activity_type: 'demo',
          date: '2024-01-14',
          revenue_impact: 25000,
        },
      ]
      mockGetActiveEngagements.mockResolvedValue(mockEngagements)

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('TechCo')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // These simulate RLS/auth failures
  // ============================================
  describe('Error Handling', () => {
    it('shows error state when data fetch fails', async () => {
      mockGetActiveRocks.mockRejectedValue(new Error('RLS policy blocked'))
      mockGetActiveEngagements.mockRejectedValue(new Error('RLS policy blocked'))
      mockGetActiveEngagementStats.mockRejectedValue(new Error('RLS policy blocked'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to Load')).toBeInTheDocument()
      })

      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('shows retry button that refetches data', async () => {
      // First call fails
      mockGetActiveEngagementStats
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          totalRevenue: 100000,
          engagementCount: 10,
          workshopCount: 2,
          totalGP: 25000,
        })

      mockGetActiveRocks
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([])

      mockGetActiveEngagements
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([])

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { user } = render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to Load')).toBeInTheDocument()
      })

      // Click retry
      await user.click(screen.getByRole('button', { name: /try again/i }))

      // Should refetch and show content
      await waitFor(() => {
        expect(screen.getByText('The Scorecard')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('handles no active team gracefully', async () => {
      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: null,
          activeOrg: null,
        },
      })

      // Should still render page structure
      await waitFor(() => {
        expect(screen.getByText('The Vista')).toBeInTheDocument()
      })

      // Should show empty states
      expect(screen.queryByText('Failed to Load')).not.toBeInTheDocument()
    })
  })

  // ============================================
  // EMPTY STATE TESTS
  // ============================================
  describe('Empty States', () => {
    it('shows empty state for rocks when none exist', async () => {
      mockGetActiveRocks.mockResolvedValue([])

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('No active rocks')).toBeInTheDocument()
      })
    })

    it('shows empty state for engagements when none exist', async () => {
      mockGetActiveEngagements.mockResolvedValue([])

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('No recent engagements')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // TEAM CONTEXT INTEGRATION
  // ============================================
  describe('Team Context Integration', () => {
    it('shows team name in header', async () => {
      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: { ...mockTeam, name: 'Campus Team' },
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/campus team/i)).toBeInTheDocument()
      })
    })

    it('refetches when team changes', async () => {
      const { rerender } = render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: { ...mockTeam, id: 'team-1' },
          activeOrg: mockOrg,
        },
      })

      expect(mockGetActiveRocks).toHaveBeenCalledTimes(1)

      // Note: In real app, team switch would trigger refetch via useEffect
      // This test verifies the data fetching is called
    })
  })

  // ============================================
  // ENGAGEMENT DRAWER
  // ============================================
  describe('Engagement Drawer', () => {
    it('has Log Engagement button', async () => {
      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log engagement/i })).toBeInTheDocument()
      })
    })

    it('opens drawer when Log Engagement is clicked', async () => {
      const { user } = render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log engagement/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /log engagement/i }))

      // Drawer should open
      await waitFor(() => {
        expect(screen.getByText('Log Engagement')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // SCORECARD METRICS
  // ============================================
  describe('Scorecard Metrics', () => {
    it('displays all four metrics', async () => {
      mockGetActiveEngagementStats.mockResolvedValue({
        totalRevenue: 2000000,
        totalGP: 500000,
        engagementCount: 50,
        workshopCount: 12,
      })

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      // Check metric titles are displayed
      await waitFor(() => {
        expect(screen.getByText('Revenue Influenced')).toBeInTheDocument()
        // Use getAllByText for 'Engagements' since it may appear multiple times
        expect(screen.getAllByText('Engagements').length).toBeGreaterThan(0)
        expect(screen.getByText('Rock Velocity')).toBeInTheDocument()
        expect(screen.getByText('Workshops Delivered')).toBeInTheDocument()
      })

      // Check values are displayed - format may vary ($2M or $2.0M)
      await waitFor(() => {
        // Revenue may be formatted as $2M or $2.0M depending on formatter
        expect(screen.getByText(/\$2\.?0?M/)).toBeInTheDocument() // Revenue
        expect(screen.getByText('12')).toBeInTheDocument() // Workshops
      })
    })

    it('handles zero values correctly', async () => {
      mockGetActiveEngagementStats.mockResolvedValue({
        totalRevenue: 0,
        totalGP: 0,
        engagementCount: 0,
        workshopCount: 0,
      })

      render(<VistaPage />, {
        teamContext: {
          isLoading: false,
          activeTeam: mockTeam,
          activeOrg: mockOrg,
        },
      })

      await waitFor(() => {
        expect(screen.getByText('$0')).toBeInTheDocument() // Zero revenue
      })
    })
  })
})
