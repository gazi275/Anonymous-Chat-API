# Recommended Folder Structure

This layout follows conventions used by mature NestJS teams: clear separation between feature modules, infra concerns, and shared utilities.

```
src/
├─ main.ts                 # Nest bootstrap
├─ app.module.ts           # Root DI module
├─ config/                 # Env schemas and configuration
├─ database/               # Drizzle schema & DB service
├─ redis/                  # Redis clients, adapters, presence
├─ auth/                   # Login controller + auth service
├─ rooms/                  # Room and message feature module
├─ realtime/               # Socket gateways and WS concerns
├─ common/                 # Filters, interceptors, guards, utils
├─ tests/                  # Integration and unit tests
└─ scripts/                # Dev ops and helper scripts

drizzle/                   # Checked-in migrations and metadata
Dockerfile
docker-compose.yml
README.md
ARCHITECTURE.md
```

Why this structure:

- Feature folders (`rooms`, `auth`, `realtime`) keep related controllers, services, dtos, and tests together.
- `common` contains cross-cutting concerns (validation pipes, response envelope, custom errors).
- `database` and `redis` are infra modules that expose services consumed by feature modules.
