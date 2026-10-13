# SAKK Group CRM — Feature Status (FINAL, evidence-based)
All items below were live-tested in this audit against PostgreSQL unless marked otherwise. Test fixtures were cleaned afterwards; DB ships empty for SAKK data.

| Area | Status | Evidence |
|---|---|---|
| Invite-only registration | VERIFIED | Register without invite -> 403; admin invitation -> register as finance OK; invite reuse -> 403; first user = admin |
| Login, DB rate limiting, security headers | VERIFIED (headers in build), rate limit DB-backed (`rate_limits` table) | Login tests pass; distributed (Postgres) limiter replaces in-memory |
| MFA (TOTP RFC6238) | VERIFIED | Setup secret -> enable with Python-computed TOTP -> login returns mfaRequired -> wrong code 401 -> correct code session -> disable. Unit tests 7/7 |
| Password reset + session invalidation | VERIFIED | Forgot (no enumeration) -> token from outbox -> reset OK -> OLD cookie 401 (sessionVersion bump) -> new login OK -> token reuse 400 (1h expiry, hashed tokens) |
| Change password | Implemented + Settings UI | Verifies current password, bumps sessionVersion |
| RBAC (admin/manager/finance/sales/support) | VERIFIED | 403 suites from prior audit + finance role can record payments, cannot manage team |
| Contacts/Companies/Deals/Pipeline/Activities/Products | VERIFIED | Prior audit live CRUD + duplicate-contact 409 + lead conversion |
| Quotations (totals, convert, PDF, email) | VERIFIED | Math 1980, PDF 200 application/pdf, email queued, double-convert 409 |
| Contracts/Projects/Tasks (budget variance) | VERIFIED | Variance 9500 live, task assignment notifications |
| Invoices (line items, immutability, PDF, email) | VERIFIED | PDF generated (real %PDF bytes), allocated invoice edit/delete 409 |
| Payments & Allocations (transactional, row locks) | VERIFIED | scripts/finance-regression.mjs ALL PASS (100000/50000/120000 -> 0/30000/0); parallel allocation race: 1 success 1 rejected |
| Credit Notes (transactional) | VERIFIED | 30000 -> 25000 |
| Recurring Invoices | VERIFIED | Schedule due today -> Run generated 1 real invoice, next date advances |
| Vendors / Expenses (SoD approval) | VERIFIED | Prior audit: submit/approve separation enforced |
| Documents (real upload) | VERIFIED | Multipart upload -> stored in PostgreSQL (SHA-256 checksum), authenticated download = exact file bytes, 15-min signed public link works without login, .exe rejected 400, unauth 401 |
| Email (SMTP via Nodemailer + Outbox) | VERIFIED (queue path) | Without SMTP: emails queue in Email Outbox with status `queued` — never faked as sent; Settings shows outbox + retry. With SMTP_HOST/USER/PASS set, sends and marks sent/failed. Live delivery requires SAKK SMTP credentials |
| Online Gateway (Razorpay) | INTEGRATION COMPLETE — requires keys | Order creation (Razorpay Orders API), signed webhook verification (HMAC), idempotent webhook_events, auto payment+allocation on payment.captured. Without keys: status API honestly reports not configured, checkout 503, manual payments fully work. Live charge requires SAKK Razorpay test/live keys |
| Notifications / Audit Logs / Settings KV | VERIFIED | Task/expense notifications, 21+ audit entries, settings RBAC |
| Dashboard / Reports / CSV Export | VERIFIED | Receivables reconcile to invoice-level balances; financeSummary in reports |
| Backup & Restore | VERIFIED | scripts/backup.sh produced pg_dump; scripts/restore-verify.sh restored 30 tables into disposable DB, verified, dropped it (source untouched) |
| Indexes & Performance | DONE | scripts/indexes.sql (FK/status/date indexes) applied; server pagination; dashboard aggregates |
| Tests & CI | DONE | Vitest 7/7 pass; .github/workflows/ci.yml (Postgres service, push schema, typegen, tsc, lint, test, build); ESLint 0 errors 0 warnings |
| Lint | VERIFIED CLEAN | npm run lint -> no errors/warnings (documented single rule exception for async API effects in eslint.config.mjs) |
