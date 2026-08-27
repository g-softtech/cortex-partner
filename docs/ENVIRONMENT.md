# Environment Variables

All secrets must be configured as environment variables. **Never commit real values to Git.**

The `.env` file is gitignored. Only `.env.example` (with placeholders) is committed.

---

## Required Variables

### Database (Neon)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string. Used for all application queries. Format: `postgresql://user:pass@ep-xxx-pooler.neon.tech/dbname?sslmode=require` |
| `DIRECT_URL` | ✅ | Neon **direct** (non-pooled) connection string. Used by Prisma for migrations. Format: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` (no `-pooler` in hostname) |

> **Note:** Currently both point to the pooled string (KI-001). For production, `DIRECT_URL` should be the non-pooled URL.

### Authentication

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | Full URL of the app. Dev: `http://localhost:3000`. Prod: `https://partner.thecortexsystems.com` |

### Cloudflare R2 Storage

| Variable | Required | Description |
|---|---|---|
| `R2_ACCOUNT_ID` | ✅ (Phase 8+) | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | ✅ (Phase 8+) | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | ✅ (Phase 8+) | R2 API token secret key |
| `R2_BUCKET_NAME` | ✅ (Phase 8+) | Name of the private R2 bucket |

### Email (Resend)

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | ✅ (Phase 11+) | Resend API key (`re_...`) |

---

## Environment Separation

| Environment | Where variables live |
|---|---|
| Development | `.env` (gitignored, local only) |
| Preview (Vercel) | Vercel Dashboard → Environment Variables → Preview |
| Production | Vercel Dashboard → Environment Variables → Production |

**Never put production credentials in `.env` files. Never commit `.env`.**

---

## .env.example

The committed `.env.example` file contains only placeholder values and comments. It documents what is needed without exposing real secrets.
