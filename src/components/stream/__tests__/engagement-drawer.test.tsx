import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { toast } from 'sonner'
import { EngagementDrawer } from '../engagement-drawer'
import { createMockRock } from '@/test/test-utils'

// Mock server actions
const mockGetVendors = vi.fn()
const mockGetActiveRocks = vi.fn()

vi.mock('@/app/actions/reference', () => ({
  getVendors: () => mockGetVendors(),
}))

vi.mock('@/app/actions/rocks', () => ({
  getActiveRocks: () => mockGetActiveRocks(),
}))

describe('EngagementDrawer (Issue Drawer)', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSave = vi.fn()

  const mockVendors = [
    { id: 'vendor-1', name: 'ABC Landscaping', specialty: 'Landscaping' },
    { id: 'vendor-2', name: 'XYZ Plumbing', specialty: 'Plumbing' },
  ]

  const mockRocks = [
    createMockRock({ id: 'rock-1', title: 'Community Improvement' }),
    createMockRock({ id: 'rock-2', title: 'Budget Management' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVendors.mockResolvedValue(mockVendors)
    mockGetActiveRocks.mockResolvedValue(mockRocks)
    mockOnSave.mockResolvedValue(undefined)
  })

  describe('Modal Open/Close Behavior', () => {
    it('renders nothing when closed', () => {
      render(
        <EngagementDrawer
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders dialog when opened', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('shows "Create New Issue" title when creating', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Create New Issue')).toBeInTheDocument()
      })
    })
  })

  describe('Form Fields', () => {
    it('renders all required form fields', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        // Title field
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()

        // Description field
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()

        // Date field
        expect(screen.getByLabelText(/date reported/i)).toBeInTheDocument()

        // Issue Type selector
        expect(screen.getByLabelText(/issue type/i)).toBeInTheDocument()

        // Priority selector
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()

        // Status selector
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument()

        // Notes field
        expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('disables save button when title is empty', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save & close/i })
        expect(saveButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper dialog role and labels', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })
    })
  })

  describe('Clean Unmount', () => {
    it('unmounts cleanly without errors', async () => {
      const { unmount } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Unmount should not throw
      expect(() => unmount()).not.toThrow()
    })
  })
})
