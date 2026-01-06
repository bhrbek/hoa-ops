# HEADWATERS - DOMAIN MODEL

This document defines the canonical domain concepts used throughout the system.
Each term has an explicit meaning and explicit non-meanings.

---

## Organization (Org)

A company or entity that uses Headwaters. Contains one or more Teams.

- Has Org Admins who can manage all teams
- Customers are scoped to the Org (shared across teams)

---

## Team

A group of TSAs within an Organization who share Rocks, Projects, and Engagements.

- Has Managers and TSAs
- All team data (Rocks, Projects, Engagements, Assets) is team-scoped
- TSAs can edit any engagement within their team (handoff support)

---

## Engagement

A discrete customer-facing interaction (workshop, demo, POC, meeting).

- Always occurring
- Logged quickly (<30s)
- Captures business reality and trends

Engagements:
- Are sand
- Do NOT advance strategy
- Do NOT affect Rock or Project health

Captured attributes may include:
- Customer (org-scoped)
- Date
- OEMs involved
- Domain(s) of technology
- Assets used
- Influenced revenue
- Influenced GP

---

## Rock

A quarterly strategic commitment to create or materially improve a capability.

A Rock:
- Has a 90-day horizon
- Has exactly one Perfect Outcome
- Has one or more Build Signals
- Exists to change what the organization can do

A Rock is NOT:
- A revenue target
- An engagement goal
- A list of tasks

---

## Perfect Outcome

A concise (max 3 sentences) definition of the capability that must exist at the end of the quarter.

A Perfect Outcome:
- Is internally verifiable
- Describes a capability, not an activity
- Does not reference revenue or pipeline

---

## Build Signal

A measurable outcome that proves progress toward a Rock's Perfect Outcome.

Build Signals:
- Are the ONLY source of Rock health
- Have target values and current values
- Have due dates
- Have status: not_started | in_progress | achieved | missed

Examples:
- "3 partners integrated with API" (target: 3, unit: partners)
- "Training completed for 5 team members" (target: 5, unit: people)

Build Signals are NOT:
- Revenue metrics
- Engagement counts
- Vanity metrics

---

## Project

A time-bound internal effort that produces part of a Rock's Perfect Outcome.

Projects:
- Have a single Owner
- Have a defined start and end
- Contain Milestones
- Are the vehicle for Build Signal achievement

A Project is NOT:
- Customer delivery work
- A loose idea
- A task list

---

## Milestone

A meaningful capability checkpoint within a Project.

Milestones:
- Represent real progress toward the Perfect Outcome
- Have dates and owners
- Gate Project health

---

## Commitment

A weekly execution promise that advances a Build Signal through a Project.

Commitments:
- MUST link to a Project (required)
- MUST link to a Build Signal (required)
- MUST have a "Done means..." definition
- Are finishable in 7 days or less
- NEVER link to Engagements

Commitment status:
- planned: Not yet started
- done: Definition of done met
- blocked: Cannot proceed
- slipped: Carried to next week

---

## Asset

A reusable sales asset (deck, demo, whitepaper, POC kit) used in engagements.

Assets:
- Are team-scoped
- Can be linked to engagements for tracking
- Enable revenue-by-asset reporting
- Have status: active | archived

---

## Customer

An account that the team engages with.

Customers:
- Are ORG-SCOPED (shared across all teams in org)
- Are NOT team-scoped
- Have status: active | churned | prospect

---

## Enablement Event

A team learning or development activity (training, certification, lunch-and-learn).

Enablement Events:
- Track team capability building
- Are separate from customer engagements
- Replace the deprecated "Swarms" concept

---

## Rock Health

The execution state of a Rock based solely on Build Signal progress.

Possible states:
- On Track: Build Signals progressing as expected
- At Risk: Some Build Signals behind
- Off Track: Critical Build Signals missed
- Done: All Build Signals achieved

**Business outcomes NEVER affect Rock health.**

---

## Capacity (Headwaters)

A visual representation of available weekly effort.

Rules:
- 20% reserved for Water (admin, internal noise) - this is FIXED
- Remaining capacity allocated to Strategic (Projects) and Tactical work
- Over-allocation is a visible problem, not an error to auto-fix
- "Shield Up" warning when at 90%+ capacity

---

## Business Observability

Insights derived from Engagement data to understand how the business operates.

Includes:
- OEM buying patterns (which OEMs pair together)
- Technology domain trends
- Revenue by asset
- Influenced revenue and GP
- Velocity and deal shape

Business Observability:
- Informs future Rock selection
- Does NOT validate Rock completion
- Is displayed in the Reports section

---

## Key Separation

### Strategy Execution Lens (The Climb)
- Rocks
- Build Signals
- Projects
- Milestones
- Commitments
- Capacity

### Business Observability Lens (Reports)
- Engagement trends
- OEM involvement and pairings
- Domains and innovation themes
- Influenced revenue and GP
- Asset effectiveness

**These two lenses MUST NOT be merged.**
