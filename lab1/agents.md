# Agent System Guidelines

## Project Context

TypeScript/NestJS backend for a to-do list application built with DDD, Hexagonal Architecture (Ports & Adapters), CQRS, Event Sourcing, and BDD testing.

Organized by bounded contexts, not technical layers alone. Preserve existing patterns before adding new abstractions.

## Core Architecture Rules

1. **Respect the Hexagonal boundaries**
   - Presentation/API code belongs in the infrastructure/presentation layer.
   - Application use cases are implemented by Command Handlers, Query Handlers and Event Handlers.
   - Domain rules belong in the domain layer.
   - Database and external-service implementations belong to infrastructure adapters.
   - Application code depends on ports/interfaces, not concrete infrastructure adapters.

2. **Keep CQRS strict**
   - Commands change state; Queries only read state.
   - Do not put mutations into Query Handlers.
   - Do not use Query Handlers as a shortcut around the application/domain layer.
   - Name new use cases according to their intent, e.g. `ListTodosQuery`, `GetTodoQuery`, `CreateTodoCommand`.
   - Examples: 
   
                `CreateTodoCommand` → Command Handler → changes Todo
   
                 `ListTodosQuery`     → Query Handler   → reads Todo data
   
3. **Use ports and adapters for data access**
   - Define repository/service contracts as ports inside the application core.
   - Implement database access in infrastructure adapters.
   - Do not call PostgreSQL/NATS/external services directly from domain objects or handlers when a port is appropriate.
   - New features should remain testable with mocked port implementations.
   - Ports live inside the application core of a bounded context.
   - Concrete repository/external-service implementations live in infrastructure.
   - Example from the Todo structure: .../todo/ports defines the contract, while the repository adapter implements that contract. A Command Handler depends on the port, not on PostgreSQL.

4. **Keep domain behavior explicit**
   - Put business invariants, domain rules, entities, value objects, aggregates and domain events in the domain layer.
   - Represent meaningful business failures with explicit domain/application error types instead of leaking infrastructure errors into the domain.
   - Avoid moving business rules into controllers or SQL adapters.

5. **Treat integration events as versioned contracts**
   - Cross-module communication uses contracts/integration events.
   - Integration-event contracts must not expose domain objects.
   - When an externally consumed integration-event shape changes incompatibly, introduce a new contract version rather than silently breaking consumers.

6. **Test behavior through the application layer**
   - Prefer use-case/BDD-style tests around Command Handlers and Query Handlers.
   - Use mock repositories and mock services as adapters for ports in fast business-logic tests.
   - Add integration tests when behavior depends on real PostgreSQL/event-store infrastructure.
   - Every new feature should add tests for its success path and important business failures.

7. **Use DTOs at external boundaries**
   - Controllers receive/return DTOs rather than exposing domain entities directly.
   - Query results should be shaped for the external contract/read model.
   - Keep transport-specific validation and serialization concerns out of domain entities.
   - REST DTOs belong to backend/src/api.
   - Keep them separate from domain entities.
   - Example: a Todo REST request is represented by an API DTO, then mapped to a Command/Query; the domain Todo is not used as the HTTP request/response model.

## TypeScript Conventions

- Keep TypeScript types explicit at application boundaries.
- Do not introduce `any` unless there is a documented technical reason.
- Prefer existing project utilities and the existing DDD tactical-core abstractions over introducing a new Result/Error/Entity framework.
- Follow the repository's existing NestJS, ESLint and Prettier configuration.

---

## Testing
Verify observable behavior, not implementation details:
- **Application/Domain:** Fast unit tests with mocked ports covering success, business-rule failures, and regressions.
- **Infrastructure:** Integration tests for real database or messaging behavior.
Always run and verify relevant test suites before marking work complete.

---

## Working With Existing Code
Before building a feature:
1. Locate the bounded context.
2. Find a similar existing feature.
3. Trace its full flow (controller, DTO, handler, domain, port, adapter, tests).
4. Follow its conventions.
Do not refactor unrelated code during feature implementation.

---

## Avoid Overengineering
Keep abstractions lean:
- No duplicate repository ports, unnecessary mappers, or helper services for minor code moves.
- No Event Sourcing or integration events unless explicitly required by context.

---

## Definition of Done
A feature is complete when:
- Placed in the correct bounded context with proper CQRS separation.
- Boundaries, ports, and DTO mappings are respected.
- Business rules stay in the domain and errors follow existing conventions.
- Events match established Event Sourcing/integration rules.
- Relevant tests and checks are run and passing.