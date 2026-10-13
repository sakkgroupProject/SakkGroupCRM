# CRM Test Plan
1. Build/type: `npx next typegen`, `npm exec tsc -- --noEmit`, `npm run build`, `build_and_start` health `/api/health`.
2. Auth/RBAC: register first(admin)/second(forced sales), login wrong password 401, unauthenticated 401, sales cannot POST /api/team (403), sales cannot approve expense (403), deactivated user session rejected (getCurrentUser checks isActive every request).
3. CRUD: contacts/companies/deals/activities/products/quotations/contracts/projects/tasks/vendors/expenses/documents — create/list(search/filter)/update/delete, validation 400, duplicate contact email 409.
4. Finance regression (`node scripts/finance-regression.mjs` against local server): Invoice A 100000, B 50000, Receipt 120000, allocate 100000->A, 20000->B; expect A outstanding 0, B 30000, unallocated 0; over-allocation rejected 400; duplicate allocation attempt rejected; credit note reduces outstanding; partial payment -> partially_paid derived status.
5. Workflows: quotation -> convert to contract & invoice (double-convert 409); lead contact -> convert to deal; expense submit->approve (not self-approve unless admin)->paid; project task status transitions; invoice with allocations cannot edit amounts (409).
6. Reports/dashboard reconcile: pipeline sum = sum(deals by stage), receivables = invoice totals - allocations - credits.
7. Responsive/UI: shell uses responsive sidebar->mobile nav, tables overflow-x-auto (existing pattern retained).
Tests actually executed in this audit are recorded with results in CRM_PRODUCTION_READINESS.md. Gateway webhook/email/PDF tests: BLOCKED (no provider).
