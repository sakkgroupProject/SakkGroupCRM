"use client";

import React from "react";
import { X, Download, Printer } from "lucide-react";

export interface SakkInvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export function SakkInvoiceModal({ invoice, onClose }: SakkInvoiceModalProps) {
  if (!invoice) return null;

  const curr = (invoice.currency || "USD").toUpperCase();
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ name: invoice.title || "Professional Services", quantity: invoice.quantity || 1, unitPrice: invoice.amount || 0, total: Number(invoice.amount || 0) * Number(invoice.quantity || 1) }];

  const subtotal = items.reduce((sum: number, it: any) => sum + Number(it.total || (Number(it.unitPrice || 0) * Number(it.quantity || 1))), 0);
  const taxRate = Number(invoice.taxRate || 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;
  const amountPaid = Number(invoice.paidAmount || 0);
  const balanceDue = Number(invoice.outstanding ?? Math.max(0, totalAmount - amountPaid));

  function formatDate(d: any) {
    if (!d) return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function numberToWords(amt: number): string {
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

    const intPart = Math.floor(Math.abs(amt));
    const words = numToString(intPart).trim();
    const currLabel = curr === "USD" ? "US Dollars" : curr === "INR" ? "Rupees" : `${curr} Units`;
    return `${currLabel} ${words || "Zero"} Only`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm tracking-wide">Official SAKK Group Tax Invoice</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition min-h-[36px]"
            >
              <Download size={14} /> Download PDF
            </a>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition border border-slate-700 min-h-[36px]"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable / Viewable A4 Invoice Paper */}
        <div className="overflow-x-auto overflow-y-auto flex-1 w-full bg-slate-200/50 print:overflow-visible">
          <div className="min-w-[680px] p-8 sm:p-12 bg-white text-slate-900 font-sans print:p-0 print:min-w-0">

            {/* 1. Header Banner */}
            <div className="bg-[#11161d] text-white -mx-8 -mt-8 sm:-mx-12 sm:-mt-12 p-6 sm:p-8 flex items-center gap-6">
            <img src="/logo.png" alt="SAKK Group" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">SAKK GROUP</h1>
              <p className="text-xs sm:text-sm font-semibold text-amber-400">Innovating for a Better Tomorrow</p>
              <div className="text-[11px] sm:text-xs text-slate-300 space-y-0.5 pt-0.5 font-light">
                <p>sakkgroupmanagement@gmail.com &nbsp;|&nbsp; +91 8294219244</p>
                <p>www.sakkgroup.com</p>
                <p>Delhi - 110092, India &nbsp;|&nbsp; GST: 07AFWFS6592Q1ZI</p>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                <span>✓</span> ISO/IEC 27001:2022 CERTIFIED — INFORMATION SECURITY MANAGEMENT
              </p>
            </div>
          </div>

          {/* 2. INVOICE Title & Invoice Box */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">INVOICE</h2>
            <div className="border border-slate-300 rounded-lg overflow-hidden w-full sm:w-72 text-xs">
              <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-white">
                <span className="text-slate-500 font-medium">Invoice No.</span>
                <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-slate-50/50">
                <span className="text-slate-500 font-medium">Invoice Date</span>
                <span className="font-medium text-slate-900">{formatDate(invoice.issuedDate || invoice.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 3. BILL TO & PAYMENT DETAILS */}
          <div className="mt-8 grid sm:grid-cols-2 gap-8 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3.5 bg-amber-600 rounded-full" />
                <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs">BILL TO</h3>
              </div>
              <p className="text-sm font-bold text-slate-900 uppercase">{invoice.companyName || invoice.clientName || invoice.title || "VALUED CLIENT"}</p>
              {(invoice.contactName || invoice.attnName) && (
                <p className="text-slate-600 mt-1">Attn: {invoice.contactName || invoice.attnName}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3.5 bg-amber-600 rounded-full" />
                <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs">PAYMENT DETAILS</h3>
              </div>
              <div className="space-y-1 text-slate-700">
                <p><span className="text-slate-500">Mode of Payment:</span> Bank Transfer / Wise</p>
                <p><span className="text-slate-500">Payment Status:</span> <span className="font-semibold">{balanceDue <= 0 ? "Paid" : amountPaid > 0 ? "Partially Paid" : "Pending"}</span></p>
                <p><span className="text-slate-500">Currency:</span> {curr} ({curr === "USD" ? "US Dollar" : curr === "INR" ? "Indian Rupee" : curr})</p>
              </div>
            </div>
          </div>

          {/* 4. Line Items Table */}
          <div className="mt-8 border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#11161d] text-white">
                  <th className="py-2.5 px-4 text-left font-bold uppercase tracking-wide">DESCRIPTION</th>
                  <th className="py-2.5 px-4 text-right font-bold uppercase tracking-wide">AMOUNT ({curr})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{it.name || it.description}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {Number(it.total || (Number(it.unitPrice || 0) * Number(it.quantity || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 px-4 text-slate-500 font-medium">Subtotal</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-slate-900">
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-500 font-medium">GST @ {taxRate}% (as per Indian Government tax)</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-slate-900">
                    {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-t border-slate-300">
                  <td className="py-2 px-4 font-bold text-slate-900">Total Invoice Amount</td>
                  <td className="py-2 px-4 text-right font-bold font-mono text-slate-900">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-500 font-medium">Amount Paid</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-slate-900">
                    {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-[#11161d] text-white">
                  <td className="py-3 px-4 font-bold text-amber-400 text-sm">BALANCE DUE</td>
                  <td className="py-3 px-4 text-right font-black text-white text-base font-mono">
                    {curr} {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-600 italic mt-3">
            Amount in Words: {numberToWords(balanceDue)}
          </p>

          {/* 5. NOTE Section */}
          <div className="mt-6 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3.5 bg-amber-600 rounded-full" />
              <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs">NOTE</h3>
            </div>
            <div className="space-y-1 text-slate-600 pl-3 border-l-2 border-slate-100">
              <p>• Amount paid of {curr} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been received and adjusted against the total invoice value.</p>
              <p>• Remaining balance of {curr} {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is payable via Bank Transfer / Wise to the account below.</p>
            </div>
          </div>

          {/* 6. BANK DETAILS & Kundan Bharti Signature */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 bg-amber-600 rounded-full" />
                <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs">BANK DETAILS</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Account Name</span>
                  <span className="font-bold text-slate-900">SAKK GROUP</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">IFSC Code</span>
                  <span className="font-bold text-slate-900 font-mono">ICIC0000831</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Bank Name</span>
                  <span className="font-bold text-slate-900">ICICI Bank</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">SWIFT Code</span>
                  <span className="font-bold text-slate-900 font-mono">ICICINBBCTS</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Branch</span>
                  <span className="font-bold text-slate-900">Delhi, Laxminagar</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Account Type</span>
                  <span className="font-bold text-slate-900">Current Account</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Account Number</span>
                  <span className="font-bold text-slate-900 font-mono">083105004592</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">GST No.</span>
                  <span className="font-bold text-slate-900 font-mono">07AFWFS6592Q1ZI</span>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="w-48 text-center shrink-0 self-end md:self-auto">
              <div className="h-16 flex items-center justify-center">
                <img src="/signature.png" alt="Kundan Bharti Signature" className="max-h-16 max-w-full object-contain" />
              </div>
              <p className="font-bold text-xs text-slate-900 mt-2">For SAKK Group</p>
              <p className="text-[11px] text-slate-500">Authorized Signatory</p>
            </div>
          </div>

          {/* 7. Bottom Footer Bar */}
          <div className="bg-[#11161d] text-white -mx-8 -mb-8 sm:-mx-12 sm:-mb-12 mt-10 py-3.5 px-6 text-center text-[11px] space-y-0.5">
            <p className="text-slate-300">SAKK Group &nbsp;|&nbsp; sakkgroupmanagement@gmail.com &nbsp;|&nbsp; +91 8294219244 &nbsp;|&nbsp; www.sakkgroup.com</p>
            <p className="text-amber-400 font-medium italic text-[10px]">Innovating for a Better Tomorrow</p>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}

