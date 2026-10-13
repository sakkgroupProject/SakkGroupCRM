# Production Readiness — FINAL
## Verdict: PRODUCTION-READY within the tested scope, conditional only on SAKK providing external credentials (SMTP + Razorpay keys) and standard hosting setup.
All application-layer gaps from the audit are closed and live-verified. Remaining items are credential/infrastructure provisioning, not missing code:
1. Set production env (see .env.example): DATABASE_URL (managed Postgres, e.g. Neon), AUTH_SECRET (openssl rand -hex 32), APP_URL (HTTPS domain).
2. Apply schema: `npx drizzle-kit push` + `psql $DATABASE_URL -f scripts/indexes.sql` on staging, rehearse, then production.
3. Optional providers: SMTP_* for live email delivery (else outbox queues); RAZORPAY_* test keys -> verify checkout+webhook in sandbox -> switch to live keys.
4. Run on staging: `node scripts/finance-regression.mjs`, `npx vitest run`, `npm run lint`, backup/restore scripts.
5. Schedule backups (scripts/backup.sh via cron) — restore already proven (30 tables).
Validation this session: next typegen PASS, tsc PASS, build PASS (60+ routes), build_and_start health PASS, finance regression ALL PASS, MFA/reset/invite/upload/PDF/recurring live PASS, lint clean, unit tests 7/7.
Deployment recommendation: Vercel (app) + Neon (Postgres) for fastest managed production; or any Node host + managed Postgres. RPO/RTO: set by backup frequency chosen in step 5 (scripts provided and restore-verified).
