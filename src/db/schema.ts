import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, date, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // admin, manager, sales, support
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(1),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 120 }),
  website: varchar("website", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 120 }),
  country: varchar("country", { length: 120 }),
  size: varchar("size", { length: 50 }), // 1-10, 11-50, 51-200, 201-500, 500+
  annualRevenue: decimal("annual_revenue", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 50 }).notNull().default("prospect"), // prospect, active, churned, partner
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  title: varchar("title", { length: 120 }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).notNull().default("lead"), // lead, prospect, customer, churned
  source: varchar("source", { length: 80 }), // website, referral, cold, social, event, other
  tags: text("tags"), // comma separated
  address: text("address"),
  city: varchar("city", { length: 120 }),
  country: varchar("country", { length: 120 }),
  notes: text("notes"),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  stage: varchar("stage", { length: 50 }).notNull().default("lead"), // lead, qualified, proposal, negotiation, won, lost
  probability: integer("probability").notNull().default(10),
  expectedCloseDate: date("expected_close_date"),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  description: text("description"),
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }).notNull().default("task"), // call, email, meeting, task, note
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, urgent
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 120 }),
  price: decimal("price", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  issuedDate: date("issued_date"),
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotations = pgTable("quotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteNumber: varchar("quote_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft,sent,approved,rejected,accepted,expired,converted
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 15, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  validUntil: date("valid_until"),
  notes: text("notes"),
  convertedType: varchar("converted_type", { length: 50 }),
  convertedId: uuid("converted_id"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const quotationItems = pgTable("quotation_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
});
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
});
export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  value: decimal("value", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft,active,expired,terminated,completed
  startDate: date("start_date"), endDate: date("end_date"),
  terms: text("terms"), notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
  managerId: uuid("manager_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).notNull().default("planning"), // planning,active,on_hold,completed,cancelled
  budget: decimal("budget", { precision: 15, scale: 2 }).notNull().default("0"),
  actualCost: decimal("actual_cost", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  progress: integer("progress").notNull().default(0),
  startDate: date("start_date"), endDate: date("end_date"),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("todo"), // todo,in_progress,blocked,done
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  dueDate: date("due_date"),
  estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 8, scale: 2 }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }), phone: varchar("phone", { length: 50 }),
  category: varchar("category", { length: 120 }),
  address: text("address"), city: varchar("city", { length: 120 }), country: varchar("country", { length: 120 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  category: varchar("category", { length: 120 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft,submitted,approved,rejected,paid,reimbursed
  expenseDate: date("expense_date"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull().unique(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  method: varchar("method", { length: 50 }).notNull().default("bank"), // bank,cash,card,cheque,upi,gateway
  reference: varchar("reference", { length: 255 }),
  paymentDate: date("payment_date"),
  status: varchar("status", { length: 50 }).notNull().default("received"), // received,cleared,failed,refunded,partially_refunded
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const creditNotes = pgTable("credit_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  creditNumber: varchar("credit_number", { length: 50 }).notNull().unique(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 50 }).notNull().default("applied"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  mimeType: varchar("mime_type", { length: 120 }),
  sizeBytes: integer("size_bytes"),
  url: text("url").notNull(),
  entityType: varchar("entity_type", { length: 50 }), // contact,company,deal,contract,project,invoice,quotation
  entityId: uuid("entity_id"),
  notes: text("notes"),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  checksum: varchar("checksum", { length: 128 }),
  storageProvider: varchar("storage_provider", { length: 50 }).notNull().default("external_url"),
  folder: varchar("folder", { length: 255 }).notNull().default("/"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  entityType: varchar("entity_type", { length: 50 }), entityId: uuid("entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: uuid("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const appSettings = pgTable("app_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("sales"),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("queued"), // queued,sent,failed
  providerId: varchar("provider_id", { length: 255 }),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});
export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 255 }).primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});
export const documentFiles = pgTable("document_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }).unique(),
  dataBase64: text("data_base64").notNull(),
  checksum: varchar("checksum", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const gatewayOrders = pgTable("gateway_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull().default("razorpay"),
  gatewayOrderId: varchar("gateway_order_id", { length: 255 }).notNull().unique(),
  gatewayPaymentId: varchar("gateway_payment_id", { length: 255 }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: varchar("status", { length: 50 }).notNull().default("created"), // created,paid,failed,verified
  rawPayload: text("raw_payload"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 255 }),
  processed: boolean("processed").notNull().default(false),
  payload: text("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const recurringInvoices = pgTable("recurring_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  frequency: varchar("frequency", { length: 20 }).notNull().default("monthly"), // weekly,monthly,quarterly,yearly
  nextRunDate: date("next_run_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastInvoiceId: uuid("last_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, issued, approved, received, cancelled
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  issueDate: date("issue_date"),
  expectedDate: date("expected_date"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  poId: uuid("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
});

export const timeLogs = pgTable("time_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => projectTasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  hours: decimal("hours", { precision: 8, scale: 2 }).notNull(),
  description: text("description"),
  logDate: date("log_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadSubmissions = pgTable("lead_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  message: text("message"),
  source: varchar("source", { length: 100 }).notNull().default("website_form"),
  status: varchar("status", { length: 50 }).notNull().default("new"), // new, converted, dismissed
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotationVersions = pgTable("quotation_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 15, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
  itemsJson: text("items_json").notNull(), // JSON array of items at this version
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const signatures = pgTable("signatures", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // quotation, contract
  entityId: uuid("entity_id").notNull(),
  signerName: varchar("signer_name", { length: 255 }).notNull(),
  signerEmail: varchar("signer_email", { length: 255 }).notNull(),
  signatureDataUrl: text("signature_data_url").notNull(), // data:image/png;base64,...
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  checksum: varchar("checksum", { length: 128 }),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
});

export const productPriceTiers = pgTable("product_price_tiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  minQuantity: integer("min_quantity").notNull().default(1),
  maxQuantity: integer("max_quantity"), // null means unbounded (e.g. 50+)
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customFields = pgTable("custom_fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // contact, company, deal, project
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldLabel: varchar("field_label", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull().default("text"), // text, number, dropdown, date, boolean
  optionsJson: text("options_json"), // for dropdown choices
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowRules = pgTable("workflow_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  triggerEvent: varchar("trigger_event", { length: 100 }).notNull(), // deal_won, lead_captured, invoice_paid, task_created
  conditionJson: text("condition_json"), // criteria filter
  actionJson: text("action_json").notNull(), // action to execute (e.g. create_task, send_notification)
  isActive: boolean("is_active").notNull().default(true),
  executionCount: integer("execution_count").notNull().default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  statementDate: date("statement_date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("credit"), // credit, debit
  reference: varchar("reference", { length: 255 }),
  matchedInvoiceId: uuid("matched_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  matchedPaymentId: uuid("matched_payment_id").references(() => payments.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).notNull().default("unmatched"), // unmatched, matched, reconciled, ignored
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

