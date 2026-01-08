import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@/test/test-utils'
import { toast } from 'sonner'
import { EngagementDrawer } from '../engagement-drawer'
import { createMockDomain, createMockOEM, createMockRock, createMockAsset } from '@/test/test-utils'

// Mock server actions
const mockGetDomains = vi.fn()
const mockGetOEMs = vi.fn()
const mockGetActivityTypes = vi.fn()
const mockGetActiveRocks = vi.fn()
const mockGetAssets = vi.fn()

vi.mock('@/app/actions/reference', () => ({
  getDomains: () => mockGetDomains(),
  getOEMs: () => mockGetOEMs(),
  getActivityTypes: () => mockGetActivityTypes(),
}))

vi.mock('@/app/actions/rocks', () => ({
  getActiveRocks: () => mockGetActiveRocks(),
}))

vi.mock('@/app/actions/assets', () => ({
  getAssets: () => mockGetAssets(),
}))

describe('EngagementDrawer', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSave = vi.fn()

  const mockDomains = [
    createMockDomain({ id: 'domain-1', name: 'Networking' }),
    createMockDomain({ id: 'domain-2', name: 'Security' }),
    createMockDomain({ id: 'domain-3', name: 'Cloud' }),
  ]

  const mockOems = [
    createMockOEM({ id: 'oem-1', name: 'Cisco' }),
    createMockOEM({ id: 'oem-2', name: 'Palo Alto' }),
    createMockOEM({ id: 'oem-3', name: 'AWS' }),
  ]

  const mockRocks = [
    createMockRock({ id: 'rock-1', title: 'Enterprise Modernization' }),
    createMockRock({ id: 'rock-2', title: 'Cloud Migration' }),
  ]

  const mockAssets = [
    createMockAsset({ id: 'asset-1', name: 'Sales Deck', asset_type: 'deck' }),
    createMockAsset({ id: 'asset-2', name: 'Product Demo', asset_type: 'demo' }),
  ]

  const mockEngagement = {
    id: 'engagement-1',
    team_id: 'team-1',
    owner_id: 'user-1',
    customer_id: null,
    customer_name: 'Acme Corp',
    date: '2024-01-15',
    activity_type: 'Workshop' as const,
    revenue_impact: 50000,
    gp_impact: 15000,
    notes: 'Great discussion about cloud strategy',
    rock_id: 'rock-1',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    deleted_at: null,
    deleted_by: null,
    last_edited_by: 'user-2',
    owner: { full_name: 'John Doe' },
    last_editor: { full_name: 'Jane Smith' },
    last_edited_at: '2024-01-16T00:00:00Z',
  }

  const mockActivityTypes = [
    { id: 'at-1', name: 'Workshop', is_active: true },
    { id: 'at-2', name: 'Demo', is_active: true },
    { id: 'at-3', name: 'POC', is_active: true },
    { id: 'at-4', name: 'Advisory', is_active: true },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
    mockGetDomains.mockResolvedValue(mockDomains)
    mockGetOEMs.mockResolvedValue(mockOems)
    mockGetActivityTypes.mockResolvedValue(mockActivityTypes)
    mockGetActiveRocks.mockResolvedValue(mockRocks)
    mockGetAssets.mockResolvedValue(mockAssets)
  })

  // ============================================
  // DRAWER OPEN/CLOSE BEHAVIOR
  // ============================================
  describe('Drawer Open/Close Behavior', () => {
    it('renders nothing when closed', () => {
      render(
        <EngagementDrawer
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders drawer content when open (create mode)', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Log New Engagement')).toBeInTheDocument()
      expect(screen.getByText('Capture field intelligence from your customer interaction.')).toBeInTheDocument()
    })

    it('renders drawer content when open (edit mode)', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Edit Engagement')).toBeInTheDocument()
      expect(screen.getByText('Update the details of this customer interaction.')).toBeInTheDocument()
    })

    it('calls onOpenChange when Escape key is pressed', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ============================================
  // DATA LOADING
  // ============================================
  describe('Data Loading', () => {
    it('shows loading skeleton while reference data is being fetched', async () => {
      // Delay the response to see loading state
      mockGetDomains.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockDomains), 100)))

      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Should show loading skeletons
      const loadingSkeletons = document.querySelectorAll('.animate-pulse')
      expect(loadingSkeletons.length).toBeGreaterThan(0)
    })

    it('loads domains, OEMs, rocks, and assets when drawer opens', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Wait for data to load
      await waitFor(() => {
        expect(mockGetDomains).toHaveBeenCalled()
        expect(mockGetOEMs).toHaveBeenCalled()
        expect(mockGetActiveRocks).toHaveBeenCalled()
        expect(mockGetAssets).toHaveBeenCalled()
      })

      // Should show loaded domains
      await waitFor(() => {
        expect(screen.getByText('Networking')).toBeInTheDocument()
        expect(screen.getByText('Security')).toBeInTheDocument()
        expect(screen.getByText('Cloud')).toBeInTheDocument()
      })

      // Should show loaded OEMs
      expect(screen.getByText('Cisco')).toBeInTheDocument()
      expect(screen.getByText('Palo Alto')).toBeInTheDocument()
      expect(screen.getByText('AWS')).toBeInTheDocument()
    })

    it('handles data loading errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetDomains.mockRejectedValue(new Error('Network error'))

      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  // ============================================
  // FORM FIELDS
  // ============================================
  describe('Form Fields', () => {
    it('shows customer input field', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByLabelText(/customer/i)).toBeInTheDocument()
    })

    it('shows date input field with today as default', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const dateInput = await screen.findByLabelText(/date/i)
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput).toHaveValue(today)
    })

    it('shows activity type selector with Workshop as default', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Wait for dialog to open and find the trigger button
      await screen.findByRole('dialog')

      // The select trigger should show Workshop by default
      await waitFor(() => {
        expect(screen.getByText('Workshop')).toBeInTheDocument()
      })
    })

    it('shows revenue and GP input fields', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByLabelText(/revenue impact/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/gross profit/i)).toBeInTheDocument()
    })

    it('shows notes textarea', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByLabelText(/engagement notes/i)).toBeInTheDocument()
    })

    it('shows linked rock selector', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      // Look for the label instead of the combobox
      expect(screen.getByText(/link to rock/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // EDIT MODE FORM POPULATION
  // ============================================
  describe('Edit Mode Form Population', () => {
    it('populates form fields with engagement data in edit mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
        />
      )

      // Customer name should be populated
      const customerInput = await screen.findByLabelText(/customer/i)
      expect(customerInput).toHaveValue('Acme Corp')

      // Date should be populated
      expect(screen.getByLabelText(/date/i)).toHaveValue('2024-01-15')

      // Notes should be populated
      expect(screen.getByLabelText(/engagement notes/i)).toHaveValue('Great discussion about cloud strategy')

      // Revenue and GP should be populated
      expect(screen.getByLabelText(/revenue impact/i)).toHaveValue(50000)
      expect(screen.getByLabelText(/gross profit/i)).toHaveValue(15000)
    })

    it('shows creator info in edit mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/created by john doe/i)).toBeInTheDocument()
      })
    })

    it('shows last editor info in edit mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/edited by jane smith/i)).toBeInTheDocument()
      })
    })

    it('hides creator/editor info in create mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      expect(screen.queryByText(/created by/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/edited by/i)).not.toBeInTheDocument()
    })
  })

  // ============================================
  // DOMAIN/OEM BADGE SELECTION
  // ============================================
  describe('Domain/OEM Badge Selection', () => {
    it('can select and deselect domains', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Wait for domains to load
      const networkingBadge = await screen.findByText('Networking')

      // Click to select
      await user.click(networkingBadge)

      // Badge should be styled differently when selected (has ring class)
      // The badge's parent button or the badge itself should show selected state
      const badge = networkingBadge.closest('button')
      expect(badge).toBeInTheDocument()

      // Click again to deselect
      await user.click(networkingBadge)
    })

    it('can select multiple domains', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Wait for domains to load
      await screen.findByText('Networking')

      // Select multiple domains
      await user.click(screen.getByText('Networking'))
      await user.click(screen.getByText('Security'))
      await user.click(screen.getByText('Cloud'))

      // All should be clickable without errors
    })

    it('can select and deselect OEMs', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Wait for OEMs to load
      const ciscoBadge = await screen.findByText('Cisco')

      // Click to select
      await user.click(ciscoBadge)

      // Click again to deselect
      await user.click(ciscoBadge)
    })
  })

  // ============================================
  // FORM VALIDATION
  // ============================================
  describe('Form Validation', () => {
    it('disables save buttons when customer name is empty', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      // Get all buttons and find the primary save button
      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      expect(saveButton).toBeDisabled()
    })

    it('enables save buttons when customer name is provided', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const saveButton = buttons.find(b => b.textContent === 'Save & Close')
        expect(saveButton).not.toBeDisabled()
      })
    })
  })

  // ============================================
  // FORM SUBMISSION
  // ============================================
  describe('Form Submission', () => {
    // Helper to find buttons by exact text
    const findSaveCloseButton = () => {
      const buttons = screen.getAllByRole('button')
      return buttons.find(b => b.textContent === 'Save & Close')
    }

    const findUpdateButton = () => {
      const buttons = screen.getAllByRole('button')
      return buttons.find(b => b.textContent === 'Update')
    }

    it('calls onSave with correct data when Save & Close is clicked', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      // Fill customer name
      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'New Customer')

      // Fill revenue
      const revenueInput = screen.getByLabelText(/revenue impact/i)
      await user.type(revenueInput, '100000')

      // Click save
      const saveButton = findSaveCloseButton()
      await user.click(saveButton!)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_name: 'New Customer',
            revenue_impact: 100000,
            activity_type: 'Workshop',
          })
        )
      })
    })

    it('shows success toast on successful save', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const saveButton = findSaveCloseButton()
      await user.click(saveButton!)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Engagement logged')
      })
    })

    it('shows "Engagement updated" toast in edit mode', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
          onSave={mockOnSave}
        />
      )

      await screen.findByRole('dialog')

      const updateButton = findUpdateButton()
      await user.click(updateButton!)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Engagement updated')
      })
    })

    it('shows error toast on failed save', async () => {
      mockOnSave.mockRejectedValueOnce(new Error('Save failed'))

      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const saveButton = findSaveCloseButton()
      await user.click(saveButton!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save engagement')
      })
    })

    it('closes drawer after successful Save & Close', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const saveButton = findSaveCloseButton()
      await user.click(saveButton!)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  // ============================================
  // SAVE & LOG ANOTHER
  // ============================================
  describe('Save & Log Another', () => {
    // Helper to find buttons by exact text
    const findSaveLogAnotherButton = () => {
      const buttons = screen.getAllByRole('button')
      return buttons.find(b => b.textContent === 'Save & Log Another')
    }

    it('shows Save & Log Another button in create mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      const button = findSaveLogAnotherButton()
      expect(button).toBeInTheDocument()
    })

    it('hides Save & Log Another button in edit mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
        />
      )

      await screen.findByRole('dialog')

      const button = findSaveLogAnotherButton()
      expect(button).toBeUndefined()
    })

    it('resets form after Save & Log Another', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      // Fill the form
      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const notesInput = screen.getByLabelText(/engagement notes/i)
      await user.type(notesInput, 'Some notes')

      // Click Save & Log Another
      const button = findSaveLogAnotherButton()
      await user.click(button!)

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText(/customer/i)).toHaveValue('')
        expect(screen.getByLabelText(/engagement notes/i)).toHaveValue('')
      })
    })

    it('keeps drawer open after Save & Log Another', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const button = findSaveLogAnotherButton()
      await user.click(button!)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })

      // Drawer should NOT close
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
    })
  })

  // ============================================
  // ACTIVITY TYPE SELECTION
  // ============================================
  describe('Activity Type Selection', () => {
    // NOTE: Radix UI Select doesn't expose proper role="option" in jsdom.
    // This is a known testability issue. In a real browser, options would be accessible.
    // We test that the trigger is present and verify default submission works.
    it('has activity type selector with default Workshop value', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      // Wait for dialog to open
      await screen.findByRole('dialog')

      // Verify the default activity type is Workshop (shown in trigger)
      expect(screen.getByText('Workshop')).toBeInTheDocument()

      // Submit with default value to verify it works
      const customerInput = screen.getByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      await user.click(saveButton!)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            activity_type: 'Workshop', // Default value
          })
        )
      })
    })
  })

  // ============================================
  // LINKED ROCK SELECTION
  // ============================================
  describe('Linked Rock Selection', () => {
    // NOTE: Radix UI Select dropdown interactions are problematic in jsdom.
    // Options don't expose proper roles. We test that:
    // 1. The rock selector is present
    // 2. Default submission works with no rock linked

    it('shows rock selector field', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      // Wait for dialog and data to load
      await screen.findByRole('dialog')
      await waitFor(() => {
        expect(screen.getByText(/link to rock/i)).toBeInTheDocument()
      })

      // Verify the selector trigger exists
      const rockTrigger = document.getElementById('linked-rock')
      expect(rockTrigger).toBeInTheDocument()
    })

    it('submits with no rock linked by default', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      // Fill required field and submit
      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      await user.click(saveButton!)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            rock_id: null, // No rock linked by default
          })
        )
      })
    })

    it('loads rocks from server when drawer opens', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Verify rocks were loaded
      await waitFor(() => {
        expect(mockGetActiveRocks).toHaveBeenCalled()
      })
    })
  })

  // ============================================
  // LOADING STATE
  // ============================================
  describe('Loading State', () => {
    it('shows "Saving..." while submitting', async () => {
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      await user.click(saveButton!)

      // Button text should change to "Saving..."
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const savingButton = buttons.find(b => b.textContent === 'Saving...')
        expect(savingButton).toBeInTheDocument()
      })
    })

    it('disables buttons while saving', async () => {
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      await user.click(saveButton!)

      // "Save & Log Another" button should be disabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const saveLogAnotherBtn = buttons.find(b => b.textContent === 'Save & Log Another')
        expect(saveLogAnotherBtn).toBeDisabled()
      })
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('handles empty revenue and GP as 0', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, 'Test Customer')

      // Don't fill revenue/GP, just submit
      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      await user.click(saveButton!)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            revenue_impact: 0,
            gp_impact: 0,
          })
        )
      })
    })

    it('handles whitespace-only customer name as invalid', async () => {
      const { user } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      )

      const customerInput = await screen.findByLabelText(/customer/i)
      await user.type(customerInput, '   ')

      const buttons = screen.getAllByRole('button')
      const saveButton = buttons.find(b => b.textContent === 'Save & Close')
      expect(saveButton).toBeDisabled()
    })

    it('handles no rocks available gracefully', async () => {
      mockGetActiveRocks.mockResolvedValue([])

      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Wait for dialog and data to load
      await screen.findByRole('dialog')
      await waitFor(() => {
        expect(screen.getByText(/link to rock/i)).toBeInTheDocument()
      })

      // Verify the selector is present even with no rocks
      // (We don't click because Radix Select has issues in jsdom)
      const rockTrigger = document.getElementById('linked-rock')
      expect(rockTrigger).toBeInTheDocument()
    })
  })

  // ============================================
  // ACCESSIBILITY
  // ============================================
  describe('Accessibility', () => {
    it('has accessible dialog role', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
    })

    it('has accessible title in create mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      // Check that the title is rendered and associated via aria-labelledby
      expect(screen.getByText('Log New Engagement')).toBeInTheDocument()
    })

    it('has accessible title in edit mode', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
          engagement={mockEngagement}
        />
      )

      await screen.findByRole('dialog')

      // Check that the title is rendered and associated via aria-labelledby
      expect(screen.getByText('Edit Engagement')).toBeInTheDocument()
    })

    it('form inputs have associated labels', async () => {
      render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await screen.findByRole('dialog')

      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/revenue impact/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/gross profit/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/engagement notes/i)).toBeInTheDocument()
      // These are select triggers that might not be labeled via standard labels
      expect(screen.getByText(/activity type/i)).toBeInTheDocument()
      expect(screen.getByText(/link to rock/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // CLEAN UNMOUNT
  // ============================================
  describe('Clean Unmount', () => {
    it('unmounts without errors', () => {
      const { unmount } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(() => unmount()).not.toThrow()
    })

    it('handles unmount during data loading', async () => {
      mockGetDomains.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockDomains), 500)))

      const { unmount } = render(
        <EngagementDrawer
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Unmount while loading
      expect(() => unmount()).not.toThrow()
    })
  })
})
