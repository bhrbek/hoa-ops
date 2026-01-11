export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// ENUMS
// ============================================

export type TeamRole = 'manager' | 'tsa'
export type RockStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Done'
export type ProjectStatus = 'Active' | 'Done' | 'Blocked'
export type ApprovalStatus = 'proposed' | 'board_review' | 'approved' | 'in_progress' | 'completed' | 'rejected'
export type TaskPriority = 'low' | 'medium' | 'high'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IssueSource = 'manual' | 'ticket' | 'signal'
export type KeyResultStatus = 'not_started' | 'in_progress' | 'achieved' | 'missed'
export type CommitmentStatus = 'planned' | 'done' | 'blocked' | 'slipped'
export type CustomerStatus = 'active' | 'churned' | 'prospect'
export type AssetStatus = 'active' | 'archived'
export type MilestoneStatus = 'pending' | 'completed' | 'missed'
export type BidStatus = 'submitted' | 'selected' | 'rejected'
export type SignalType = 'homeowner_complaint' | 'inspection_finding' | 'board_observation' | 'vendor_recommendation' | 'maintenance_need' | 'safety_concern' | 'other'
export type PriorityType = 'strategic' | 'operational' | 'compliance' | 'community'
export type DocumentStorageType = 'supabase' | 'external'
export type DocumentEntityType = 'bid' | 'project' | 'issue' | 'milestone' | 'signal' | 'vendor'
export type RecurrenceRule = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

// ============================================
// DATABASE TYPES
// ============================================

