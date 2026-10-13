import { db } from "@/db";
import { invoices } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Generates the official SAKK Group invoice number:
 * Format: SAKK-INV-YY-NNN (e.g. SAKK-INV-26-001)
 * - YY: 2-digit current year (e.g. 26 in 2026, 27 in 2027)
 * - NNN: 3-digit zero-padded incremental serial number starting from 001
 * When the year changes, the serial resets to 001.
 * With each new invoice created, the serial increments automatically.
 */
export async function getNextSakkInvoiceNumber(executor: any = db): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = String(currentYear).slice(-2); // e.g. "26"

  // Fetch all invoice numbers for the current year
  const rows = await executor
    .select({ num: invoices.invoiceNumber })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} ILIKE ${'%' + yy + '%'}`);

  let maxSerial = 0;
  // Match both standard SAKK-INV-26-001 and legacy SAKK/INV/26/001
  const regex = new RegExp(`^SAKK[-/]INV[-/]${yy}[-/](\\d+)`, "i");

  for (const r of rows) {
    if (!r.num) continue;
    const match = r.num.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxSerial) {
        maxSerial = parsed;
      }
    }
  }

  const nextSerial = maxSerial + 1;
  const serialPadded = String(nextSerial).padStart(3, "0");
  return `SAKK-INV-${yy}-${serialPadded}`;
}
