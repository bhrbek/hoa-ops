'use server'

/**
 * @deprecated This file is deprecated. Use issues.ts instead.
 * These wrapper functions exist for backward compatibility only.
 */

import {
  getIssues,
  getActiveIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueStats,
  getActiveIssueStats,
  getIssuesByStatus,
} from './issues'

import type { IssueWithRelations, Issue, IssuePriority, IssueStatus } from '@/types/supabase'

// Re-export types for backward compatibility
export type Engagement = Issue
export type EngagementWithRelations = IssueWithRelations

/**
 * @deprecated Use getIssues instead
 */
export async function getEngagements(
  teamId: string,
  options?: {
    limit?: number
    offset?: number
    priorityId?: string
    status?: IssueStatus
    priority?: IssuePriority
  }
): Promise<IssueWithRelations[]> {
  return getIssues(teamId, options)
}

/**
 * @deprecated Use getActiveIssues instead
 */
export async function getActiveEngagements(options?: {
  limit?: number
  offset?: number
  priorityId?: string
  status?: IssueStatus
  priority?: IssuePriority
}): Promise<IssueWithRelations[]> {
  return getActiveIssues(options)
}

/**
 * @deprecated Use getIssue instead
 */
export async function getEngagement(issueId: string): Promise<IssueWithRelations | null> {
  return getIssue(issueId)
}

/**
 * @deprecated Use createIssue instead
 */
export async function createEngagement(data: Parameters<typeof createIssue>[0]): Promise<Issue> {
  return createIssue(data)
}

/**
 * @deprecated Use updateIssue instead
 */
export async function updateEngagement(
  issueId: string,
  data: Parameters<typeof updateIssue>[1]
): Promise<Issue> {
  return updateIssue(issueId, data)
}

/**
 * @deprecated Use deleteIssue instead
 */
export async function deleteEngagement(issueId: string): Promise<void> {
  return deleteIssue(issueId)
}

/**
 * @deprecated Use getIssueStats instead
 */
export async function getEngagementStats(teamId: string) {
  return getIssueStats(teamId)
}

/**
 * @deprecated Use getActiveIssueStats instead
 */
export async function getActiveEngagementStats() {
  return getActiveIssueStats()
}

/**
 * @deprecated Use getIssuesByStatus instead
 */
export async function getEngagementsByType(teamId: string, status: IssueStatus) {
  return getIssuesByStatus(teamId, status)
}
