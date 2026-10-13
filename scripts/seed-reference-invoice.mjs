import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // 1. Get admin user
  const uRes = await pool.query("SELECT id FROM users LIMIT 1");
  const adminId = uRes.rows[0]?.id || null;

  // 2. Insert or find Company
  let cRes = await pool.query("SELECT id FROM companies WHERE name = 'PASADA ENTERTAINMENT'");
  let companyId;
  if (cRes.rows.length === 0) {
    const insComp = await pool.query(
      `INSERT INTO companies (name, website, industry, address, city, country, owner_id)
       VALUES ('PASADA ENTERTAINMENT', 'https://pasadaentertainment.com', 'Entertainment & Media', '742 Evergreen Terrace', 'Los Angeles', 'United States', $1)
       RETURNING id`,
      [adminId]
    );
    companyId = insComp.rows[0].id;
    console.log("Created company PASADA ENTERTAINMENT:", companyId);
  } else {
    companyId = cRes.rows[0].id;
  }

  // 3. Insert or find Contact
  let ctRes = await pool.query("SELECT id FROM contacts WHERE email = 'patrick@pasadaentertainment.com'");
  let contactId;
  if (ctRes.rows.length === 0) {
    const insCt = await pool.query(
      `INSERT INTO contacts (first_name, last_name, email, phone, company_id, title, status, owner_id)
       VALUES ('Patrick C.', 'Simpson-Jones', 'patrick@pasadaentertainment.com', '+1 555-0199', $1, 'Executive Producer', 'customer', $2)
       RETURNING id`,
      [companyId, adminId]
    );
    contactId = insCt.rows[0].id;
    console.log("Created contact Patrick C. Simpson-Jones:", contactId);
  } else {
    contactId = ctRes.rows[0].id;
  }

  // 4. Products
  const prodItems = [
    { name: "Pasada Entertainment Website + SJGolf Store E-commerce", sku: "WEB-ECOM-01", price: "1200.00" },
    { name: "Additional E-commerce Development – SJGolf Store", sku: "DEV-STORE-02", price: "700.00" },
    { name: "AI Cinematic Video", sku: "AI-CINEMA-03", price: "1500.00" }
  ];

  const productIds = [];
  for (const p of prodItems) {
    let pRes = await pool.query("SELECT id FROM products WHERE name = $1", [p.name]);
    if (pRes.rows.length === 0) {
      const insP = await pool.query(
        `INSERT INTO products (name, sku, category, price, currency, is_active)
         VALUES ($1, $2, 'Digital & IT Services', $3, 'USD', true)
         RETURNING id`,
        [p.name, p.sku, p.price]
      );
      productIds.push(insP.rows[0].id);
    } else {
      productIds.push(pRes.rows[0].id);
    }
  }

  // 5. Insert or replace invoice SAKK-INV-26-001
  let invRes = await pool.query("SELECT id FROM invoices WHERE invoice_number = 'SAKK-INV-26-001'");
  let invoiceId;
  if (invRes.rows.length > 0) {
    invoiceId = invRes.rows[0].id;
    console.log("Invoice SAKK-INV-26-001 already exists:", invoiceId);
  } else {
    const insInv = await pool.query(
      `INSERT INTO invoices (invoice_number, title, company_id, contact_id, amount, quantity, tax_rate, currency, status, issued_date, due_date, notes, created_by)
       VALUES ('SAKK-INV-26-001', 'Pasada Entertainment Website + SJGolf Store E-commerce & AI Video', $1, $2, 3400.00, 1, 18.00, 'USD', 'sent', '2026-09-23', '2026-10-23', 'Payment via Bank Transfer / Wise to ICICI Bank.', $3)
       RETURNING id`,
      [companyId, contactId, adminId]
    );
    invoiceId = insInv.rows[0].id;
    console.log("Created invoice SAKK-INV-26-001:", invoiceId);

    // 6. Invoice items
    for (let i = 0; i < prodItems.length; i++) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, product_id, name, quantity, unit_price, total)
         VALUES ($1, $2, $3, 1, $4, $4)`,
        [invoiceId, productIds[i], prodItems[i].name, prodItems[i].price]
      );
    }
    console.log("Inserted line items into invoice_items");

    // 7. Payment: 621.00 paid
    const pmtRes = await pool.query(
      `INSERT INTO payments (receipt_number, contact_id, company_id, amount, currency, method, reference, payment_date, status, notes, created_by)
       VALUES ('RCPT-26-009', $1, $2, 621.00, 'USD', 'bank', 'WISE-TXN-99412', '2026-09-23', 'received', 'Partial advance payment received via Wise', $3)
       RETURNING id`,
      [contactId, companyId, adminId]
    );
    const paymentId = pmtRes.rows[0].id;

    // 8. Payment Allocation
    await pool.query(
      `INSERT INTO payment_allocations (payment_id, invoice_id, amount)
       VALUES ($1, $2, 621.00)`,
      [paymentId, invoiceId]
    );
    console.log("Allocated 621.00 payment to invoice SAKK/INV/26/009");
  }

  await pool.end();
  console.log("ALL SEEDING COMPLETED SUCCESSFULLY!");
}

main().catch(console.error);
