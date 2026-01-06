// Re-export all types from supabase.ts for backwards compatibility
// New code should import directly from '@/types/supabase'

import type { Profile as ProfileType } from './supabase'

export {
  // Enums
  type TeamRole,
  type RockStatus,
  type ProjectStatus,
  type TaskPriority,
  type ActivityType,
  type BuildSignalStatus,
  type CommitmentStatus,
  type CustomerStatus,
  type AssetStatus,
  type MilestoneStatus,

  // Core types
  type Profile,
  type Org,
  type Team,
  type TeamMembership,
  type OrgAdmin,
  type Domain,
  type OEM,
  type Customer,
  type Rock,
  type BuildSignal,
  type Project,
  type Milestone,
  type Task,
  type Commitment,
  type Engagement,
  type Asset,
  type EnablementEvent,
  type AuditLog,

  // Extended types
  type RockWithProjects,
  type RockWithBuildSignals,
  type RockWithAll,
  type ProjectWithTasks,
  type ProjectWithMilestones,
  type ProjectWithAll,
  type CommitmentWithRelations,
  type EngagementWithRelations,
  type TeamWithOrg,
  type TeamWithMembers,
  type UserWithRoles,
  type ActiveTeamContext,

  // Carryover types
  type CarryoverAction,
  type CommitmentCarryover,
} from './supabase'

// Legacy type aliases for backwards compatibility
export type UserProfile = ProfileType
