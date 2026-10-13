<p align="center">
  <img src="public/logo.png" alt="SAKK Group Logo" width="120" height="120" style="border-radius: 50%; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
</p>

<h1 align="center">SAKK GROUP CRM & ENTERPRISE ARCHITECTURE</h1>

<p align="center">
  <strong>Complete Enterprise CRM, IT Project Management & Financial Invoicing Platform</strong><br>
  <em>"Innovating for a Better Tomorrow"</em><br>
  <strong>Build & Engineered by SAKK Group</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.6-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Device_Support-320px_to_4K-10B981?style=for-the-badge" alt="Responsive" />
</p>

---

## 📌 Executive Overview

**SAKK Group CRM** is a production-grade, full-stack enterprise platform engineered from the ground up to unify customer relationship management, sales pipeline velocity, IT project tracking, and financial operations into one synchronized system.

Every module, metric, chart, and invoice connects directly to a live **PostgreSQL** database using **Drizzle ORM** and secure Next.js REST API endpoints. There are **zero mock records, zero demo placeholders, and zero hardcoded data** — every action reads, writes, audits, and transactions live in real-time.

---

## 🌟 Key Platform Highlights

- 🏢 **100% Built by SAKK Group**: Custom tailored for IT service firms, software houses, consulting agencies, and enterprise operations.
- 🧾 **Official SAKK Group Tax Invoice Engine**: Produces pixel-perfect GST tax invoices adhering strictly to the official corporate layout with Kundan Bharti's handwritten signature, SBI bank details, GSTIN, and auto-incrementing sequential numbering (`SAKK-INV-YY-NNN`).
- 📱 **360° Responsive & Touch-Optimized**: Tested from 320px ultra-compact mobile phones up to 2560px ultrawide displays with accessible slide-out mobile navigation drawer, fluid dialogs, and non-breaking tables.
- ✍️ **Cryptographic Digital Signatures**: Legal e-signatures with touch/stylus/mouse drawing, bound with SHA-256 hash checksums, client IP addresses, and audit timestamps.
- 📊 **Executive Business Intelligence**: Dynamic SVG monthly revenue charts, deal-stage funnel breakdowns, capacity planning, and live project budget variance tracking.
- 🔒 **Enterprise-Grade Security**: Invite-only onboarding, Bcrypt password hashing, TOTP Multi-Factor Authentication (MFA), role-based access control, and immutable audit logs.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Browser Client (Mobile, Tablet, Desktop 320px-4K)"]
    
    subgraph "Next.js 16 Application Layer (Turbopack)"
        UI["React 19 Server & Client Components"]
        Drawer["Categorized Mobile Navigation & Desktop Sidebar"]
        AuthMechs["Session JWT & MFA Verification"]
        APIRoutes["Next.js REST API Endpoints (/api/*)"]
    end

    subgraph "Business Services & Utilities"
        SeqGen["Invoice Sequence Engine (SAKK-INV-YY-NNN)"]
        PDFKitEngine["PDFKit Vector Generator (Invoices & POs)"]
        CryptoSign["Digital e-Signature SHA-256 Hasher"]
        EmailOutbox["Transactional SMTP & Queued Outbox"]
    end

    subgraph "Data & Persistence Layer"
        Drizzle["Drizzle ORM Schema & Relational Queries"]
        Postgres[("Neon PostgreSQL Cloud Database")]
    end

    Client <--> UI
    UI <--> Drawer
    UI <--> APIRoutes
    APIRoutes --> AuthMechs
    APIRoutes --> SeqGen
    APIRoutes --> PDFKitEngine
    APIRoutes --> CryptoSign
    APIRoutes --> EmailOutbox
    APIRoutes <--> Drizzle
    Drizzle <--> Postgres
