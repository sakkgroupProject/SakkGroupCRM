import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { contacts, companies, deals, products, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

function ok(data: any, status = 200) {
  return Response.json({ success: true, ...data }, { status });
}
function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { type, rows } = body;

  if (!type || !Array.isArray(rows) || rows.length === 0) {
    return err("Invalid payload: type and non-empty rows array required");
  }

  const results = {
    imported: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  if (type === "contacts") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const firstName = String(r.firstName || r.first_name || r.name || "").trim();
      const lastName = String(r.lastName || r.last_name || "").trim() || "Contact";
      const email = r.email ? String(r.email).toLowerCase().trim() : null;

      if (!firstName) {
        results.failed++;
        results.errors.push({ row: i + 1, error: "First name is required" });
        continue;
      }

      if (email) {
        const [existing] = await db.select().from(contacts).where(eq(contacts.email, email));
        if (existing) {
          results.failed++;
          results.errors.push({ row: i + 1, error: `Duplicate email: ${email}` });
          continue;
        }
      }

      try {
        await db.insert(contacts).values({
          firstName,
          lastName,
          email,
          phone: r.phone || null,
          title: r.title || null,
          status: r.status || "lead",
          source: r.source || "csv_import",
          notes: r.notes || null,
          ownerId: user.id,
        });
        results.imported++;
      } catch (e: any) {
        results.failed++;
        results.errors.push({ row: i + 1, error: e.message });
      }
    }
  } else if (type === "companies") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = String(r.name || r.companyName || "").trim();
      if (!name) {
        results.failed++;
        results.errors.push({ row: i + 1, error: "Company name is required" });
        continue;
      }

      try {
        await db.insert(companies).values({
          name,
          industry: r.industry || null,
          website: r.website || null,
          email: r.email || null,
          phone: r.phone || null,
          size: r.size || "11-50",
          status: r.status || "prospect",
          ownerId: user.id,
        });
        results.imported++;
      } catch (e: any) {
        results.failed++;
        results.errors.push({ row: i + 1, error: e.message });
      }
    }
  } else if (type === "products") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = String(r.name || "").trim();
      if (!name) {
        results.failed++;
        results.errors.push({ row: i + 1, error: "Product name is required" });
        continue;
      }

      try {
        await db.insert(products).values({
          name,
          sku: r.sku || null,
          category: r.category || "General",
          price: String(r.price || "0"),
          currency: r.currency || "USD",
          description: r.description || null,
          isActive: r.isActive !== false,
        });
        results.imported++;
      } catch (e: any) {
        results.failed++;
        results.errors.push({ row: i + 1, error: e.message });
      }
    }
  } else if (type === "vendors") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = String(r.name || "").trim();
      if (!name) {
        results.failed++;
        results.errors.push({ row: i + 1, error: "Vendor name is required" });
        continue;
      }

      try {
        await db.insert(vendors).values({
          name,
          category: r.category || null,
          email: r.email || null,
          phone: r.phone || null,
          status: r.status || "active",
        });
        results.imported++;
      } catch (e: any) {
        results.failed++;
        results.errors.push({ row: i + 1, error: e.message });
      }
    }
  } else {
    return err(`Unsupported import type: ${type}`);
  }

  await logAudit(user.id, "import.bulk", type, undefined, `Imported ${results.imported} rows, ${results.failed} failed`);
  return ok(results);
}
