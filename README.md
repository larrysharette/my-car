# My Car

Single-vehicle tracker for gas fill-ups, maintenance history, wishlist parts, gallery files, and service interval reminders.

## Stack

- **Next.js 16** (App Router) + React 19
- **PostgreSQL** via Drizzle ORM
- **TanStack Form** + Zod validation
- **Vercel Blob** (or local filesystem) for file storage
- **Argon2** password hashing, cookie sessions

## Prerequisites

- Node.js 20+
- PostgreSQL database

## Environment variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/my_car

# Storage (optional — defaults to local filesystem in dev)
BLOB_READ_WRITE_TOKEN=

# Session secret (production)
SESSION_SECRET=change-me-in-production
```

## Local setup

```bash
npm install
npm run db:push    # apply schema to Postgres
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Storage adapter

Gallery and maintenance file uploads use `lib/storage`. With `BLOB_READ_WRITE_TOKEN` set, files go to Vercel Blob; otherwise they are stored under `public/uploads/` in development.

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/gas` | Gas log |
| `/maintenance` | Maintenance history |
| `/wishlist` | Parts wishlist |
| `/gallery` | Photos & files |
| `/settings` | Car profile & tracked services |
| `/export` | CSV/PDF export |

## Auth model

One login = one car account (`cars` table). Sessions are stored in `car_sessions` with an httpOnly cookie.

## License

Private project.