```

---

## 📦 Comprehensive Module Breakdown

### 1. 📊 Executive Dashboard & Analytics
- **Live Real-Time KPIs**: Total Contacts, Total Companies, Deal Pipeline Value, Won Revenue, Paid Invoices, Win Rate %, Overdue Activities.
- **Dynamic SVG Charts**: Revenue trends by month and pipeline distribution by deal stage with interactive hover tooltips.
- **Executive Project Variance**: Live tracker monitoring project progress vs actual approved expense costs.
- **Productivity Stopwatch**: In-app task time tracker with pause, play, and project hour logging.
- **Dashboard Personalizer**: Custom visibility toggles persisted to local client storage.

### 2. 👥 Clients, Contacts & Organizations
- Full lifecycle management for Leads, Prospects, Customers, and Churned relationships.
- Instant search by name, email, phone number, and status filter.
- **Client 360° Activity Feed**: Unified chronological history timeline showing every activity, deal, quotation, and contract associated with any contact.
- One-click CSV export and vCard integration.

### 3. 🎯 Sales Pipeline & Deal Management
- **Kanban Board**: Drag-and-drop / instant-select stages (`Lead`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`) with touch-snap scrolling on mobile.
- **Probability & Weighted Value**: Real-time revenue forecasting per stage.
- **Lost Deal Reason Tracking**: In-depth analytics to analyze lost sales opportunities.
- Multi-currency support: USD (`$`), EUR (`€`), GBP (`£`), INR (`₹`), AED (`AED`).

### 4. 🧾 Invoicing & Financial Billing (SAKK Standard)
- **Sequential Invoice Numbering Engine (`SAKK-INV-YY-NNN`)**:
  - Automatically calculates the current two-digit year (`26` for 2026).
  - Inspects existing invoices for the year, finds the highest serial number, and increments it by one (`001`, `002`, `003`...).
  - Resets automatically to `001` on every new calendar year.
- **Official Corporate Layout**:
  - Top header banner with SAKK Group logo and slogan *"Innovating for a Better Tomorrow"*.
  - Full company metadata: `sakkgroupmanagement@gmail.com` | `+91 9296900728` | `www.sakkgroup.com`.
  - Client billing address, GSTIN, invoice dates, and due dates.
  - Itemized table with Descriptions, HSN codes, Unit Price, Quantity, and Totals.
  - State Bank of India (SBI) Bank Account & IFSC details.
  - Kundan Bharti handwritten signature & authorized signatory stamp.
- **Dual Output**: Live high-resolution browser preview modal + server-side downloadable vector PDF via PDFKit.
- **Recurring Invoices**: Scheduled automation for monthly, quarterly, or yearly retainer contracts.

### 5. 📝 Quotations, Proposals & Version Control
- Instant quote generation with line items, tiered product lookup, tax rates, and discounts.
- **One-Click Conversion**: Convert approved quotes directly into binding **Contracts** or billing **Invoices** without retyping.
- **Revision History & Visual Diff**: Snapshot quotation states and compare revisions side-by-side to track price changes.
- In-browser quotation email dispatcher.

### 6. 📜 Contracts & Digital e-Signatures
- Master service agreements (MSA), Statements of Work (SOW), and non-disclosure agreements (NDA).
- **Interactive Signature Canvas**: High-precision touch, stylus, and mouse drawing canvas with device pixel ratio scaling.
- **Cryptographic Audit Certificate**: Binds signer name, verified email, IP address, and SHA-256 document checksum.
- Automated contract expiration warnings (flags contracts expiring within 30 days).

### 7. 🚀 IT Project Management & Gantt Timeline
- **Interactive Gantt Timeline**: Visual chronological roadmaps with start dates, end dates, and progress indicators.
- **Task Management**: Kanban-style tasks with priority flags (`Low`, `Medium`, `High`, `Urgent`) and assigned team members.
- **Automated Cost Variance**: Compares allocated project budget against actual approved project expenses in real time.
- **Workload Capacity Planning**: Visual team workload balance to prevent developer burnout.

### 8. 💳 Accounting, Payments & Bank Reconciliation
- **Transactional Payment Allocation**: Records bank receipts and allocates them across outstanding invoices with strict database lock prevention against over-allocation.
- **Accounts Payable (AP) Aging**: Real-time debt aging analysis (Current, 1–30, 31–60, 61–90, 90+ days).
- **Double-Entry Bank Reconciliation**: Matches imported statement transactions against CRM payment receipts.
- **Accounting Sync**: One-click export for QuickBooks, Zoho, and Tally accounting suites.
- **Two-Tier Expense Approvals**: Separation of duties where team members submit expenses and managers approve/reject before payment.

### 9. 📦 Procurement & Vendor Management
- Vendor and supplier directories with service categories and contact records.
- Purchase Order (PO) creation, tracking, status lifecycles, and PDF export.

