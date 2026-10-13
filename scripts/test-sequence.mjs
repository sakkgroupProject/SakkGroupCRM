import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const currentYear = new Date().getFullYear();
  const yy = String(currentYear).slice(-2);
  const res = await pool.query("SELECT invoice_number FROM invoices");
  
  let maxSerial = 0;
  const regex = new RegExp(`^SAKK[-/]INV[-/]${yy}[-/](\\d+)`, "i");

  for (const r of res.rows) {
    if (!r.invoice_number) continue;
    const match = r.invoice_number.match(regex);
    if (match && match[1]) {
      const p = parseInt(match[1], 10);
      if (!isNaN(p) && p > maxSerial) maxSerial = p;
    }
  }

  const nextSerial = maxSerial + 1;
  const nextNum = `SAKK-INV-${yy}-${String(nextSerial).padStart(3, "0")}`;
  console.log("Current DB invoice numbers:", res.rows.map((r) => r.invoice_number));
  console.log("Next Generated Invoice Number:", nextNum);
  await pool.end();
}

main().catch(console.error);
