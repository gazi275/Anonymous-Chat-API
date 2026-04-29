# Architecture Overview

```mermaid
%% Detailed system diagram showing components and message flow
flowchart TB
  subgraph client_side [Clients]
    A[Browser / Mobile / Tests]
  end

  subgraph infra [Infrastructure]
    LB[Load Balancer]
    subgraph apps [App Cluster]
      direction LR
      App1[Node App Instance 1]
      App2[Node App Instance 2]
      App3[Node App Instance N]
    end

    Redis[(Redis Cluster)]
    Postgres[(PostgreSQL Primary)]
  end

  A -->|HTTP /api/v1| LB
  A -->|Socket.io /chat| LB
  LB --> App1
  LB --> App2
  LB --> App3

  App1 -->|writes| Postgres
  App2 -->|writes| Postgres
  App3 -->|writes| Postgres

  App1 --> Redis
  App2 --> Redis
  App3 --> Redis

  App1 ---|socket-adapter| Redis
  App2 ---|socket-adapter| Redis
  App3 ---|socket-adapter| Redis

  classDef infra fill:#f8f9fa,stroke:#ddd
  class infra infra
```

## Message flow (high level)

1. Client posts to `POST /api/v1/rooms/:id/messages` (HTTP)
2. App instance validates session from Redis, writes message to PostgreSQL via Drizzle
3. App publishes `message:new` to Redis pub/sub channel
4. All App instances subscribe to the channel and broadcast to their connected Socket.io clients (Redis adapter ensures cross-instance delivery)

## Operational notes

- Run multiple app instances behind a load balancer to scale WebSocket connections.
- Use Redis for both the Socket.io adapter and for session+presence state to avoid in-memory maps.
- Migrations are managed with `drizzle-kit` and checked-in SQL is available in `drizzle/` for reviewers and CI.

## Diagram usage

Paste the Mermaid block above directly into `ARCHITECTURE.md` or GitHub README to render the diagram.
