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
export type TaskPriority = 'low' | 'medium' | 'high'
export type ActivityTypeName = string // Dynamic from activity_types table
export type BuildSignalStatus = 'not_started' | 'in_progress' | 'achieved' | 'missed'
export type CommitmentStatus = 'planned' | 'done' | 'blocked' | 'slipped'
export type CustomerStatus = 'active' | 'churned' | 'prospect'
export type AssetStatus = 'active' | 'archived'
export type MilestoneStatus = 'pending' | 'completed' | 'missed'

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
      // Reference data
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
      oems: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
        }
      }
      // Customers (org-scoped)
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
      // Strategy - Rocks
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
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Build Signals
      build_signals: {
        Row: {
          id: string
          team_id: string
          rock_id: string
          title: string
          description: string | null
          target_value: number | null
          current_value: number
          unit: string | null
          status: BuildSignalStatus
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
          status?: BuildSignalStatus
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
          status?: BuildSignalStatus
          due_date?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Projects
      projects: {
        Row: {
          id: string
          team_id: string | null
          rock_id: string
          title: string
          owner_id: string | null
          start_date: string | null
          end_date: string | null
          status: ProjectStatus
          estimated_hours: number
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
          owner_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: ProjectStatus
          estimated_hours?: number
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
          owner_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: ProjectStatus
          estimated_hours?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      // Milestones
      milestones: {
        Row: {
          id: string
          team_id: string
          project_id: string
          title: string
          due_date: string | null
          status: MilestoneStatus
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          team_id: string
          project_id: string
          title: string
          due_date?: string | null
          status?: MilestoneStatus
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          project_id?: string
          title?: string
          due_date?: string | null
          status?: MilestoneStatus
          completed_at?: string | null
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
      // Commitments
      commitments: {
        Row: {
          id: string
          team_id: string
          owner_id: string
          week_of: string
          project_id: string
          build_signal_id: string
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
          build_signal_id: string
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
          build_signal_id?: string
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
      // Engagements
      engagements: {
        Row: {
          id: string
          team_id: string
          owner_id: string
          customer_id: string | null
          customer_name: string
          date: string
          activity_type: string
          revenue_impact: number
          gp_impact: number
          notes: string | null
          rock_id: string | null
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
          customer_id?: string | null
          customer_name: string
          date?: string
          activity_type: string
          revenue_impact?: number
          gp_impact?: number
          notes?: string | null
          rock_id?: string | null
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
          customer_id?: string | null
          customer_name?: string
          date?: string
          activity_type?: string
          revenue_impact?: number
          gp_impact?: number
          notes?: string | null
          rock_id?: string | null
          last_edited_by?: string | null
          last_edited_at?: string | null
          created_at?: string
          updated_at?: string
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
      // Enablement Events
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
      engagement_domains: {
        Row: {
          engagement_id: string
          domain_id: string
        }
        Insert: {
          engagement_id: string
          domain_id: string
        }
        Update: {
          engagement_id?: string
          domain_id?: string
        }
      }
      engagement_oems: {
        Row: {
          engagement_id: string
          oem_id: string
        }
        Insert: {
          engagement_id: string
          oem_id: string
        }
        Update: {
          engagement_id?: string
          oem_id?: string
        }
      }
      engagement_assets: {
        Row: {
          engagement_id: string
          asset_id: string
        }
        Insert: {
          engagement_id: string
          asset_id: string
        }
        Update: {
          engagement_id?: string
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
    }
    Functions: {
      calculate_rock_progress: {
        Args: { rock_uuid: string }
        Returns: number
      }
      get_oem_buying_patterns: {
        Args: { limit_count?: number }
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
export type ActivityType = Database['public']['Tables']['activity_types']['Row']
export type OEM = Database['public']['Tables']['oems']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Rock = Database['public']['Tables']['rocks']['Row']
export type BuildSignal = Database['public']['Tables']['build_signals']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Commitment = Database['public']['Tables']['commitments']['Row']
export type Engagement = Database['public']['Tables']['engagements']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type EnablementEvent = Database['public']['Tables']['enablement_events']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

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

export type RockWithBuildSignals = Rock & {
  build_signals: BuildSignal[]
  owner: Profile | null
}

export type RockWithAll = Rock & {
  projects: Project[]
  build_signals: BuildSignal[]
  owner: Profile | null
}

export type ProjectWithTasks = Project & {
  tasks: Task[]
  owner: Profile | null
}

export type ProjectWithMilestones = Project & {
  milestones: Milestone[]
  owner: Profile | null
}

export type ProjectWithAll = Project & {
  tasks: Task[]
  milestones: Milestone[]
  rock: Rock | null
  owner: Profile | null
}

export type CommitmentWithRelations = Commitment & {
  project: Project
  build_signal: BuildSignal
  rock: Rock | null
  owner: Profile
}

export type EngagementWithRelations = Engagement & {
  domains: Domain[]
  oems: OEM[]
  assets: Asset[]
  rock: Rock | null
  customer: Customer | null
  owner: Profile | null
  last_editor: Profile | null
}

export type AssetWithEngagements = Asset & {
  engagements: Engagement[]
}

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
// CARRYOVER TYPES (for commitment workflow)
// ============================================

export type CarryoverAction = 'carry' | 'split' | 'convert_to_issue' | 'drop'

export type CommitmentCarryover = {
  action: CarryoverAction
  originalCommitmentId: string
  newCommitmentIds: string[]
}
