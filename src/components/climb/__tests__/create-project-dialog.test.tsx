import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { CreateProjectDialog } from '../create-project-dialog'
import { createMockRock } from '@/test/test-utils'

describe('CreateProjectDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSave = vi.fn()
  const mockRocks = [
    createMockRock({ id: 'rock-1', title: 'Enterprise API Integration' }),
    createMockRock({ id: 'rock-2', title: 'Customer Portal Redesign' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
  })

  // ============================================
  // MODAL OPEN/CLOSE BEHAVIOR
  // ============================================
  describe('Modal Open/Close Behavior', () => {
    it('renders nothing when closed', () => {
      render(
        <CreateProjectDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders modal content when open', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
      expect(screen.getByText('Add a supporting project (pebble) to a Rock.')).toBeInTheDocument()
    })

    it('calls onOpenChange(false) when Cancel button is clicked', async () => {
      const { user } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when close button is clicked', async () => {
      const { user } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange when Escape key is pressed', async () => {
      const { user } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ============================================
  // FORM FIELDS
  // ============================================
  describe('Form Fields', () => {
    it('shows parent rock selector', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Parent Rock')).toBeInTheDocument()
      // NOTE: Radix UI Select dropdowns don't work in jsdom
      // See docs/TESTABILITY-ISSUES.md for details
    })

    it('shows project title input', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(await screen.findByLabelText(/project title/i)).toBeInTheDocument()
    })

    it('shows owner selector', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Owner')).toBeInTheDocument()
      // NOTE: Radix UI Select dropdowns don't work in jsdom
    })

    it('shows date inputs', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    })

    it('shows estimated hours input', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(await screen.findByLabelText(/estimated hours/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // FORM VALIDATION
  // ============================================
  describe('Form Validation', () => {
    it('disables submit button when required fields are empty', () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create project/i })
      expect(submitButton).toBeDisabled()
    })

    it('requires title to be filled', async () => {
      const { user } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      // Fill date fields only (cannot fill selects due to Radix issues)
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01')
      await user.type(screen.getByLabelText(/end date/i), '2024-03-31')

      // Submit should still be disabled (missing title, rock, owner)
      const submitButton = screen.getByRole('button', { name: /create project/i })
      expect(submitButton).toBeDisabled()
    })

    it('treats whitespace-only title as invalid', async () => {
      const { user } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      // Fill title with whitespace only
      await user.type(screen.getByLabelText(/project title/i), '   ')

      const submitButton = screen.getByRole('button', { name: /create project/i })
      expect(submitButton).toBeDisabled()
    })
  })

  // ============================================
  // FORM SUBMISSION
  // NOTE: Full form submission tests are limited because Radix UI Select
  // dropdown interactions don't work properly in jsdom. The rock and owner
  // fields require dropdown selection which cannot be simulated reliably.
  // See docs/TESTABILITY-ISSUES.md for details.
  // ============================================
  describe('Form Submission', () => {
    it('has submit button', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
          onSave={mockOnSave}
        />
      )

      expect(await screen.findByRole('button', { name: /create project/i })).toBeInTheDocument()
    })

    it('has cancel button', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(await screen.findByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  // ============================================
  // TEAM CONTEXT INTEGRATION
  // ============================================
  describe('Team Context Integration', () => {
    it('handles loading state gracefully', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />,
        {
          teamContext: {
            isLoading: true,
            teamMembers: [],
          },
        }
      )

      await screen.findByRole('dialog')
      // Should render without crashing
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
    })

    it('handles empty team members gracefully', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />,
        {
          teamContext: {
            teamMembers: [],
            isLoading: false,
          },
        }
      )

      await screen.findByRole('dialog')
      // Should render without crashing
      expect(screen.getByText('Owner')).toBeInTheDocument()
    })

    it('handles empty rocks array gracefully', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={[]}
        />
      )

      await screen.findByRole('dialog')
      // Should render without crashing
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
    })
  })

  // ============================================
  // ACCESSIBILITY
  // ============================================
  describe('Accessibility', () => {
    it('has accessible dialog role', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
    })

    it('has accessible title', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
    })

    it('has accessible description', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(await screen.findByText('Add a supporting project (pebble) to a Rock.')).toBeInTheDocument()
    })

    it('form inputs have associated labels', async () => {
      render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      await screen.findByRole('dialog')

      expect(screen.getByLabelText(/project title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/estimated hours/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // CLEAN UNMOUNT
  // ============================================
  describe('Clean Unmount', () => {
    it('unmounts without errors', () => {
      const { unmount } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      expect(() => unmount()).not.toThrow()
    })

    it('removes dialog from DOM on unmount', () => {
      const { unmount } = render(
        <CreateProjectDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rocks={mockRocks}
        />
      )

      unmount()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
