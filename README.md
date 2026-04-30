# Anonymous Chat API

Real-time anonymous group chat service built with NestJS, PostgreSQL, Drizzle ORM, Redis, and Socket.io.

## Features

- Username-only login with Redis-backed 24 hour sessions
- Room creation, deletion, and message history persisted in PostgreSQL
- Live active-user counts stored in Redis
- Socket.io chat namespace with Redis adapter fan-out across instances
- Consistent JSON response envelope for every HTTP endpoint

## Local setup

1. Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
copy .env.example .env
```

4. Push the schema to PostgreSQL:

```bash
npm run db:push
```

5. Start the app:

```bash
npm run start:dev
```

The API is available at `http://localhost:3000/api/v1`.

## Important endpoints

- `POST /api/v1/login`
- `GET /api/v1/rooms`
- `POST /api/v1/rooms`
- `GET /api/v1/rooms/:id`
- `DELETE /api/v1/rooms/:id`
- `GET /api/v1/rooms/:id/messages`
- `POST /api/v1/rooms/:id/messages`

## WebSocket

Connect to `/chat?token=<sessionToken>&roomId=<roomId>`.

Use `room:leave` to leave gracefully.

📖 **Comprehensive WebSocket Documentation:** See [docs/WEBSOCKET_COMPLETE_FLOW.md](docs/WEBSOCKET_COMPLETE_FLOW.md)

Quick reference: [docs/WEBSOCKET_QUICK_REFERENCE.md](docs/WEBSOCKET_QUICK_REFERENCE.md)

## Documentation

- **[EVENTS_SEND_VS_RECEIVE.md](docs/EVENTS_SEND_VS_RECEIVE.md)** — **START HERE!** Clear breakdown: which events to EMIT, which to LISTEN. With examples and decision tree.
- **[WEBSOCKET_COMPLETE_FLOW.md](docs/WEBSOCKET_COMPLETE_FLOW.md)** — Full step-by-step flow from connection → joined → messages → disconnect. With Redis architecture and multi-instance scaling.
- **[WEBSOCKET_QUICK_REFERENCE.md](docs/WEBSOCKET_QUICK_REFERENCE.md)** — One-page summary: events, payloads, error codes, checklist.
- **[WEBSOCKET.md](docs/WEBSOCKET.md)** — Original technical spec: auth rules, event contract, troubleshooting.
- **[CLIENT_IMPLEMENTATION.js](docs/CLIENT_IMPLEMENTATION.js)** — Ready-to-use JavaScript client with all event handlers and REST calls.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System design overview.

## API Contract

Every response uses a consistent envelope:

```json
{
  "success": true,
  "data": { }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

See `src/common/filters/api-exception.filter.ts` and `src/common/interceptors/response-envelope.interceptor.ts`.