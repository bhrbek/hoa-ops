export interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  capacity_hours: number // Default 40
}

export interface Rock {
  id: string
  title: string
  owner_id: string
  quarter: string // "Q1 2026"
  status: 'On Track' | 'Off Track' | 'At Risk' | 'Done'
  perfect_outcome: string
  progress_percent: number // Auto-calculated or manual override
  projects?: Project[] // Hydrated children
}

export interface Project {
  id: string
  rock_id: string
  title: string
  owner_id: string
  start_date: string
  end_date: string
  status: 'Active' | 'Done'
  estimated_hours: number
}

export interface Engagement {
  id: string
  customer_name: string
  date: string
  activity_type: 'Workshop' | 'Demo' | 'POC' | 'Advisory'
  revenue_impact: number
  gp_impact: number
  domains: string[] // ["Wi-Fi", "SD-WAN"]
  oems: string[] // ["Cisco", "Arista"]
  rock_id?: string // The "Evidence" Link
  notes: string
}

export interface Domain {
  id: string
  name: string
}

export interface OEM {
  id: string
  name: string
}
