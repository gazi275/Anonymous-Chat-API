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