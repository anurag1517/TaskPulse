# TaskPulse 😤

A full-stack task manager that nags you until the work is done. Priority-based animated UI, hourly reminders until completion, web push notifications, and a per-user activity log. Built to run entirely on free tiers.

> **P1** tasks get an angry face and a pulsing red glow. **P4** tasks get a calm smile. Finish a task and the face turns into a 🎉.

## Features

- **Auth:** signup and login with hashed passwords (bcrypt) and JWT sessions
- **Tasks:** topic, time, location, remarks, priority (P1–P4), completion status and assigner
- **Priority theming:** color scheme and animated faces per priority, responsive on phone, tablet and desktop
- **Hourly reminders:** once a task is past due and not done, it is re-sent every hour until completed
- **Web push notifications:** reminders reach the device even when the tab is closed (installable PWA)
- **Optional email reminders:** via Brevo's free HTTPS API
- **Activity log:** a per-user history of signups, logins, task changes and reminders
- **Security basics:** input validation (zod), rate limiting, Helmet headers, parameterized SQL

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (plain `pg`, no ORM) |
| Validation | zod |
| Push | `web-push` (VAPID), service worker |
| Hosting (free) | Vercel (frontend), Render (API), Supabase (Postgres) |
| Scheduling (free) | cron-job.org |

## Architecture

Requests flow through clear layers, and each layer only talks to the one below it:

```
Request → Router → Middleware (rate limit, JWT check, validation)
        → Controller → Service → Repository → PostgreSQL
```

- **Routes** map URLs to controllers and attach middleware
- **Middleware** handles JWT auth, validation, rate limiting and errors
- **Controllers** read the request and send the response, with no business logic
- **Services** hold the business rules (task logic, reminders, push, email)
- **Repositories** are the only place SQL lives

No ORM is needed: the schema is small, and a repository layer keeps queries in one place. If the schema grows a lot, Drizzle or Kysely can be added later without touching controllers or services.

## Folder structure

```
taskpulse-app/
├── README.md
├── render.yaml                  Render blueprint (free plan)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts            boot: migrate DB, start scheduler, listen
│       ├── app.ts               express app: middleware, routes, error handling
│       ├── config/              env loading and validation
│       ├── db/                  pg pool, schema/migrations
│       ├── routes/              auth, tasks, logs, push, cron
│       ├── middleware/          auth (JWT), cronAuth, validate, rateLimiter, errorHandler
│       ├── controllers/         thin request/response handlers
│       ├── services/            auth, task, log, push, mail, reminder
│       ├── repositories/        user, task, log, pushSub (all SQL)
│       ├── schemas/             zod request schemas
│       ├── types/               shared TypeScript types
│       └── utils/               HttpError, asyncHandler, priority helpers
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── vercel.json              proxies /api/* to the Render API
    ├── index.html
    ├── public/                  sw.js (push), manifest.json, icons
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/                 fetch client and per-resource API modules
        ├── context/             AuthContext
        ├── hooks/               useTasks, usePush, useToasts
        ├── components/          TaskCard, TaskList, TaskForm, ActivityLog, Toasts...
        ├── pages/               AuthPage, Dashboard
        ├── types/
        └── styles.css
```

## Getting started (local)

**Requirements:** Node 18+ and a PostgreSQL database (a free Supabase project works).

```bash
# 1. backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, ...
npm install
npm run keys                # generates VAPID keys; paste them into .env
npm run dev                 # http://localhost:3000

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :3000)
```

Tables are created automatically when the backend starts.

## Environment variables (backend)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Supabase: use the **Session pooler** string) |
| `JWT_SECRET` | yes | Long random string used to sign tokens |
| `CRON_SECRET` | yes (prod) | Bearer secret that cron-job.org sends to `/api/cron/remind` |
| `NODE_ENV` | prod | Set to `production` on Render |
| `PORT` | no | Defaults to 3000 |
| `CORS_ORIGIN` | no | Comma-separated allowed origins (not needed when using the Vercel `/api` rewrite) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | for push | Generate once with `npm run keys` |
| `VAPID_SUBJECT` | for push | `mailto:` plus your email, a contact label for push services |
| `BREVO_API_KEY` / `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | no | Enables email reminders |

Never commit `.env` or share the VAPID private key.

## API overview

All routes are under `/api`. Authenticated routes need a valid JWT.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup`, `/auth/login` | Create account / log in |
| POST | `/auth/logout` | Log out (recorded in the activity log) |
| GET | `/auth/me` | Current user |
| GET / POST | `/tasks` | List / create tasks |
| PUT / DELETE | `/tasks/:id` | Update / delete a task |
| PATCH | `/tasks/:id/done` | Mark done or reopen |
| GET / DELETE | `/logs` | View / clear the activity log |
| GET | `/push/key` | VAPID public key |
| POST | `/push/subscribe`, `/push/unsubscribe` | Register / remove a device |
| ALL | `/cron/remind` | Sends due reminders (needs `CRON_SECRET`) |
| GET | `/health` | Health check (outside `/api`) |

## How reminders work

Render's free plan sleeps when idle, so the server can't rely on its own timer. Instead:

1. **cron-job.org** calls `/api/cron/remind` every 10 minutes with `Authorization: Bearer <CRON_SECRET>`.
2. The server finds tasks that are **past due, not done and not reminded in the last hour**, claiming them atomically in a single SQL `UPDATE ... RETURNING` so nothing is sent twice.
3. For each task it writes an activity-log entry, sends a **push** to the owner's devices and, if configured, an **email**.
4. This repeats hourly until the task is marked done.

The 10-minute pings also keep the free Render service awake and stop Supabase from pausing for inactivity.

## Deployment (free tier)

1. **Supabase:** create a project, then copy the **Session pooler** connection string (with your password) as `DATABASE_URL`.
2. **GitHub:** push this repo.
3. **Render:** New → Blueprint, pick the repo (`render.yaml`, free plan; root directory `backend`, build `npm install --include=dev && npm run build`, start `npm start`). Set the env vars above, including `NODE_ENV=production`. Note the `https://….onrender.com` URL.
4. **Vercel:** import the repo with **Root Directory** `frontend` (Vite preset). First edit `frontend/vercel.json` and replace `YOUR-APP.onrender.com` with your Render host.
5. **cron-job.org:** create a job for `https://YOUR-APP.onrender.com/api/cron/remind`, every 10 minutes, with the header `Authorization: Bearer <CRON_SECRET>`.
6. **Use it:** open the Vercel URL, sign up and tap **Enable alerts** on each device. On iPhone, first use Safari → Share → Add to Home Screen and open the app from that icon.

## Security notes

- Passwords are hashed with bcrypt; SQL is fully parameterized; all input is validated with zod.
- Rate limiting: a burst limiter (20 requests / 10 s), a global limiter (200 / 15 min) and a stricter auth limiter (failed attempts only). `trust proxy` must be enabled behind Render so limits apply per client IP.
- Helmet adds standard security headers; request bodies are size-limited.
- Keep the frontend and API on the same site (the Vercel `/api` rewrite) so cookies or tokens avoid cross-site problems.

## Free-tier caveats

- After a quiet period, the first load can take about a minute while Render wakes up.
- Reminders arrive within about 10 minutes of the hour, not exactly on it.
- Brevo's free email cap is 300 per day; push notifications have no such cap.
- iPhone push only works for the app installed to the Home Screen.
- The free tiers' limits can change, so check each provider's current pricing page.

## License

MIT
