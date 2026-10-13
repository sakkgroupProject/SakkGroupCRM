import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface SakkInvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string | Date | null;
  clientName: string;
  attnName?: string | null;
  modeOfPayment?: string | null;
  paymentStatus?: string | null;
  currency?: string | null;
  items: { description: string; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  noteLine1?: string | null;
  noteLine2?: string | null;
}

function numberToWords(amount: number, currency: string = "USD"): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function numToString(n: number): string {
    if (n === 0) return "";
    if (n < 20) return units[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + units[n % 10] : "") + " ";
    if (n < 1000) return units[Math.floor(n / 100)] + " Hundred " + numToString(n % 100);
    if (n < 1000000) return numToString(Math.floor(n / 1000)) + "Thousand " + numToString(n % 1000);
    if (n < 1000000000) return numToString(Math.floor(n / 1000000)) + "Million " + numToString(n % 1000000);
    return n.toString();
  }

  const intPart = Math.floor(Math.abs(amount));
  const decPart = Math.round((Math.abs(amount) - intPart) * 100);
  const words = numToString(intPart).trim();
  const currLabel = currency.toUpperCase() === "USD" ? "US Dollars" : currency.toUpperCase() === "INR" ? "Rupees" : `${currency} Units`;

  let result = `${currLabel} ${words || "Zero"}`;
  if (decPart > 0) {
    result += ` and ${numToString(decPart).trim()} Cents`;
  }
  return `${result} Only`;
}

