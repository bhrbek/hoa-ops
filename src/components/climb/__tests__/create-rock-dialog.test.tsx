import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { toast } from 'sonner'
import { CreateRockDialog } from '../create-rock-dialog'

describe('CreateRockDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSave = vi.fn()

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
        <CreateRockDialog
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByText('Create New Rock')).not.toBeInTheDocument()
    })

    it('renders modal content when open', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Create New Rock')).toBeInTheDocument()
      expect(screen.getByText('Define a quarterly strategic goal for your team.')).toBeInTheDocument()
    })

    it('calls onOpenChange(false) when Cancel button is clicked', async () => {
      const { user } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when close button (X) is clicked', async () => {
      const { user } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // The close button has sr-only text "Close"
      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange when Escape key is pressed', async () => {
      const { user } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================
  describe('Focus Management', () => {
    it('traps focus within the modal when open', async () => {
      const { user } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const dialog = await screen.findByRole('dialog')

      // Tab through all focusable elements
      await user.tab()
      expect(document.activeElement).not.toBe(document.body)

      // Active element should be within the dialog
      expect(dialog.contains(document.activeElement)).toBe(true)
    })
  })

  // ============================================
  // FORM FIELDS
  // ============================================
  describe('Form Fields', () => {
    it('shows rock title input', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByLabelText(/rock title/i)).toBeInTheDocument()
    })

    it('shows owner selector', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Owner')).toBeInTheDocument()
      expect(document.getElementById('rock-owner')).toBeInTheDocument()
    })

    it('shows quarter selector', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Quarter')).toBeInTheDocument()
      // NOTE: Default value "Q1 2026" may appear in multiple places
      // See docs/TESTABILITY-ISSUES.md for details on multi-element matches
    })

    it('shows perfect outcome editor', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      // RichTextEditor doesn't have proper label association, check label exists
      const labels = document.querySelectorAll('label')
      const hasPerfectOutcome = Array.from(labels).some(l =>
        l.textContent?.toLowerCase().includes('perfect outcome')
      )
      expect(hasPerfectOutcome).toBe(true)
    })

    it('shows worst outcome editor', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      // RichTextEditor doesn't have proper label association, check label exists
      const labels = document.querySelectorAll('label')
      const hasWorstOutcome = Array.from(labels).some(l =>
        l.textContent?.toLowerCase().includes('worst outcome')
      )
      expect(hasWorstOutcome).toBe(true)
    })
  })

  // ============================================
  // FORM VALIDATION
  // ============================================
  describe('Form Validation', () => {
    it('disables submit button when required fields are empty', () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create rock/i })
      expect(submitButton).toBeDisabled()
    })

    it('requires title to be filled', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Without filling any fields, submit should be disabled
      // Note: Can't easily type into RichTextEditor in jsdom - see docs/TESTABILITY-ISSUES.md
      const submitButton = screen.getByRole('button', { name: /create rock/i })
      expect(submitButton).toBeDisabled()
    })

    it('treats whitespace-only title as invalid', async () => {
      const { user } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Fill with whitespace
      await user.type(screen.getByLabelText(/rock title/i), '   ')

      const submitButton = screen.getByRole('button', { name: /create rock/i })
      expect(submitButton).toBeDisabled()
    })
  })

  // ============================================
  // FORM SUBMISSION
  // ============================================
  describe('Form Submission', () => {
    // NOTE: Full form submission tests are limited because Radix UI Select
    // dropdown interactions don't work properly in jsdom. The owner field
    // requires dropdown selection which cannot be simulated reliably.

    it('has submit button', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      expect(await screen.findByRole('button', { name: /create rock/i })).toBeInTheDocument()
    })

    it('has cancel button', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
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
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
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
      expect(screen.getByText('Create New Rock')).toBeInTheDocument()
    })

    it('handles empty team members gracefully', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
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
      expect(document.getElementById('rock-owner')).toBeInTheDocument()
    })
  })

  // ============================================
  // ACCESSIBILITY
  // ============================================
  describe('Accessibility', () => {
    it('has accessible dialog role', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
    })

    it('has accessible title', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Create New Rock')).toBeInTheDocument()
    })

    it('has accessible description', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByText('Define a quarterly strategic goal for your team.')).toBeInTheDocument()
    })

    it('form inputs have associated labels', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      expect(screen.getByLabelText(/rock title/i)).toBeInTheDocument()
      // RichTextEditor doesn't have proper label association, check labels exist
      const labels = document.querySelectorAll('label')
      const labelTexts = Array.from(labels).map(l => l.textContent?.toLowerCase())
      expect(labelTexts.some(t => t?.includes('perfect outcome'))).toBe(true)
      expect(labelTexts.some(t => t?.includes('worst outcome'))).toBe(true)
    })

    it('indicates required field with asterisk', async () => {
      render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      // Perfect outcome label contains asterisk
      const labels = document.querySelectorAll('label')
      const perfectOutcomeLabel = Array.from(labels).find(l =>
        l.textContent?.toLowerCase().includes('perfect outcome')
      )
      expect(perfectOutcomeLabel?.innerHTML).toContain('*')
    })
  })

  // ============================================
  // CLEAN UNMOUNT
  // ============================================
  describe('Clean Unmount', () => {
    it('unmounts without errors', () => {
      const { unmount } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(() => unmount()).not.toThrow()
    })

    it('removes dialog from DOM on unmount', () => {
      const { unmount } = render(
        <CreateRockDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      unmount()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
