import "dotenv/config";
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  console.log("Applying enterprise migrations to Neon PostgreSQL...");
  const client = await pool.connect();
  try {
    await client.query(`
      -- 1. Folder column on documents
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder VARCHAR(255) NOT NULL DEFAULT '/';

      -- 2. Quotation versions (snapshot diffing)
      CREATE TABLE IF NOT EXISTS quotation_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
        discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
        total NUMERIC(15, 2) NOT NULL DEFAULT 0,
        items_json TEXT NOT NULL,
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_quotation_versions_quote_id ON quotation_versions(quotation_id);

      -- 3. Digital Signatures
      CREATE TABLE IF NOT EXISTS signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        signer_name VARCHAR(255) NOT NULL,
        signer_email VARCHAR(255) NOT NULL,
        signature_data_url TEXT NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        checksum VARCHAR(128),
        signed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_signatures_entity ON signatures(entity_type, entity_id);

      -- 4. Tiered Pricing / Price Lists
      CREATE TABLE IF NOT EXISTS product_price_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        min_quantity INTEGER NOT NULL DEFAULT 1,
        max_quantity INTEGER,
        unit_price NUMERIC(15, 2) NOT NULL,
        discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_price_tiers_product_id ON product_price_tiers(product_id);

      -- 5. Dynamic Custom Fields
      CREATE TABLE IF NOT EXISTS custom_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        field_label VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) NOT NULL DEFAULT 'text',
        options_json TEXT,
        is_required BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- 6. Workflow Rules
      CREATE TABLE IF NOT EXISTS workflow_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        trigger_event VARCHAR(100) NOT NULL,
        condition_json TEXT,
        action_json TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        execution_count INTEGER NOT NULL DEFAULT 0,
        last_triggered_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- 7. Bank Transactions (Reconciliation)
      CREATE TABLE IF NOT EXISTS bank_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        statement_date DATE NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'credit',
        reference VARCHAR(255),
        matched_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
        matched_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'unmatched',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status);
    `);
    console.log("Enterprise database tables created and verified successfully!");
  } finally {
    client.release();
  }
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
