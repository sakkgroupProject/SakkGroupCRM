import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const upd = await pool.query("UPDATE invoices SET invoice_number = 'SAKK-INV-26-001' WHERE invoice_number = 'SAKK/INV/26/009'");
  console.log("Updated rows:", upd.rowCount);
  const res = await pool.query("SELECT id, invoice_number, title FROM invoices");
  console.log("Invoices in DB:", res.rows);
  await pool.end();
}

main().catch(console.error);
