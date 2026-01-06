export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      rocks: {
        Row: {
          id: string
          title: string
          owner_id: string | null
          quarter: string
          status: 'On Track' | 'At Risk' | 'Off Track' | 'Done'
          perfect_outcome: string
          worst_outcome: string | null
          progress_override: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          owner_id?: string | null
          quarter?: string
          status?: 'On Track' | 'At Risk' | 'Off Track' | 'Done'
          perfect_outcome: string
          worst_outcome?: string | null
          progress_override?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          owner_id?: string | null
          quarter?: string
          status?: 'On Track' | 'At Risk' | 'Off Track' | 'Done'
          perfect_outcome?: string
          worst_outcome?: string | null
          progress_override?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          rock_id: string
          title: string
          owner_id: string | null
          start_date: string | null
          end_date: string | null
          status: 'Active' | 'Done' | 'Blocked'
          estimated_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rock_id: string
          title: string
          owner_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'Active' | 'Done' | 'Blocked'
          estimated_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rock_id?: string
          title?: string
          owner_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'Active' | 'Done' | 'Blocked'
          estimated_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          completed: boolean
          due_date: string | null
          priority: 'low' | 'medium' | 'high'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          completed?: boolean
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          completed?: boolean
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
        }
      }
      engagements: {
        Row: {
          id: string
          user_id: string
          customer_name: string
          date: string
          activity_type: 'Workshop' | 'Demo' | 'POC' | 'Advisory'
          revenue_impact: number
          gp_impact: number
          notes: string | null
          rock_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_name: string
          date?: string
          activity_type: 'Workshop' | 'Demo' | 'POC' | 'Advisory'
          revenue_impact?: number
          gp_impact?: number
          notes?: string | null
          rock_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_name?: string
          date?: string
          activity_type?: 'Workshop' | 'Demo' | 'POC' | 'Advisory'
          revenue_impact?: number
          gp_impact?: number
          notes?: string | null
          rock_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Domain = Database['public']['Tables']['domains']['Row']
export type OEM = Database['public']['Tables']['oems']['Row']
export type Rock = Database['public']['Tables']['rocks']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Engagement = Database['public']['Tables']['engagements']['Row']

// Extended types with relations
export type RockWithProjects = Rock & {
  projects: Project[]
  owner: Profile | null
}

export type RockWithEvidence = RockWithProjects & {
  evidence: Engagement[]
}

export type EngagementWithRelations = Engagement & {
  domains: Domain[]
  oems: OEM[]
  rock: Rock | null
}

export type ProjectWithTasks = Project & {
  tasks: Task[]
  owner: Profile | null
}
