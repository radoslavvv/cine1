# System tests

Tests that exercise the running application across HTTP live here.

- [Load tests](load/README.md): k6 correctness and capacity workloads against an isolated API and PostgreSQL database.

Tests that belong to one codebase stay with it:

- `src/backend/CinemaR.Tests`: fast application, architecture and HTTP contract tests.
- `src/backend/CinemaR.IntegrationTests`: PostgreSQL persistence and API integration tests.
- `src/frontend/tests`: Vitest and React Testing Library tests.

The repository does not have a Playwright suite yet. Add browser tests as a separate suite here when implemented, rather than mixing browser automation with k6 traffic generation.

See [the testing strategy](../docs/testing.md) for all commands and CI behavior.
