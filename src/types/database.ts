// Core data types for "The Jar" application
// Based on product-design-specs.md

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// User Profile (extends Supabase auth.users)
export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  capacity_hours: number // Default 40
  timezone: string // e.g. 'America/Chicago'
  role: 'admin' | 'user'
  notification_enabled: boolean
  notification_time: string // e.g. '09:00'
  created_at: string
  updated_at: string
}

// Engagement Status
export type EngagementStatus = 'Lead' | 'Active' | 'Closed' | 'Archived'

// Engagement (The Sensor Log)
export interface Engagement {
  id: string
  user_id: string
  customer_name: string
  internal_req_id: string | null
  domains: string[] // e.g. ["Wi-Fi", "SD-WAN"]
  oems: string[] // e.g. ["Cisco", "Aruba"]
  themes: string[] // e.g. ["efficiency", "automation"]
  is_strategic_signal: boolean // The "Flag" for leadership
  signal_context: string | null // Pivot context when signal is true
  estimated_effort: number // Hours
  priority: 'High' | 'Medium' | 'Low'
  status: EngagementStatus
  revenue_amt: number
  next_steps: string | null
  notes: Json | null // Rich text
  created_at: string
  updated_at: string
}

// Rock (Strategic Goals)
export type RockStatus = 'Active' | 'Completed' | 'Shelved'

export interface Rock {
  id: string
  title: string
  owner_id: string
  perfect_outcome: string
  worst_outcome: string
  status: RockStatus
  progress: number // 0-100 percentage
  swarm_day: string | null // e.g. 'tuesday'
  start_date: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

// Swarm (The Beacon)
export interface Swarm {
  id: string
  rock_id: string
  swarm_date: string // ISO Date YYYY-MM-DD
  active: boolean
  description: string | null
  created_at: string
}

// Block Types for Commitment Board
export type BlockType = 'Rock' | 'Pebble' | 'Sand'

// Commitment (The Board Blocks)
export interface Commitment {
  id: string
  user_id: string
  date: string // ISO Date YYYY-MM-DD
  type: BlockType
  description: string // e.g. "3 Demos" or "Wi-Fi 7 Lab"
  hours_value: number // Calculated value for "The Shield" logic
  rock_id: string | null
  engagement_id: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

// Domain lookup table
export interface Domain {
  id: string
  name: string
  color: string | null
  active: boolean
}

// OEM lookup table
export interface OEM {
  id: string
  name: string
  logo_url: string | null
  active: boolean
}

// Capacity calculation helpers
export const BLOCK_HOURS: Record<BlockType, number> = {
  Rock: 4,
  Pebble: 2,
  Sand: 0.5,
}

export const WHIRLWIND_FACTOR = 0.2 // 20% lost to admin/water
export const REAL_CAPACITY_FACTOR = 1 - WHIRLWIND_FACTOR // 80%
export const DAILY_CAPACITY_HOURS = 8
export const WEEKLY_CAPACITY_DEFAULT = 40

// Calculate real capacity (after water deduction)
export function calculateRealCapacity(totalHours: number): number {
  return totalHours * REAL_CAPACITY_FACTOR
}

// Check if user is overloaded
export function isOverloaded(
  weeklyCommitments: number,
  capacityHours: number = WEEKLY_CAPACITY_DEFAULT
): boolean {
  return weeklyCommitments > calculateRealCapacity(capacityHours)
}

// Check if day is overloaded
export function isDayOverloaded(dailyHours: number): boolean {
  return dailyHours > DAILY_CAPACITY_HOURS
}

// Supabase Database types (for type-safe queries)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      engagements: {
        Row: Engagement
        Insert: Omit<Engagement, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Engagement, 'id' | 'created_at' | 'updated_at'>>
      }
      rocks: {
        Row: Rock
        Insert: Omit<Rock, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Rock, 'id' | 'created_at' | 'updated_at'>>
      }
      swarms: {
        Row: Swarm
        Insert: Omit<Swarm, 'id' | 'created_at'>
        Update: Partial<Omit<Swarm, 'id' | 'created_at'>>
      }
      commitments: {
        Row: Commitment
        Insert: Omit<Commitment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Commitment, 'id' | 'created_at' | 'updated_at'>>
      }
      domains: {
        Row: Domain
        Insert: Omit<Domain, 'id'>
        Update: Partial<Omit<Domain, 'id'>>
      }
      oems: {
        Row: OEM
        Insert: Omit<OEM, 'id'>
        Update: Partial<Omit<OEM, 'id'>>
      }
    }
  }
}