### 10. ⚡ Automation & Custom Fields
- **Workflow Automation Builder**: Visual trigger-and-action rules (e.g. *When Deal is Won -> Send Email Notification -> Assign Onboarding Task*).
- **Dynamic Custom Fields**: Add custom fields (Text, Number, Date, Boolean, Dropdown) to Contacts, Deals, or Projects without altering database schema.
- **Web Lead Capture Inbox**: Public web lead ingestion with one-click conversion to Contacts and Deals.
- **Bulk CSV Import Wizard**: Multi-step file upload and column mapping for bulk onboarding.

---

## 💻 Technology Stack & Libraries

| Category | Technology | Description |
|---|---|---|
| **Frontend Framework** | **Next.js 16.2.6** | Turbopack App Router with Hybrid Server & Client Rendering |
| **UI Library** | **React 19.2.6** | Latest React primitives, concurrent rendering, transitions |
| **Styling & Design System** | **Tailwind CSS v4.1** | Fluid responsive tokens, dark-mode accents, glassmorphism |
| **Database & Persistence** | **Neon PostgreSQL** | Cloud-native serverless PostgreSQL with instant branching |
| **ORM & Type Safety** | **Drizzle ORM 0.45.2** | Type-safe SQL schema definitions, migrations, and joins |
| **Icons & Visual Language** | **Lucide React** | Modern, accessible stroke vector icon set |
| **Document Generation** | **PDFKit 0.20.2** | Pixel-perfect vector PDF generation for invoices & POs |
| **Security & Auth** | **Bcrypt.js + Web Crypto** | Salted password hashing, TOTP MFA, and SHA-256 signatures |
| **Email Infrastructure** | **NodeMailer 10.1** | Real SMTP dispatcher with persistent database outbox fallback |
| **Type Checking** | **TypeScript 5.9** | Strict compile-time validation across all components and APIs |

---

## 📱 Cross-Device & Responsive Design System

The application has been audited and engineered across all modern viewport sizes:

- **320px — 375px**: Ultra-compact mobile phones (iPhone SE, small Android). Single-column layouts, touch-friendly 44px tap targets, zero page-level horizontal scroll.
- **390px — 430px**: Standard & large smartphones (iPhone 14/15/16, Samsung Galaxy, Pixel).
- **600px — 820px**: Tablets in portrait & landscape (iPad, Android tablets). Two-column adaptive card grids, flexible toolbars.
- **1024px — 1366px**: Compact & standard laptops (MacBook Air, ThinkPad, Surface).
- **1440px — 1920px**: Full HD Desktop displays with persistent categorized sidebar navigation.
- **2560px+**: Ultrawide monitors with bounded maximum content containers (`max-w-[1400px]`).

### Navigation Experience
- **Mobile (< 768px)**: Hidden desktop sidebar replaced with a sleek hamburger menu and accessible slide-out navigation drawer with categories:
  - 📌 *Core & Overview*
  - 💼 *Sales & Deals*
  - 🚀 *Projects & Tasks*
  - 💳 *Finance & Billing*
  - ⚙️ *Tools & Management*
- **Desktop (≥ 768px)**: Fixed, high-contrast dark sidebar with categorized group headers, live PostgreSQL status indicator, user badge, and instant logout.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (v10+)
- **Database**: PostgreSQL (Local or Neon Cloud instance)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/sakkgroup/sakk-group-crm-architecture.git

# Navigate into project directory
cd sakk-group-crm-architecture

# Install dependencies
npm install
```

### 2. Environment Variables Configuration

Create a `.env` file in the root directory:

```env
# PostgreSQL Connection String (Neon or Local)
DATABASE_URL="postgresql://username:password@ep-example.neon.tech/sakk_crm?sslmode=require"

# JWT Secret for Session Authentication
JWT_SECRET="your-super-secure-random-secret-key-32-chars-min"

# SAKK Corporate Settings
DEFAULT_CURRENCY="USD"
DEFAULT_TAX_RATE="18"
INVOICE_PREFIX="SAKK-INV-"

# Optional: SMTP Server for Direct Email Dispatch
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="sakkgroupmanagement@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="SAKK Group CRM <sakkgroupmanagement@gmail.com>"
```

### 3. Database Migration & Initialization

Run the enterprise migration script to create all relational tables:

```bash
# Run database schema migrations
node scripts/migrate-enterprise.mjs

