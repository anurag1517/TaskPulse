# TaskPulse 😤

A full-stack task manager with priority-based nudging, reminder logic, push notifications, and an activity log. The app is split into a Prisma-backed Express API and a Vite + React frontend.

## Features

- Auth with password hashing and JWT-based session checks
- Task creation, updates, deletion, and completion toggling
- Priority-based task styling and urgency messaging
- Background reminder checks for overdue or soon-due tasks
- Web push subscriptions with VAPID keys
- Per-user activity log
- Rate limiting, Helmet headers, and input validation

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma |
| Validation | zod |
| Push | `web-push` |

## Architecture

The app follows a simple layered flow:

```text
Request → Route → Middleware → Controller → Service → Prisma/Database
```

- `backend/src/routes` defines the API endpoints
- `backend/src/middleware` handles auth, validation, rate limiting, and errors
- `backend/src/controllers` are thin request/response handlers
- `backend/src/services` contains task and reminder logic
- `backend/prisma/schema.prisma` defines the Postgres schema

## Repository structure

```text
TaskPulse/
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── payloadSchema/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── tsconfig.json
└── frontend/
    └── frontend-task/
        ├── package.json
        ├── vite.config.ts
        ├── public/
        ├── src/
        │   ├── api/
        │   ├── assets/
        │   ├── components/
        │   ├── context/
        │   ├── hooks/
        │   ├── pages/
        │   ├── types/
        │   ├── utils/
        │   ├── App.tsx
        │   ├── main.tsx
        │   └── index.css
        └── tsconfig.*
```

## Getting started

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env   # if you add your own env file locally
npm run dev
```

The backend runs on `http://localhost:5011` by default.

### 2) Frontend

```bash
cd frontend/frontend-task
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Environment variables

Create a `.env` file in `backend/` with the values your app needs:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port, defaults to `5011` |
| `USER_JWT_SECRET` | Yes | Secret for JWT signing |
| `USER_COOKIE_NAME` | No | Cookie name used by auth middleware |
| `EXPIRE_COOKIE_MS` | No | Cookie lifetime in milliseconds |
| `CORS_ORIGIN` | No | Comma-separated allowed frontend origins |
| `NODE_ENV` | No | `production` or `development` |
| `VAPID_PUBLIC_KEY` | For push | Web push public key |
| `VAPID_PRIVATE_KEY` | For push | Web push private key |
| `VAPID_SUBJECT` | For push | Usually `mailto:your@email.com` |
| `CRON_SECRET` | For reminders | Shared secret for external reminder triggers |
| `LOG_LEVEL` | No | Logging level |

## API overview

All endpoints are mounted under `/api`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current authenticated user |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get a task by ID |
| PATCH | `/api/tasks/:id` | Update a task |
| PATCH | `/api/tasks/:id/toggle` | Toggle completion state |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/logs` | Get activity log |
| DELETE | `/api/logs` | Clear logs |
| GET | `/api/push/public-key` | Fetch VAPID public key |
| POST | `/api/push/subscribe` | Subscribe device for push notifications |
| POST | `/api/push/unsubscribe` | Remove push subscription |
| GET | `/api/reminders/health` | Reminder service health check |
| POST | `/api/reminders/trigger` | Trigger reminder scan (requires `CRON_SECRET`) |
| GET | `/health` | App health check |

## Reminder flow

The reminder service checks pending tasks on a timer and sends notifications when they are due or overdue.

- The backend starts a scheduler from `backend/src/server.ts`
- `backend/src/services/reminder.service.ts` periodically scans tasks
- If reminders are triggered externally, the app exposes `POST /api/reminders/trigger`
- The request must include the shared `CRON_SECRET` via `x-cron-secret` header or `?secret` query param

## Database

The schema is defined in `backend/prisma/schema.prisma` using Prisma with PostgreSQL.

Available models include:

- `User`
- `Task`
- `Log`
- `PushSub`

## Development notes

- The frontend is nested under `frontend/frontend-task`, not at the repo root
- The backend uses Prisma and Express; there is no root-level `render.yaml` in this repository
- The app is designed for a local development flow with separate frontend and backend processes

## License

MIT
