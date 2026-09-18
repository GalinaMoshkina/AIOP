# AGENTS.md

## Project Overview
TypeScript/NestJS backend for a to-do list application built with DDD, Hexagonal Architecture (Ports & Adapters), CQRS, Event Sourcing, and BDD testing.

Organized by bounded contexts, not technical layers alone. Preserve existing patterns before adding new abstractions.

---

## 1. Architecture and Layer Boundaries
Keep responsibilities separated:
- **Presentation / API:** Controllers and DTOs handle input validation, invoke the application layer, and format responses. No business rules or database access.
- **Application:** Command and Query Handlers coordinate use cases using ports. No framework infrastructure code.
- **Domain:** Pure business logic (entities, aggregates, value objects, domain events, business errors). Zero dependencies on external frameworks, databases, or transport protocols.
- **Infrastructure:** Adapters implementing ports for databases, messaging, and third-party services. Details must not leak into the domain.

---

## 2. Hexagonal Architecture: Ports and Adapters
Dependencies point inward: `Application/Domain -> Port -> Adapter -> External System`.
Never bypass ports to access databases, brokers, or external APIs directly. Extend an existing port before creating a new one.

---

## 3. CQRS
Separate state changes from reads:
- **Commands (`Create...`, `Update...`, `Delete...`):** Mutate state. Handlers coordinate; domain models execute business rules.
- **Queries (`Get...`, `List...`, `Search...`, `Find...`):** Read-only. Handlers retrieve/shape data without state mutation.
Do not mix command and query responsibilities in a single handler.

---

## 4. Domain and Application Errors
Use explicit domain/application errors instead of leaking infrastructure exceptions or generic `Error` instances.
Search for and reuse existing error types before creating new ones. Keep error handling consistent with neighboring code.

---

## 5. DTOs and External Boundaries
Keep transport DTOs separate from domain models (`External DTO <-> Domain Model`).
Controllers must expose DTOs, never domain entities directly. Use existing mapping conventions.

---

## 6. Event Sourcing and Domain Events
State changes to event-sourced aggregates must follow existing command/event flows.
Never update event-sourced state by writing directly to persistence. Do not introduce Event Sourcing for read-only operations.

---

## 7. Integration Events
- **Domain events:** Internal domain state changes.
- **Integration events:** External contracts between bounded contexts.
Follow existing outbox/publishing flows and versioning rules. Do not expose internal domain details as external integration contracts.

---

## 8. TypeScript Conventions
- Use explicit types at boundaries; avoid `any`.
- Follow ESLint/Prettier configs and existing naming conventions.
- Prefer minimal changes. Do not introduce generic abstractions unnecessarily.

---

## 9. Testing
Verify observable behavior, not implementation details:
- **Application/Domain:** Fast unit tests with mocked ports covering success, business-rule failures, and regressions.
- **Infrastructure:** Integration tests for real database or messaging behavior.
Always run and verify relevant test suites before marking work complete.

---

## 10. Working With Existing Code
Before building a feature:
1. Locate the bounded context.
2. Find a similar existing feature.
3. Trace its full flow (controller, DTO, handler, domain, port, adapter, tests).
4. Follow its conventions.
Do not refactor unrelated code during feature implementation.

---

## 11. Avoid Overengineering
Keep abstractions lean:
- No duplicate repository ports, unnecessary mappers, or helper services for minor code moves.
- No Event Sourcing or integration events unless explicitly required by context.

---

## 12. Definition of Done
A feature is complete when:
- Placed in the correct bounded context with proper CQRS separation.
- Boundaries, ports, and DTO mappings are respected.
- Business rules stay in the domain and errors follow existing conventions.
- Events match established Event Sourcing/integration rules.
- Behavioral unit/integration tests, linting, and type checks are run and passing.