function formatSakkDate(d?: string | Date | null): string {
  if (!d) return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function generateSakkInvoicePdf(data: SakkInvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Standard A4 Dimensions: 595.28 x 841.89 pt
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const signaturePath = path.join(process.cwd(), "public", "signature.png");

    const curr = (data.currency || "USD").toUpperCase();

    // ==========================================
    // 1. TOP HEADER BANNER (Dark Slate Bar)
    // ==========================================
    doc.rect(0, 0, doc.page.width, 108).fill("#11161d");

    // SAKK Group 3D Logo
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 35, 14, { width: 75, height: 75 });
      } catch { }
    }

    // Header Typography
    const textX = 124;
    doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold").text("SAKK GROUP", textX, 16);
    doc.fillColor("#eab308").fontSize(9.5).font("Helvetica").text("Innovating for a Better Tomorrow", textX, 42);
    doc.fillColor("#cbd5e1").fontSize(8).font("Helvetica").text("sakkgroupmanagement@gmail.com  |  9296900728", textX, 55);
    doc.fillColor("#cbd5e1").fontSize(8).font("Helvetica").text("www.sakkgroup.com", textX, 66);
    doc.fillColor("#cbd5e1").fontSize(8).font("Helvetica").text("Delhi - 110092, India  |  GST: 07AFWFS6592Q1ZI", textX, 77);

    // Gold vector checkmark
    doc.save();
    doc.lineWidth(1.3).strokeColor("#eab308").lineCap("round").lineJoin("round");
    doc.moveTo(textX, 94).lineTo(textX + 2.5, 96.5).lineTo(textX + 7, 90).stroke();
    doc.restore();

    doc.fillColor("#eab308").fontSize(7.5).font("Helvetica-Bold").text("ISO/IEC 27001:2022 CERTIFIED — INFORMATION SECURITY MANAGEMENT", textX + 11, 89.5);

    // ==========================================
    // 2. INVOICE TITLE & NUMBER/DATE BOX
    // ==========================================
    const titleY = 126;
    doc.fillColor("#0f172a").fontSize(26).font("Helvetica-Bold").text("INVOICE", 35, titleY);

    // Metadata Bordered Box (Right aligned)
    const boxX = 370;
    const boxWidth = 190;
    const boxHeight = 44;
    doc.rect(boxX, titleY, boxWidth, boxHeight).lineWidth(0.8).strokeColor("#cbd5e1").stroke();
    doc.moveTo(boxX, titleY + 22).lineTo(boxX + boxWidth, titleY + 22).lineWidth(0.8).strokeColor("#cbd5e1").stroke();

    // Box Row 1: Invoice No.
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica").text("Invoice No.", boxX + 10, titleY + 6);
    doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica-Bold").text(data.invoiceNumber, boxX + 80, titleY + 6, { width: 100, align: "right" });

    // Box Row 2: Invoice Date
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica").text("Invoice Date", boxX + 10, titleY + 28);
    doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica").text(formatSakkDate(data.invoiceDate), boxX + 80, titleY + 28, { width: 100, align: "right" });

    // ==========================================
    // 3. BILL TO & PAYMENT DETAILS (Two Columns)
    // ==========================================
    const infoY = 186;

    // Left Column: BILL TO
    doc.rect(35, infoY, 3.5, 14).fill("#d97706");
    doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica-Bold").text("BILL TO", 44, infoY + 2);
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text(data.clientName || "VALUED CLIENT", 44, infoY + 22);
    if (data.attnName) {
      doc.fillColor("#475569").fontSize(9).font("Helvetica").text(`Attn: ${data.attnName}`, 44, infoY + 38);
    }

    // Right Column: PAYMENT DETAILS
    const payX = 330;
    doc.rect(payX, infoY, 3.5, 14).fill("#d97706");
    doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica-Bold").text("PAYMENT DETAILS", payX + 9, infoY + 2);
    doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`Mode of Payment: ${data.modeOfPayment || "Bank Transfer / Wise"}`, payX + 9, infoY + 22);
    doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`Payment Status: ${data.paymentStatus || "Partially Paid"}`, payX + 9, infoY + 36);
    doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`Currency: ${curr} (${curr === "USD" ? "US Dollar" : curr === "INR" ? "Indian Rupee" : curr})`, payX + 9, infoY + 50);

    // ==========================================
    // 4. LINE ITEMS TABLE
    // ==========================================
    const tableTop = 255;
    const tableWidth = doc.page.width - 70; // 525.28

    // Table Header Bar (Black)
    doc.rect(35, tableTop, tableWidth, 22).fill("#11161d");
    doc.fillColor("#ffffff").fontSize(8.5).font("Helvetica-Bold").text("DESCRIPTION", 45, tableTop + 6);
    doc.fillColor("#ffffff").fontSize(8.5).font("Helvetica-Bold").text(`AMOUNT (${curr})`, tableWidth - 75, tableTop + 6, { width: 100, align: "right" });

    let currentY = tableTop + 22;
    const rowHeight = 22;

    // Render Items
    data.items.forEach((item, index) => {
      if (index % 2 === 1) {
        doc.rect(35, currentY, tableWidth, rowHeight).fill("#f8fafc");
      }
      doc.fillColor("#1e293b").fontSize(9).font("Helvetica-Bold").text(item.description, 45, currentY + 6, { width: 380, lineBreak: false });
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text(Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tableWidth - 75, currentY + 6, { width: 100, align: "right" });
      currentY += rowHeight;
    });

    // Summary Lines
    const renderSummaryLine = (label: string, value: number, isBold: boolean = false) => {
      doc.rect(35, currentY, tableWidth, rowHeight).fill("#ffffff");
      doc.fillColor(isBold ? "#0f172a" : "#475569").fontSize(9).font(isBold ? "Helvetica-Bold" : "Helvetica").text(label, 45, currentY + 6);
      doc.fillColor("#0f172a").fontSize(9).font(isBold ? "Helvetica-Bold" : "Helvetica").text(Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tableWidth - 75, currentY + 6, { width: 100, align: "right" });
      currentY += rowHeight;
    };

    renderSummaryLine("Subtotal", data.subtotal);
    renderSummaryLine(`GST @ ${data.taxRate}% (as per Indian Government tax)`, data.taxAmount);
    renderSummaryLine("Total Invoice Amount", data.totalAmount, true);
    renderSummaryLine("Amount Paid", data.amountPaid);

    // BALANCE DUE Box (Dark Background with Gold/White text)
    currentY += 4;
    doc.rect(35, currentY, tableWidth, 30).fill("#11161d");
    doc.fillColor("#eab308").fontSize(10.5).font("Helvetica-Bold").text("BALANCE DUE", 45, currentY + 9);
    doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold").text(`${curr} ${Number(data.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tableWidth - 110, currentY + 8, { width: 135, align: "right" });
    currentY += 38;

    // Amount in Words
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica-Oblique").text(`Amount in Words: ${numberToWords(data.balanceDue, curr)}`, 35, currentY);
    currentY += 22;

    // ==========================================
    // 5. NOTE SECTION
    // ==========================================
    doc.rect(35, currentY, 3.5, 14).fill("#d97706");
    doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica-Bold").text("NOTE", 44, currentY + 2);
    currentY += 18;

    const note1 = data.noteLine1 || `- Amount paid of ${curr} ${Number(data.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been received and adjusted against the total invoice value.`;
    const note2 = data.noteLine2 || `- Remaining balance of ${curr} ${Number(data.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is payable via Bank Transfer / Wise to the account below.`;

    doc.fillColor("#334155").fontSize(8).font("Helvetica").text(note1, 44, currentY);
    currentY += 14;
    doc.fillColor("#334155").fontSize(8).font("Helvetica").text(note2, 44, currentY);

    // ==========================================
    // 6. BANK DETAILS & AUTHORIZED SIGNATORY
    // ==========================================
    const bankSectionY = Math.max(currentY + 28, 590);

    // Bank Details (Left Column)
    doc.rect(35, bankSectionY, 3.5, 14).fill("#d97706");
    doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica-Bold").text("BANK DETAILS", 44, bankSectionY + 2);

    const bRowY = bankSectionY + 20;
    const bSpacing = 14;

    // Col 1 (Account details)
    const bCol1 = 44;
    const bVal1 = 125;
    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Account Name", bCol1, bRowY);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("SAKK GROUP", bVal1, bRowY);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Bank Name", bCol1, bRowY + bSpacing);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("ICICI Bank", bVal1, bRowY + bSpacing);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Branch", bCol1, bRowY + bSpacing * 2);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("Delhi, Laxminagar", bVal1, bRowY + bSpacing * 2);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Account Number", bCol1, bRowY + bSpacing * 3);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("083105004592", bVal1, bRowY + bSpacing * 3);

    // Col 2 (Routing codes & GST)
    const bCol2 = 230;
    const bVal2 = 295;
    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("IFSC Code", bCol2, bRowY);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("ICIC0000831", bVal2, bRowY);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("SWIFT Code", bCol2, bRowY + bSpacing);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("ICICINBBCTS", bVal2, bRowY + bSpacing);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Account Type", bCol2, bRowY + bSpacing * 2);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("Current Account", bVal2, bRowY + bSpacing * 2);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("GST No.", bCol2, bRowY + bSpacing * 3);
    doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text("07AFWFS6592Q1ZI", bVal2, bRowY + bSpacing * 3);

    // Right Column: Kundan Bharti Authorized Signatory
    const sigX = 410;
    const sigY = bankSectionY + 2;

    if (fs.existsSync(signaturePath)) {
      try {
        doc.image(signaturePath, sigX - 5, sigY - 14, { width: 135, height: 60 });
      } catch { }
    }

    // Signatory designation directly below signature
    doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica-Bold").text("For SAKK Group", sigX, sigY + 50);
    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Authorized Signatory", sigX, sigY + 62);

    // ==========================================
    // 7. BOTTOM FOOTER BAR
    // ==========================================
    const footerY = 808;
    doc.rect(0, footerY, doc.page.width, 34).fill("#11161d");
    doc.fillColor("#e2e8f0").fontSize(7.5).font("Helvetica").text("SAKK Group  |  sakkgroupmanagement@gmail.com  |  9296900728  |  www.sakkgroup.com", 0, footerY + 7, { width: doc.page.width, align: "center" });
    doc.fillColor("#eab308").fontSize(7).font("Helvetica-Oblique").text("Innovating for a Better Tomorrow", 0, footerY + 18, { width: doc.page.width, align: "center" });

    doc.end();
  });
}


export function makePdf(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, doc.page.width - 110, 40, { width: 60 });
      } catch { }
    }

    doc.fontSize(20).text("SAKK Group", { align: "left" });
    doc.fontSize(16).text(title);
    doc.moveDown();
    doc.fontSize(11);
    for (const l of lines) doc.text(l);
    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666").text("Generated by SAKK Group CRM from live records.");
    doc.end();
  });
}
