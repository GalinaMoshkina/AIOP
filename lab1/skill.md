# Skill: Feature Development Workflow

## Purpose
A step-by-step workflow for implementing or extending features. Refer to `AGENTS.md` for architectural rules.

---

## Workflow

### Step 1 — Locate Bounded Context
Identify the owning module. Do not place feature logic in shared/generic modules out of convenience.

### Step 2 — Find a Similar Feature
Find an existing, structurally similar feature to use as a template for naming and directory layout.

### Step 3 — Classify Operation
- **Command:** State-changing (`DTO -> Command -> Handler -> Domain -> Port -> Adapter`).
- **Query:** Read-only (`DTO -> Query -> Handler -> Read Model/Port -> DTO`).

### Step 4 — Trace Dependency Flow
Verify all layers involved before writing code:
`Controller -> DTO -> Command/Query -> Handler -> Domain -> Port -> Adapter`

### Step 5 — Design Minimal Changes
Extend existing DTOs, ports, and domain methods where possible instead of adding parallel abstractions.

### Step 6 — Implement Logic in Domain
Keep orchestration in handlers and business validation within domain models.

### Step 7 — Connect Infrastructure via Ports
Route all persistence and external network calls through existing or extended ports.

### Step 8 — Handle Errors
Use existing domain errors for business rule violations; handle infrastructure exceptions at adapters.

### Step 9 — Apply Events (If Applicable)
Use event-sourcing handlers for state changes or outbox publishing for integration events only when required.

### Step 10 — Preserve External Contracts
Map domain models to external DTOs at controller boundaries.

### Step 11 — Follow TypeScript Standards
Use explicit types, avoid `any`, and follow project formatting rules.

### Step 12 — Add Tests
Add fast unit tests (with mocked ports) for success/failure paths and integration tests for real infrastructure dependencies.

### Step 13 — Architectural Review
Review diff against the checklist below.

### Step 14 — Verify
Run tests, linter, and type checks. Confirm all pass.

---

## Checklist

Pre-Implementation:
- [ ] Context and reference feature identified
- [ ] Command vs Query classified

Implementation:
- [ ] Domain logic isolated from infrastructure
- [ ] Direct database access avoided in handlers/controllers
- [ ] Boundary DTOs used without exposing domain entities
- [ ] Existing ports, errors, and mappers extended where possible

Completion:
- [ ] Unit and integration tests added
- [ ] Linters, type checks, and test suites executed and passing
- [ ] No unrelated refactoring included