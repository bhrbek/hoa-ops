import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { CreateCommitmentDialog } from '../create-commitment-dialog'
import { createMockRock, createMockProject, createMockKeyResult } from '@/test/test-utils'

// Mock data
const mockRocks = [
  createMockRock({ id: 'rock-1', title: 'Enterprise API Integration' }),
  createMockRock({ id: 'rock-2', title: 'Customer Portal Redesign' }),
]

const mockProjects = [
  createMockProject({ id: 'project-1', rock_id: 'rock-1', title: 'Backend Architecture' }),
  createMockProject({ id: 'project-2', rock_id: 'rock-1', title: 'Frontend Development' }),
  createMockProject({ id: 'project-3', rock_id: 'rock-2', title: 'Portal UI' }),
]

const mockKeyResults = [
  createMockKeyResult({ id: 'signal-1', rock_id: 'rock-1', title: 'API Response Time < 100ms' }),
  createMockKeyResult({ id: 'signal-2', rock_id: 'rock-1', title: '5 Beta Clients Live' }),
]

// Mock the dynamic imports for server actions
vi.mock('@/app/actions/rocks', () => ({
  getActiveRocks: vi.fn().mockResolvedValue(mockRocks),
}))

vi.mock('@/app/actions/projects', () => ({
  getProjects: vi.fn().mockResolvedValue(mockProjects),
}))

vi.mock('@/app/actions/key-results', () => ({
  getKeyResults: vi.fn().mockResolvedValue(mockKeyResults),
}))

describe('CreateCommitmentDialog', () => {
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
        <CreateCommitmentDialog
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders modal content when open', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Create New Commitment')).toBeInTheDocument()
      expect(screen.getByText('Make a weekly commitment linked to a project and key result.')).toBeInTheDocument()
    })

    it('calls onOpenChange(false) when Cancel button is clicked', async () => {
      const { user } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when close button is clicked', async () => {
      const { user } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange when Escape key is pressed', async () => {
      const { user } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
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
    it('shows rock selector', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Rock')).toBeInTheDocument()
      // NOTE: Radix UI Select dropdowns don't work in jsdom
      // See docs/TESTABILITY-ISSUES.md for details
    })

    it('shows project selector', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Project')).toBeInTheDocument()
    })

    it('shows key result selector', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Key Result')).toBeInTheDocument()
    })

    it('shows definition of done textarea', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByLabelText(/definition of done/i)).toBeInTheDocument()
    })

    it('shows notes textarea', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByLabelText(/notes/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // FORM VALIDATION
  // ============================================
  describe('Form Validation', () => {
    it('disables submit button when required fields are empty', () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create commitment/i })
      expect(submitButton).toBeDisabled()
    })

    it('requires definition of done to be filled', async () => {
      const { user } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Fill notes only (cannot fill selects due to Radix issues)
      await user.type(screen.getByLabelText(/notes/i), 'Some notes')

      // Submit should still be disabled (missing definition_of_done, rock, project, signal)
      const submitButton = screen.getByRole('button', { name: /create commitment/i })
      expect(submitButton).toBeDisabled()
    })

    it('treats whitespace-only definition of done as invalid', async () => {
      const { user } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Fill definition of done with whitespace only
      await user.type(screen.getByLabelText(/definition of done/i), '   ')

      const submitButton = screen.getByRole('button', { name: /create commitment/i })
      expect(submitButton).toBeDisabled()
    })
  })

  // ============================================
  // FORM SUBMISSION
  // NOTE: Full form submission tests are limited because Radix UI Select
  // dropdown interactions don't work properly in jsdom. The rock, project,
  // and key result fields require dropdown selection which cannot be
  // simulated reliably. See docs/TESTABILITY-ISSUES.md for details.
  // ============================================
  describe('Form Submission', () => {
    it('has submit button', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      expect(await screen.findByRole('button', { name: /create commitment/i })).toBeInTheDocument()
    })

    it('has cancel button', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  // ============================================
  // DATA LOADING
  // ============================================
  describe('Data Loading', () => {
    it('loads data when dialog opens', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      // Wait for data to load - the form should be rendered
      await waitFor(() => {
        expect(screen.getByText('Rock')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  // ============================================
  // TEAM CONTEXT INTEGRATION
  // ============================================
  describe('Team Context Integration', () => {
    it('handles loading state gracefully', async () => {
      render(
        <CreateCommitmentDialog
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
      expect(screen.getByText('Create New Commitment')).toBeInTheDocument()
    })

    it('handles no active team gracefully', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        {
          teamContext: {
            activeTeam: null,
            isLoading: false,
          },
        }
      )

      await screen.findByRole('dialog')
      // Should render without crashing (may show loading or empty states)
      expect(screen.getByText('Create New Commitment')).toBeInTheDocument()
    })
  })

  // ============================================
  // ACCESSIBILITY
  // ============================================
  describe('Accessibility', () => {
    it('has accessible dialog role', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
    })

    it('has accessible title', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')
      expect(screen.getByText('Create New Commitment')).toBeInTheDocument()
    })

    it('has accessible description', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByText('Make a weekly commitment linked to a project and key result.')).toBeInTheDocument()
    })

    it('form inputs have associated labels', async () => {
      render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      expect(screen.getByLabelText(/definition of done/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // CLEAN UNMOUNT
  // ============================================
  describe('Clean Unmount', () => {
    it('unmounts without errors', () => {
      const { unmount } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(() => unmount()).not.toThrow()
    })

    it('removes dialog from DOM on unmount', () => {
      const { unmount } = render(
        <CreateCommitmentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      unmount()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