# Verify database connection and seed initial test sequence
node scripts/test-sequence.mjs
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Typecheck & Build Validation

```bash
# Run strict TypeScript validation
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 🗂️ Project Directory Structure

```text
sakk-group-crm-architecture/
├── public/                       # Static corporate brand assets
│   ├── logo.png                  # SAKK Group official circular logo
│   └── signature.png             # Kundan Bharti authorized signatory signature
├── scripts/                      # Database migration and verification scripts
│   ├── migrate-enterprise.mjs    # Complete Drizzle PostgreSQL schema migration
│   ├── test-sequence.mjs         # Sequential invoice sequence tester
│   └── update-invoice-number.mjs # Invoice sequence alignment script
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # 30+ RESTful API endpoints
│   │   │   ├── auth/             # Login, register, MFA, password reset
│   │   │   ├── contacts/         # Contacts CRUD & search
│   │   │   ├── companies/        # Companies CRUD
│   │   │   ├── deals/            # Deal pipeline & stage updates
│   │   │   ├── quotations/       # Quotes, conversion, version diffing
│   │   │   ├── contracts/        # Contracts & lifecycle
│   │   │   ├── projects/         # Projects & budget variance
│   │   │   ├── invoices/         # Invoices CRUD, PDF & dispatch
│   │   │   │   └── [id]/pdf/     # PDF generation endpoint
│   │   │   ├── payments/         # Payment recording & allocations
│   │   │   ├── expenses/         # Multi-tier expense approvals
│   │   │   ├── signatures/       # SHA-256 e-signature recording
│   │   │   ├── dashboard/        # BI aggregation metrics
│   │   │   └── reports/          # Financial & pipeline reporting
│   │   ├── globals.css           # Tailwind v4 base styles, touch & print styles
│   │   ├── layout.tsx            # Root layout with responsive viewport tags
│   │   └── page.tsx              # Main unified CRM workspace view dispatcher
│   ├── components/               # High-order CRM modular components
│   │   ├── enterprise-suite.tsx  # Gantt, e-Signatures, Quote Diff, Workload
│   │   ├── extra.tsx             # Quotes, Contracts, Projects, Expenses
│   │   ├── power-features.tsx    # CSV Importer, 360° Timeline, Calendar
│   │   └── sakk-invoice-modal.tsx# Official SAKK Tax Invoice preview modal
│   ├── db/                       # Database schema and client
│   │   ├── schema.ts             # Drizzle ORM PostgreSQL relational schema
│   │   └── index.ts              # Connection pool & client export
│   └── lib/                      # Core business logic utilities
│       ├── api.ts                # Client API fetcher & formatters
│       ├── invoice-sequence.ts   # SAKK-INV-YY-NNN sequential numbering engine
│       └── pdf.ts                # PDFKit invoice design template with SBI & signature
├── package.json                  # Dependencies and execution scripts
├── tsconfig.json                 # Strict TypeScript configuration
└── README.md                     # Master platform documentation
```

---

## 🔒 Security & Compliance

- **Password Hashing**: Uses industry-standard **Bcrypt** with dynamic salt rounds.
- **Two-Factor Authentication**: Native RFC 6238 TOTP engine compatible with Google Authenticator, Authy, and Apple Passwords.
- **Database Transactions**: Financial allocations and status conversions run inside strict atomic SQL transactions (`BEGIN ... COMMIT`) to eliminate race conditions.
- **Audit Logging**: Sensitive operations (e.g. member invitations, expense approvals, invoice deletions) record user ID, email, IP, and timestamp to the `audit_logs` table.
- **Legal Audit Trail**: Digital signatures capture cryptographic proof with SHA-256 checksums.

---

## 🏢 Corporate Identity & Support

**SAKK Group**  
*Innovating for a Better Tomorrow*

- 🌐 **Official Website**: [www.sakkgroup.com](https://www.sakkgroup.com)
- 📧 **Corporate Email**: [sakkgroupmanagement@gmail.com](mailto:sakkgroupmanagement@gmail.com)
- 📞 **Official Contact**: [+91 9296900728](tel:+919296900728)
- 📍 **Headquarters**: India

---

## 📜 License

Copyright © 2026 **SAKK Group**. All rights reserved.  
This software and associated architecture documentation are proprietary to SAKK Group.
