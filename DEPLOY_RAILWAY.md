# Deploy APSUSM on Railway

This repo is now prepared for Railway with per-service config files:
- `apsusm-backend/railway.json`
- `card-generator/railway.json`
- `apsusm-frontend/railway.json`

## 1) Create services in one Railway project

In Railway, create **one Project** and add these resources:
1. **PostgreSQL** database
2. **Web Service** from `apsusm-backend`
3. **Web Service** from `card-generator`
4. **Web Service** from `apsusm-frontend`

When creating each service, set the **Root Directory** to the folder above.
Railway will use each folder's `railway.json` automatically.

## 2) Backend (`apsusm-backend`) variables

Set these in backend service Variables:

Required:
- `SPRING_DATASOURCE_URL=jdbc:postgresql://<PGHOST>:<PGPORT>/<PGDATABASE>`
- `SPRING_DATASOURCE_USERNAME=<PGUSER>`
- `SPRING_DATASOURCE_PASSWORD=<PGPASSWORD>`
- `SPRING_DATASOURCE_DRIVERCLASSNAME=org.postgresql.Driver`
- `SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect`
- `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- `SPRING_H2_CONSOLE_ENABLED=false`
- `APP_CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>.up.railway.app`
- `APP_CARD_GENERATOR_URL=https://<your-card-generator-domain>.up.railway.app`
- `PAYSTACK_CALLBACK_URL=https://<your-frontend-domain>.up.railway.app/payment/verify`

Secrets:
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `MAIL_HOST`
- `MAIL_PORT` (usually `587`)
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## 3) Card generator (`card-generator`) variables

Set:
- `OPENAI_API_KEY`

Optional:
- `CARD_TEMPLATE`
- `CARD_EXAMPLE`
- `CARD_TEMPLATE_BACK`

Health check endpoint:
- `GET /api/health`

## 4) Frontend (`apsusm-frontend`) variables

Set:
- `VITE_API_BASE_URL=https://<your-backend-domain>.up.railway.app/api`

## 5) Paystack setup

- Callback URL: `https://<your-frontend-domain>.up.railway.app/payment/verify`
- Webhook URL: `https://<your-backend-domain>.up.railway.app/api/webhooks/paystack`

## 6) Smoke test

1. Open frontend URL
2. Submit registration
3. Confirm backend logs show register + payment init
4. Confirm card generator health endpoint is OK
5. Complete payment and verify callback/webhook flow

## Notes

- Frontend now supports env-based backend URL via `VITE_API_BASE_URL`.
- Local development still works with `/api` fallback in `apsusm-frontend/src/api.js`.
- Existing `render.yaml` can remain in repo; Railway ignores it.
