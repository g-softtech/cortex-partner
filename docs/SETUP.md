# Setup Instructions

## Prerequisites

- Node.js `22.16.0` (use `.nvmrc` with `nvm use` if available)
- npm `11.x`
- Access to a dedicated Neon PostgreSQL database
- Git

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd cortex-partner

# 2. Install dependencies (use npm, not yarn or pnpm)
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in your actual values
```

---

## Environment Setup

Copy `.env.example` to `.env` and provide real values. See `ENVIRONMENT.md` for full documentation.

At minimum for local development you need:
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct (non-pooled) connection string
- `NEXTAUTH_SECRET` — generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000`

---

## Database Commands

```bash
# Validate the schema
npx prisma validate

# Apply existing migrations to your database
npx prisma migrate deploy

# Create a new migration during development (dev only)
npx prisma migrate dev --name <descriptive-name>

# Generate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

**NEVER use:**
```bash
npx prisma db push  # Do not use in production
npx prisma migrate reset  # Do not use in production
```

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Build

```bash
npm run build
```

---

## Linting

```bash
npm run lint
```

---

## Admin Account Setup

The first admin account is created via a secure one-time script. There is no public admin registration page.

```bash
# (Script to be documented when implemented in Phase 4)
npm run create-admin
```

---

## Vercel Deployment

1. Connect the repository to Vercel.
2. Set all required environment variables in Vercel Dashboard (not `.env`).
3. Vercel will run `npm run build` automatically.
4. The `postinstall` or a Vercel deploy hook will run `npx prisma migrate deploy` to apply migrations to production.

See `ENVIRONMENT.md` for the list of required variables.

---

## DNS

Configure `partner.thecortexsystems.com` to point to the Vercel deployment via a CNAME record.
