# /startup - Session Initialization

Load context and prepare for a new Claude Code session.

## Usage
```
/startup         # Full initialization
```

## What This Does

1. **Load memory graph** - Retrieve persistent context
2. **Check project state** - Version, git status, current branch
3. **Review active tasks** - Load docs/TASKS.md
4. **Verify MCP servers** - Ensure postgres, github, memory are connected

## Startup Sequence

### 1. Read Memory Graph
```
mcp__memory__read_graph
```
Contains: Project info, key principles, current sprint status

### 2. Check Version
```bash
cat VERSION
```

### 3. Git Status
```bash
git status --short
git log --oneline -5
```

### 4. Review Tasks
Read `docs/TASKS.md` for current phase and active work.

### 5. Verify MCP Connections
- `mcp__postgres__query` - Database access
- `mcp__github__*` - GitHub integration
- `mcp__memory__*` - Persistent storage
- `mcp__filesystem__*` - File operations

## Quick Context

**Project**: Headwaters (EOS-inspired strategy execution system)
**Stack**: Next.js, Supabase, TypeScript, TailwindCSS
**Supabase Ref**: pstevmcaxrqalafoyxmy

## Key Principles (from memory)

1. Engagements are sand - never affect Rock health
2. Rock health comes ONLY from Key Results
3. Commitments MUST link to Project AND Key Result
4. Customers are org-scoped, not team-scoped
5. All tables use soft delete

## Available Skills

| Skill | Purpose |
|-------|---------|
| /test | Run modal and functional tests |
| /build | Build and verify |
| /lint | Code quality checks |
| /typecheck | TypeScript checking |
| /db | Database operations |
| /debug-rls | RLS permission debugging |
| /deploy-check | Verify deployment status |
| /commit | Safe git commits |
| /pr | Create pull requests |
| /review | Production readiness review |
| /migration | Database migration guide |
| /new-dialog | Dialog component template |
| /new-action | Server action template |
