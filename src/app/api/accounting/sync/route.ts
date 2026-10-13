import { db } from "@/db";
import { invoices, payments, expenses, companies, contacts, appSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAuth();

    const [allInvoices, allPayments, allExpenses, [lastSyncSetting]] = await Promise.all([
      db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(100),
      db.select().from(payments).orderBy(desc(payments.createdAt)).limit(100),
      db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(100),
      db.select().from(appSettings).where(eq(appSettings.key, "accounting_last_sync")),
    ]);

    const paidInvoices = allInvoices.filter((i) => i.status === "paid");
    const sentInvoices = allInvoices.filter((i) => i.status === "sent" || i.status === "overdue");
    const approvedExpenses = allExpenses.filter((e) => e.status === "approved" || e.status === "paid");

    return Response.json({
      success: true,
      data: {
        lastSync: lastSyncSetting?.value || null,
        stats: {
          totalInvoicesReady: allInvoices.length,
          paidInvoices: paidInvoices.length,
          pendingInvoices: sentInvoices.length,
          paymentsRecorded: allPayments.length,
          expensesReady: approvedExpenses.length,
        },
        chartOfAccounts: [
          { code: "1000", name: "Operating Bank Account", type: "Asset", balance: "Live" },
          { code: "1200", name: "Accounts Receivable (A/R)", type: "Asset", balance: "Live" },
          { code: "2000", name: "Accounts Payable (A/P)", type: "Liability", balance: "Live" },
          { code: "4000", name: "Sales / Consulting Revenue", type: "Revenue", balance: "Live" },
          { code: "5000", name: "Direct Cost of Goods / Projects", type: "Expense", balance: "Live" },
          { code: "6000", name: "Operational Expenses", type: "Expense", balance: "Live" },
        ],
        integrations: [
          { name: "QuickBooks Online", status: "Active (CSV & IIF Sync)", format: "QBO / IIF" },
          { name: "Xero Accounting", status: "Active (Standard CSV)", format: "Xero Invoices & Bills" },
        ],
      },
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "manager" && user.role !== "finance") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { target, format } = await req.json().catch(() => ({}));
    // target: 'invoices' | 'payments' | 'expenses' | 'chart_of_accounts'
    // format: 'quickbooks_iif' | 'quickbooks_csv' | 'xero_csv'

    const now = new Date().toISOString();

    // Record last sync time
    const [existingSync] = await db.select().from(appSettings).where(eq(appSettings.key, "accounting_last_sync"));
    if (existingSync) {
      await db.update(appSettings).set({ value: now }).where(eq(appSettings.key, "accounting_last_sync"));
    } else {
      await db.insert(appSettings).values({ key: "accounting_last_sync", value: now });
    }

    let fileContent = "";
    let fileName = `accounting-export-${target || "all"}-${Date.now()}`;
    let contentType = "text/csv";

    if (format === "quickbooks_iif") {
      fileName += ".iif";
      contentType = "text/plain";
      // QuickBooks IIF Header format for transactions
      fileContent = `!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\n!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\n!ENDTRNS\n`;

      const invList = await db.select().from(invoices);
      for (const inv of invList) {
        const amt = Number(inv.amount || 0) * (inv.quantity || 1);
        const dt = inv.issuedDate || new Date().toISOString().slice(0, 10);
        fileContent += `TRNS\tINVOICE\t${dt}\tAccounts Receivable\tCustomer\t${amt.toFixed(2)}\t${inv.invoiceNumber}\t${inv.title.replace(/\t/g, " ")}\n`;
        fileContent += `SPL\tINVOICE\t${dt}\tSales Revenue\tCustomer\t-${amt.toFixed(2)}\t${inv.invoiceNumber}\tLine item\n`;
        fileContent += `ENDTRNS\n`;
      }
    } else if (format === "xero_csv") {
      fileName += ".csv";
      // Standard Xero Invoices Import Format
      fileContent = `*ContactName,*InvoiceNumber,*InvoiceDate,*DueDate,*Description,*Quantity,*UnitAmount,*AccountCode,*TaxType\n`;
      const invList = await db.select().from(invoices);
      for (const inv of invList) {
        const title = (inv.title || "Services").replace(/,/g, " ");
        fileContent += `Client,${inv.invoiceNumber},${inv.issuedDate || ""},${inv.dueDate || ""},"${title}",${inv.quantity || 1},${inv.amount || 0},200,Tax on Sales\n`;
      }
    } else {
      // Default: QuickBooks Online CSV Format
      fileName += ".csv";
      fileContent = `Date,Transaction Type,Num,Customer,Amount,Status,Notes\n`;
      const invList = await db.select().from(invoices);
      for (const inv of invList) {
        const amt = Number(inv.amount || 0) * (inv.quantity || 1);
        const title = (inv.title || "").replace(/,/g, " ");
        fileContent += `${inv.issuedDate || ""},Invoice,${inv.invoiceNumber},Client,${amt.toFixed(2)},${inv.status},"${title}"\n`;
      }
    }

    return new Response(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