export type Database = {
  public: {
    Tables: {
      // Organization hierarchy
      orgs: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      team_memberships: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: TeamRole
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role: TeamRole
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: TeamRole
          created_at?: string
          deleted_at?: string | null
        }
      }
      org_admins: {
        Row: {
          id: string
          org_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          created_at?: string
        }
      }
      // User profiles
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          capacity_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          capacity_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          capacity_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Reference data - Categories (formerly domains)
      domains: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      activity_types: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          display_order?: number
          created_at?: string
        }
      }
      // Vendors (formerly OEMs)
      vendors: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          specialty: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          specialty?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          specialty?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      // Customers (org-scoped) - may represent Homeowners in HOA context
      customers: {
        Row: {
          id: string
          org_id: string
          name: string
          vertical: string | null
          status: CustomerStatus
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          vertical?: string | null
          status?: CustomerStatus
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          vertical?: string | null
          status?: CustomerStatus
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Priorities (formerly Rocks) - Annual Board Priorities
      rocks: {
        Row: {
          id: string
          team_id: string
          title: string
          owner_id: string | null
          quarter: string
          status: RockStatus
          perfect_outcome: string
          worst_outcome: string | null
          progress_override: number | null
          fiscal_year: string | null
          priority_type: PriorityType | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          owner_id?: string | null
          quarter?: string
          status?: RockStatus
          perfect_outcome: string
          worst_outcome?: string | null
          progress_override?: number | null
          fiscal_year?: string | null
          priority_type?: PriorityType | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          owner_id?: string | null
          quarter?: string
          status?: RockStatus
          perfect_outcome?: string
          worst_outcome?: string | null
          progress_override?: number | null
          fiscal_year?: string | null
          priority_type?: PriorityType | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Success Criteria (formerly Key Results)
      key_results: {
        Row: {
          id: string
          team_id: string
          rock_id: string
          title: string
          description: string | null
          target_value: number | null
          current_value: number
          unit: string | null
          status: KeyResultStatus
          due_date: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          rock_id: string
          title: string
          description?: string | null
          target_value?: number | null
          current_value?: number
          unit?: string | null
          status?: KeyResultStatus
          due_date?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          rock_id?: string
          title?: string
          description?: string | null
          target_value?: number | null
          current_value?: number
          unit?: string | null
          status?: KeyResultStatus
          due_date?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Projects (enhanced with budget and approval workflow)
      projects: {
        Row: {
          id: string
          team_id: string | null
          rock_id: string
          title: string
          description: string | null
          owner_id: string | null
          start_date: string | null
          end_date: string | null
          status: ProjectStatus
          estimated_hours: number
          budget_amount: number
          actual_cost: number
          approval_status: ApprovalStatus
          approved_by: string | null
          approved_at: string | null
          proposing_committee_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          rock_id: string
          title: string
          description?: string | null
          owner_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: ProjectStatus
          estimated_hours?: number
          budget_amount?: number
          actual_cost?: number
          approval_status?: ApprovalStatus
          approved_by?: string | null
          approved_at?: string | null
          proposing_committee_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          rock_id?: string
          title?: string
          description?: string | null
          owner_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: ProjectStatus
          estimated_hours?: number
          budget_amount?: number
          actual_cost?: number
          approval_status?: ApprovalStatus
          approved_by?: string | null
          approved_at?: string | null
          proposing_committee_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Milestones (enhanced with vendor and cost tracking)
      milestones: {
        Row: {
          id: string
          team_id: string
          project_id: string
          title: string
          description: string | null
          due_date: string | null
          status: MilestoneStatus
          completed_at: string | null
          vendor_id: string | null
          budgeted_cost: number
          actual_cost: number
          depends_on_id: string | null
          notes: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          project_id: string
          title: string
          description?: string | null
          due_date?: string | null
          status?: MilestoneStatus
          completed_at?: string | null
          vendor_id?: string | null
          budgeted_cost?: number
          actual_cost?: number
          depends_on_id?: string | null
          notes?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          project_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          status?: MilestoneStatus
          completed_at?: string | null
          vendor_id?: string | null
          budgeted_cost?: number
          actual_cost?: number
          depends_on_id?: string | null
          notes?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Tasks
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          completed: boolean
          due_date: string | null
          priority: TaskPriority
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          completed?: boolean
          due_date?: string | null
          priority?: TaskPriority
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          completed?: boolean
          due_date?: string | null
          priority?: TaskPriority
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Action Items (formerly Commitments)
      commitments: {
        Row: {
          id: string
          team_id: string
          owner_id: string
          week_of: string
          project_id: string
          key_result_id: string
          rock_id: string | null
          definition_of_done: string
          status: CommitmentStatus
          notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          owner_id: string
          week_of: string
          project_id: string
          key_result_id: string
          rock_id?: string | null
          definition_of_done: string
          status?: CommitmentStatus
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          owner_id?: string
          week_of?: string
          project_id?: string
          key_result_id?: string
          rock_id?: string | null
          definition_of_done?: string
          status?: CommitmentStatus
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Issues (formerly Engagements) - Administrative tasks and issues
      issues: {
        Row: {
          id: string
          team_id: string
          owner_id: string
          title: string
          description: string | null
          customer_id: string | null
          customer_name: string
          date: string
          issue_type: string
          priority: IssuePriority
          status: IssueStatus
          assigned_to: string | null
          due_date: string | null
          source: IssueSource
          source_id: string | null
          priority_id: string | null  // Link to annual priority (rock)
          property_address: string | null
          lot_number: string | null
          notes: string | null
          rock_id: string | null  // Legacy alias for priority_id
          resolved_at: string | null
          last_edited_by: string | null
          last_edited_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          owner_id: string
          title: string
          description?: string | null
          customer_id?: string | null
          customer_name?: string
          date?: string
          issue_type?: string
          priority?: IssuePriority
          status?: IssueStatus
          assigned_to?: string | null
          due_date?: string | null
          source?: IssueSource
          source_id?: string | null
          priority_id?: string | null
          property_address?: string | null
          lot_number?: string | null
          notes?: string | null
          rock_id?: string | null
          resolved_at?: string | null
          last_edited_by?: string | null
          last_edited_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          owner_id?: string
          title?: string
          description?: string | null
          customer_id?: string | null
          customer_name?: string
          date?: string
          issue_type?: string
          priority?: IssuePriority
          status?: IssueStatus
          assigned_to?: string | null
          due_date?: string | null
          source?: IssueSource
          source_id?: string | null
          priority_id?: string | null
          property_address?: string | null
          lot_number?: string | null
          notes?: string | null
          rock_id?: string | null
          resolved_at?: string | null
          last_edited_by?: string | null
          last_edited_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Vendor Bids
      vendor_bids: {
        Row: {
          id: string
          team_id: string
          project_id: string
          vendor_id: string
          total_amount: number
          bid_date: string
          status: BidStatus
          notes: string | null
          document_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          project_id: string
          vendor_id: string
          total_amount: number
          bid_date?: string
          status?: BidStatus
          notes?: string | null
          document_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          project_id?: string
          vendor_id?: string
          total_amount?: number
          bid_date?: string
          status?: BidStatus
          notes?: string | null
          document_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Bid Categories (line items in a bid)
      bid_categories: {
        Row: {
          id: string
          bid_id: string
          category_name: string
          amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bid_id: string
          category_name: string
          amount: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bid_id?: string
          category_name?: string
          amount?: number
          notes?: string | null
          created_at?: string
        }
      }
      // Signals (evidence/observations)
      signals: {
        Row: {
          id: string
          team_id: string
          owner_id: string
          title: string
          description: string | null
          signal_type: SignalType | null
          priority_id: string | null
          issue_id: string | null
          property_address: string | null
          lot_number: string | null
          date: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          owner_id: string
          title: string
          description?: string | null
          signal_type?: SignalType | null
          priority_id?: string | null
          issue_id?: string | null
          property_address?: string | null
          lot_number?: string | null
          date?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          owner_id?: string
          title?: string
          description?: string | null
          signal_type?: SignalType | null
          priority_id?: string | null
          issue_id?: string | null
          property_address?: string | null
          lot_number?: string | null
          date?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Issue Templates (for recurring tasks)
      issue_templates: {
        Row: {
          id: string
          team_id: string
          title: string
          description: string | null
          issue_type: string
          priority: IssuePriority
          default_assignee_id: string | null
          recurrence_rule: RecurrenceRule | null
          next_due_date: string | null
          category_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          description?: string | null
          issue_type?: string
          priority?: IssuePriority
          default_assignee_id?: string | null
          recurrence_rule?: RecurrenceRule | null
          next_due_date?: string | null
          category_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          description?: string | null
          issue_type?: string
          priority?: IssuePriority
          default_assignee_id?: string | null
          recurrence_rule?: RecurrenceRule | null
          next_due_date?: string | null
          category_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Documents (attachments)
      documents: {
        Row: {
          id: string
          team_id: string
          uploaded_by: string
          name: string
          description: string | null
          storage_type: DocumentStorageType
          storage_path: string | null
          external_url: string | null
          mime_type: string | null
          file_size: number | null
          entity_type: DocumentEntityType
          entity_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          uploaded_by: string
          name: string
          description?: string | null
          storage_type: DocumentStorageType
          storage_path?: string | null
          external_url?: string | null
          mime_type?: string | null
          file_size?: number | null
          entity_type: DocumentEntityType
          entity_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          uploaded_by?: string
          name?: string
          description?: string | null
          storage_type?: DocumentStorageType
          storage_path?: string | null
          external_url?: string | null
          mime_type?: string | null
          file_size?: number | null
          entity_type?: DocumentEntityType
          entity_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Assets
      assets: {
        Row: {
          id: string
          team_id: string
          name: string
          asset_type: string
          description: string | null
          url: string | null
          status: AssetStatus
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          asset_type: string
          description?: string | null
          url?: string | null
          status?: AssetStatus
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          asset_type?: string
          description?: string | null
          url?: string | null
          status?: AssetStatus
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Enablement Events (community events for HOA)
      enablement_events: {
        Row: {
          id: string
          team_id: string
          event_type: string
          title: string
          description: string | null
          event_date: string | null
          location: string | null
          capacity: number | null
          attendee_count: number
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          event_type: string
          title: string
          description?: string | null
          event_date?: string | null
          location?: string | null
          capacity?: number | null
          attendee_count?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          event_type?: string
          title?: string
          description?: string | null
          event_date?: string | null
          location?: string | null
          capacity?: number | null
          attendee_count?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Audit Log
      audit_log: {
        Row: {
          id: string
          org_id: string
          team_id: string | null
          actor_user_id: string
          entity_type: string
          entity_id: string
          action: string
          before: Json | null
          after: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          team_id?: string | null
          actor_user_id: string
          entity_type: string
          entity_id: string
          action: string
          before?: Json | null
          after?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          team_id?: string | null
          actor_user_id?: string
          entity_type?: string
          entity_id?: string
          action?: string
          before?: Json | null
          after?: Json | null
          created_at?: string
        }
      }
      // Junction tables
      issue_domains: {
        Row: {
          issue_id: string
          domain_id: string
        }
        Insert: {
          issue_id: string
          domain_id: string
        }
        Update: {
          issue_id?: string
          domain_id?: string
        }
      }
      issue_vendors: {
        Row: {
          issue_id: string
          vendor_id: string
        }
        Insert: {
          issue_id: string
          vendor_id: string
        }
        Update: {
          issue_id?: string
          vendor_id?: string
        }
      }
      issue_assets: {
        Row: {
          issue_id: string
          asset_id: string
        }
        Insert: {
          issue_id: string
          asset_id: string
        }
        Update: {
          issue_id?: string
          asset_id?: string
        }
      }
      project_assets: {
        Row: {
          project_id: string
          asset_id: string
        }
        Insert: {
          project_id: string
          asset_id: string
        }
        Update: {
          project_id?: string
          asset_id?: string
        }
      }
      enablement_event_assets: {
        Row: {
          enablement_event_id: string
          asset_id: string
        }
        Insert: {
          enablement_event_id: string
          asset_id: string
        }
        Update: {
          enablement_event_id?: string
          asset_id?: string
        }
      }
    }
    Functions: {
      calculate_rock_progress: {
        Args: { rock_uuid: string }
        Returns: number
      }
      get_project_budget_summary: {
        Args: { p_project_id: string }
        Returns: {
          budget_amount: number
          actual_cost: number
          remaining_budget: number
          milestone_budgeted: number
          milestone_actual: number
          bid_count: number
          selected_bid_amount: number | null
        }[]
      }
      get_milestone_chain: {
        Args: { p_milestone_id: string }
        Returns: {
          id: string
          title: string
          vendor_name: string | null
          due_date: string | null
          status: string
          depth: number
        }[]
      }
      get_issue_stats: {
        Args: { p_team_id: string }
        Returns: {
          total_count: number
          open_count: number
          in_progress_count: number
          resolved_count: number
          urgent_count: number
          overdue_count: number
        }[]
      }
      get_oem_buying_patterns: {
        Args: { limit_count?: number; filter_team_id?: string }
        Returns: {
          oem1_name: string
          oem2_name: string
          pair_count: number
        }[]
      }
      is_org_admin: {
        Args: { check_org_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { check_org_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { check_team_id: string }
        Returns: boolean
      }
      is_team_manager: {
        Args: { check_team_id: string }
        Returns: boolean
      }
      get_org_from_team: {
        Args: { check_team_id: string }
        Returns: string
      }
    }
  }
}

// ============================================
// CONVENIENCE TYPES (Row types)
// ============================================

export type Org = Database['public']['Tables']['orgs']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamMembership = Database['public']['Tables']['team_memberships']['Row']
export type OrgAdmin = Database['public']['Tables']['org_admins']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Domain = Database['public']['Tables']['domains']['Row']
export type Category = Domain // Alias for HOA terminology
export type ActivityType = Database['public']['Tables']['activity_types']['Row']
export type Vendor = Database['public']['Tables']['vendors']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Rock = Database['public']['Tables']['rocks']['Row']
export type Priority = Rock // Alias for HOA terminology
export type KeyResult = Database['public']['Tables']['key_results']['Row']
export type SuccessCriteria = KeyResult // Alias for HOA terminology
export type Project = Database['public']['Tables']['projects']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Commitment = Database['public']['Tables']['commitments']['Row']
export type ActionItem = Commitment // Alias for HOA terminology
export type Issue = Database['public']['Tables']['issues']['Row']
export type VendorBid = Database['public']['Tables']['vendor_bids']['Row']
export type BidCategory = Database['public']['Tables']['bid_categories']['Row']
export type Signal = Database['public']['Tables']['signals']['Row']
export type IssueTemplate = Database['public']['Tables']['issue_templates']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type EnablementEvent = Database['public']['Tables']['enablement_events']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

// Legacy aliases for backward compatibility during migration
export type OEM = Vendor
export type Engagement = Issue

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export type TeamWithOrg = Team & {
  org: Org
}

export type TeamMembershipWithUser = TeamMembership & {
  user: Profile
}

export type TeamWithMembers = Team & {
  members: TeamMembershipWithUser[]
}

export type RockWithProjects = Rock & {
  projects: Project[]
  owner: Profile | null
}

export type RockWithKeyResults = Rock & {
  key_results: KeyResult[]
  owner: Profile | null
}

export type RockWithAll = Rock & {
  projects: Project[]
  key_results: KeyResult[]
  owner: Profile | null
}

// HOA Alias
export type PriorityWithProjects = RockWithProjects
export type PriorityWithSuccessCriteria = RockWithKeyResults
export type PriorityWithAll = RockWithAll

export type ProjectWithTasks = Project & {
  tasks: Task[]
  owner: Profile | null
}

export type ProjectWithMilestones = Project & {
  milestones: Milestone[]
  owner: Profile | null
}

export type ProjectWithBids = Project & {
  vendor_bids: VendorBid[]
  owner: Profile | null
}

export type ProjectWithAll = Project & {
  tasks: Task[]
  milestones: MilestoneWithVendor[]
  vendor_bids: VendorBidWithCategories[]
  rock: Rock | null
  owner: Profile | null
  approved_by_user: Profile | null
}

export type MilestoneWithVendor = Milestone & {
  vendor: Vendor | null
  depends_on: Milestone | null
}

export type VendorBidWithCategories = VendorBid & {
  categories: BidCategory[]
  vendor: Vendor
}

export type VendorBidWithAll = VendorBid & {
  categories: BidCategory[]
  vendor: Vendor
  project: Project
}

export type CommitmentWithRelations = Commitment & {
  project: Project
  key_result: KeyResult
  rock: Rock | null
  owner: Profile
}

// HOA Alias
export type ActionItemWithRelations = CommitmentWithRelations

export type IssueWithRelations = Issue & {
  domains: Domain[]
  vendors: Vendor[]
  assets: Asset[]
  rock: Rock | null
  customer: Customer | null
  owner: Profile | null
  assigned_to_user: Profile | null
  last_editor: Profile | null
}

// Legacy alias
export type EngagementWithRelations = IssueWithRelations

export type SignalWithRelations = Signal & {
  priority: Rock | null
  issue: Issue | null
  owner: Profile
}

export type IssueTemplateWithRelations = IssueTemplate & {
  category: Domain | null
  default_assignee: Profile | null
}

export type DocumentWithRelations = Document & {
  uploaded_by_user: Profile
}

export type VendorWithBids = Vendor & {
  vendor_bids: VendorBid[]
}

export type VendorWithMilestones = Vendor & {
  milestones: Milestone[]
}

export type AssetWithIssues = Asset & {
  issues: Issue[]
}

// Legacy alias
export type AssetWithEngagements = AssetWithIssues

// ============================================
// USER CONTEXT TYPES
// ============================================

export type UserWithRoles = Profile & {
  teams: (Team & { role: TeamRole; org: Org })[]
  orgsAdmin: Org[]
}

export type ActiveTeamContext = {
  team: Team
  org: Org
  role: TeamRole
  isOrgAdmin: boolean
}

// ============================================
// CARRYOVER TYPES (for action item workflow)
// ============================================

export type CarryoverAction = 'carry' | 'split' | 'convert_to_issue' | 'drop'

export type CommitmentCarryover = {
  action: CarryoverAction
  originalCommitmentId: string
  newCommitmentIds: string[]
}

// HOA Alias
export type ActionItemCarryover = CommitmentCarryover

// ============================================
// BUDGET & REPORTING TYPES
// ============================================

export type ProjectBudgetSummary = {
  projectId: string
  projectTitle: string
  budgetAmount: number
  actualCost: number
  remainingBudget: number
  percentUsed: number
  milestoneBudgetTotal: number
  milestoneActualTotal: number
}

export type IssueStats = {
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  resolvedIssues: number
  urgentIssues: number
}

export type MilestoneChainItem = {
  id: string
  title: string
  status: string
  dueDate: string | null
  vendorName: string | null
  budgetedCost: number
  actualCost: number
  dependsOnId: string | null
  depth: number
}

// VendorWithProjects - Full vendor profile with project history
export type VendorWithProjects = Vendor & {
  milestones: Array<{
    id: string
    title: string
    status: MilestoneStatus
    due_date: string | null
    budgeted_cost: number
    actual_cost: number
    project: { id: string; title: string; team_id: string }
  }>
  bids: Array<{
    id: string
    total_amount: number
    status: BidStatus
    bid_date: string
    project: { id: string; title: string; team_id: string }
  }>
  stats: {
    totalMilestones: number
    completedMilestones: number
    totalBudgeted: number
    totalActual: number
    totalBids: number
    wonBids: number
  }
}
