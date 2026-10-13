"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Calendar as CalIcon, Clock, Upload, History, FileText, ShoppingCart,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Play, Pause,
  RotateCcw, Download, Plus, Trash2, Eye, Filter, ArrowRight, Check, X
} from "lucide-react";
import { api, fmtMoney, fmtDate } from "@/lib/api";

type Any = Record<string, any>;

function Badge({ v }: { v: string }) {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    issued: "bg-sky-100 text-sky-700",
    approved: "bg-emerald-100 text-emerald-700",
    received: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    new: "bg-amber-100 text-amber-700",
    converted: "bg-emerald-100 text-emerald-700",
    dismissed: "bg-slate-200 text-slate-600",
    reimbursed: "bg-violet-100 text-violet-700",
    todo: "bg-slate-100 text-slate-700",
    in_progress: "bg-amber-100 text-amber-700",
    done: "bg-emerald-100 text-emerald-700",
    blocked: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${colors[v] || "bg-slate-100 text-slate-700"}`}>
      {String(v || "").replace("_", " ")}
    </span>
  );
}

/* =========================================================================
   1. BULK CSV IMPORT WIZARD
   ========================================================================= */
export function ImportWizard({ notify }: { notify: (m: string) => void }) {
  const [importType, setImportType] = useState<"contacts" | "companies" | "products" | "vendors">("contacts");
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<Any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  function parseCSV(text: string) {
    const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setHeaders([]);
      setPreviewRows([]);
      return;
    }
    const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
    setHeaders(rawHeaders);

    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
      const obj: Any = {};
      rawHeaders.forEach((h, idx) => {
        obj[h] = vals[idx] || "";
      });
      return obj;
    });
    setPreviewRows(rows);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || "");
      setCsvText(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  }

  async function runImport() {
    if (previewRows.length === 0) return notify("No CSV rows found to import");
    setImporting(true);
    setResult(null);
    try {
      const r = await api("/api/import", {
        method: "POST",
        body: JSON.stringify({ type: importType, rows: previewRows }),
      });
      setResult(r);
      notify(`Successfully imported ${r.imported} ${importType}!`);
      if (r.failed > 0) notify(`${r.failed} rows had errors or duplicates.`);
    } catch (err: any) {
      notify(err.message);
    } finally {
      setImporting(false);
    }
  }

  const templates: Record<string, string> = {
    contacts: "firstName,lastName,email,phone,title,status,source\nJohn,Doe,john@example.com,+123456789,CEO,lead,website\nSarah,Smith,sarah@acme.com,+987654321,CTO,customer,referral",
    companies: "name,industry,website,email,phone,size,status\nAcme Corp,Software,https://acme.com,info@acme.com,555-1234,11-50,active\nNexus Global,Logistics,https://nexus.com,contact@nexus.com,555-5678,51-200,prospect",
    products: "name,sku,category,price,currency,description\nCRM Enterprise License,SKU-CRM-01,Software,1500,USD,Annual enterprise license\nCloud Setup Package,SKU-SETUP-02,Services,500,USD,Custom cloud provisioning",
    vendors: "name,category,email,phone,status\nAWS Cloud Services,Hosting,billing@aws.amazon.com,800-1234,active\nStripe Payments,Gateway,support@stripe.com,800-5678,active",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Upload className="text-emerald-600" size={22} />
          Bulk CSV Import Wizard
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Import bulk records directly with automated validation, duplicate email detection, and audit logging.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Target Entity</label>
            <select
              value={importType}
              onChange={(e: any) => {
                setImportType(e.target.value);
                setCsvText(templates[e.target.value]);
                parseCSV(templates[e.target.value]);
              }}
              className="mt-1 w-full border rounded-xl px-3 py-2.5 bg-white text-sm"
            >
              <option value="contacts">Contacts & Leads</option>
              <option value="companies">Companies & Accounts</option>
              <option value="products">Products & Services</option>
              <option value="vendors">Vendors & Suppliers</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Upload CSV File</label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:text-xs file:font-semibold cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-600 uppercase">Or Paste CSV Data Below:</span>
            <button
              onClick={() => {
                const sample = templates[importType];
                setCsvText(sample);
                parseCSV(sample);
              }}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Load Sample Template
            </button>
          </div>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              parseCSV(e.target.value);
            }}
            placeholder="Paste raw CSV here..."
            className="w-full border rounded-xl p-3 text-xs font-mono bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {previewRows.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-slate-800">
                Data Preview: <span className="text-emerald-700">{previewRows.length} rows</span> parsed
              </span>
              <button
                disabled={importing}
                onClick={runImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow disabled:opacity-50"
              >
                {importing ? "Importing to PostgreSQL..." : `Import ${previewRows.length} ${importType}`}
              </button>
            </div>

            <div className="max-h-60 overflow-x-auto overflow-y-auto border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase sticky top-0">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="p-2.5 border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {headers.map((h, i) => (
                        <td key={i} className="p-2.5 truncate max-w-[200px]">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewRows.length > 10 && (
              <p className="text-[11px] text-slate-400 mt-1">Showing first 10 rows preview...</p>
            )}
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-xl border bg-slate-50">
            <h4 className="font-bold text-sm text-slate-900 mb-2">Import Results:</h4>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={16} /> {result.imported} Successfully Imported
              </span>
              {result.failed > 0 && (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle size={16} /> {result.failed} Failed / Duplicate Rows
                </span>
              )}
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-3 max-h-36 overflow-y-auto text-xs bg-red-50 text-red-700 p-2 rounded-lg font-mono">
                {result.errors.map((er: any, idx: number) => (
                  <p key={idx}>Row {er.row}: {er.error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   2. CLIENT 360° HISTORY & TIMELINE DRAWER
   ========================================================================= */
export function ClientHistoryModal({
  contactId,
  onClose,
}: {
  contactId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/contacts/${contactId}/history`)
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [contactId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl my-auto shadow-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-5 border-b flex justify-between items-center">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <History className="text-emerald-600 shrink-0" size={20} />
              Client 360° Activity Timeline
            </h3>
            {data?.contact && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px] sm:max-w-md">
                {data.contact.firstName} {data.contact.lastName} • {data.contact.email || "No email"} • {data.contact.title || "Contact"}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800">✕</button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading client history from PostgreSQL...</div>
        ) : !data ? (
          <div className="p-12 text-center text-red-500">Failed to load history</div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <p className="text-lg font-black text-slate-800">{data.counts.activities}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Activities</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <p className="text-lg font-black text-emerald-700">{data.counts.deals}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Deals</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <p className="text-lg font-black text-sky-700">{data.counts.quotations}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Quotes</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <p className="text-lg font-black text-amber-700">{data.counts.invoices}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Invoices</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <p className="text-lg font-black text-violet-700">{data.counts.payments}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Payments</p>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-700">Chronological Event Feed</h4>
              {data.timeline.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center border rounded-xl border-dashed">
                  No historical touchpoints recorded for this contact yet.
                </p>
              ) : (
                <div className="relative border-l-2 border-emerald-500 ml-4 space-y-4 py-2">
                  {data.timeline.map((ev: any) => (
                    <div key={ev.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                      <div className="bg-slate-50 border rounded-xl p-3 hover:bg-white transition shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-sm text-slate-900">{ev.title}</p>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(ev.date)}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{ev.subtitle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {ev.status && <Badge v={ev.status} />}
                          {ev.amount && (
                            <span className="text-xs font-bold text-emerald-800 ml-auto">{ev.amount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   3. INTERACTIVE CALENDAR UI
   ========================================================================= */
export function CalendarView({ notify }: { notify: (m: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState<any>(null);
  const [team, setTeam] = useState<Any[]>([]);
  const [savingEvent, setSavingEvent] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const r = await api("/api/calendar");
      setEvents(r.events || []);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadEvents();
    api("/api/team").then(r => setTeam(r.items || [])).catch(() => { });
  }, [loadEvents]);

  async function saveEvent() {
    if (!scheduleModal?.title?.trim()) return notify("Event title required");
    setSavingEvent(true);
    try {
      await api("/api/activities", {
        method: "POST",
        body: JSON.stringify({
          title: scheduleModal.title,
          type: scheduleModal.type || "task",
          priority: scheduleModal.priority || "medium",
          dueDate: scheduleModal.dueDate || new Date().toISOString(),
          description: scheduleModal.description || "",
          assignedTo: scheduleModal.assignedTo || null,
        }),
      });
      notify("Activity scheduled on calendar!");
      setScheduleModal(null);
      loadEvents();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setSavingEvent(false);
    }
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Days grid
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalIcon className="text-emerald-600" size={20} />
            {monthNames[month]} {year}
          </h2>
          <p className="text-xs text-slate-500">
            Interactive master schedule: Click any day cell or "+ Schedule Event" to log calls, meetings, and deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setScheduleModal({ title: "", type: "task", priority: "medium", dueDate: new Date().toISOString().slice(0, 10), description: "", assignedTo: "" })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={15} /> Schedule Event
          </button>
          <button onClick={prevMonth} className="p-2 border rounded-lg hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-slate-50">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 border rounded-lg hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-100 text-center font-bold text-xs uppercase py-2.5 text-slate-600 border-b">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[550px]">
          {daysArray.map((day, idx) => {
            if (!day) return <div key={idx} className="bg-slate-50/50 p-2 min-h-[90px]" />;

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = events.filter((e) => e.date === dateStr);
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;

            return (
              <div
                key={idx}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".event-bubble")) return;
                  setScheduleModal({ title: "", type: "task", priority: "medium", dueDate: dateStr, description: "", assignedTo: "" });
                }}
                className={`p-1.5 min-h-[90px] flex flex-col group cursor-pointer hover:bg-slate-50/80 transition ${isToday ? "bg-emerald-50/40" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-emerald-600 text-white" : "text-slate-700"}`}>
                    {day}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-700 font-bold transition">
                    + Add
                  </span>
                </div>

                <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                  {dayEvents.map((ev, i) => {
                    const typeColor =
                      ev.type === "invoice"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : ev.type === "task"
                          ? "bg-sky-100 text-sky-800 border-sky-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200";

                    return (
                      <div
                        key={i}
                        title={ev.title}
                        className={`event-bubble text-[10px] font-medium p-1 rounded border leading-tight truncate cursor-pointer ${typeColor}`}
                        onClick={() => notify(`${ev.title} (Status: ${ev.status})`)}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {scheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">Schedule Event / Activity</h3>
                <p className="text-xs text-slate-500">Plan a meeting, call, task, or deadline</p>
              </div>
              <button onClick={() => setScheduleModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={scheduleModal.title}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, title: e.target.value })}
                  placeholder="e.g. Client demo presentation"
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type</label>
                  <select
                    value={scheduleModal.type}
                    onChange={(e) => setScheduleModal({ ...scheduleModal, type: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="email">Email</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={scheduleModal.priority}
                    onChange={(e) => setScheduleModal({ ...scheduleModal, priority: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleModal.dueDate}
                    onChange={(e) => setScheduleModal({ ...scheduleModal, dueDate: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Rep</label>
                  <select
                    value={scheduleModal.assignedTo || ""}
                    onChange={(e) => setScheduleModal({ ...scheduleModal, assignedTo: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Agenda</label>
                <textarea
                  rows={2}
                  value={scheduleModal.description}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, description: e.target.value })}
                  placeholder="Agenda items or call objectives..."
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setScheduleModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEvent}
                onClick={saveEvent}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {savingEvent ? "Scheduling..." : "Save to Calendar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. INTERACTIVE PROJECT GANTT & TIMELINE VIEW
   ========================================================================= */
export function ProjectGantt({ notify }: { notify: (m: string) => void }) {
  const [projects, setProjects] = useState<Any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState<Any[]>([]);

  useEffect(() => {
    api("/api/projects").then((d) => {
      setProjects(d.items || []);
      if (d.items?.length > 0) setSelectedProjectId(d.items[0].id);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    api(`/api/project-tasks?projectId=${selectedProjectId}`)
      .then((d) => setTasks(d.items || []))
      .catch(() => { });
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalIcon className="text-emerald-600" size={20} />
            Visual Project Gantt & Task Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize project milestones, task delivery schedules, and execution deadlines.
          </p>
        </div>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="border rounded-xl px-4 py-2 bg-white text-sm font-semibold"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.taskCount || 0} tasks)
            </option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center mb-6 border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedProject.name}</h3>
              <p className="text-xs text-slate-500">
                Timeline: {fmtDate(selectedProject.startDate)} → {fmtDate(selectedProject.endDate)} • Budget: {fmtMoney(selectedProject.budget)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700">{selectedProject.computedProgress || 0}% Completed</span>
              <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedProject.computedProgress || 0}%` }} />
              </div>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed rounded-xl">
              No tasks scheduled for this project. Add tasks in the Projects tab to display the Gantt schedule.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((t, idx) => {
                const isDone = t.status === "done";
                const priorityColor =
                  t.priority === "urgent"
                    ? "bg-red-500"
                    : t.priority === "high"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                return (
                  <div key={t.id} className="border rounded-xl p-3 bg-slate-50 hover:bg-white transition">
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="font-semibold flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${priorityColor}`} />
                        {t.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge v={t.status} />
                        <span className="text-slate-400">Due: {fmtDate(t.dueDate)}</span>
                      </div>
                    </div>

                    {/* Horizontal Gantt Progress Bar */}
                    <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${isDone ? "bg-emerald-600" : "bg-sky-500"}`}
                        style={{
                          width: isDone ? "100%" : t.status === "in_progress" ? "55%" : "15%",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Assigned: {t.assigneeName || "Unassigned"}</span>
                      <span>Est: {t.estimatedHours || 0}h | Actual: {t.actualHours || 0}h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   5. LIVE TIME TRACKER STOPWATCH WIDGET
   ========================================================================= */
export function TimeTrackerWidget({ notify }: { notify: (m: string) => void }) {
  const [tasks, setTasks] = useState<Any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"stopwatch" | "manual">("stopwatch");
  const [manualHours, setManualHours] = useState("1");
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [loggingManual, setLoggingManual] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    api("/api/project-tasks").then((d) => {
      setTasks(d.items || []);
      if (d.items?.length > 0) setSelectedTaskId(d.items[0].id);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const timeFormatted = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  async function logTrackedTime() {
    if (!selectedTaskId) return notify("Please select a task to log time for");
    if (seconds < 10) return notify("Timer is less than 10 seconds. Log at least 1 minute.");

    const loggedHours = (seconds / 3600).toFixed(2);
    try {
      await api("/api/time-logs", {
        method: "POST",
        body: JSON.stringify({
          taskId: selectedTaskId,
          hours: loggedHours,
          description: description || "Interactive session log",
        }),
      });
      notify(`Logged ${loggedHours} hours to project task!`);
      setSeconds(0);
      setIsRunning(false);
      setDescription("");
    } catch (e: any) {
      notify(e.message);
    }
  }

  async function logManualTime() {
    if (!selectedTaskId) return notify("Please select a task");
    if (!manualHours || Number(manualHours) <= 0) return notify("Please enter valid hours");
    setLoggingManual(true);
    try {
      await api("/api/time-logs", {
        method: "POST",
        body: JSON.stringify({
          taskId: selectedTaskId,
          hours: manualHours,
          logDate: manualDate || new Date().toISOString().slice(0, 10),
          description: description || "Manual project time entry",
        }),
      });
      notify(`Successfully logged ${manualHours} hours to project!`);
      setDescription("");
    } catch (e: any) {
      notify(e.message);
    } finally {
      setLoggingManual(false);
    }
  }

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-white/10">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Clock className="text-emerald-400" size={16} />
          Project Time Tracker & Logger
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/10 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setMode("stopwatch")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${mode === "stopwatch" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"}`}
            >
              ⏱️ Stopwatch
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${mode === "manual" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"}`}
            >
              ✍️ Manual Entry
            </button>
          </div>
          {mode === "stopwatch" && (
            <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-emerald-400">
              {isRunning ? "RECORDING" : "IDLE"}
            </span>
          )}
        </div>
      </div>

      {mode === "stopwatch" ? (
        <div className="grid sm:grid-cols-2 gap-4 items-center">
          <div>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.projectName || "General"})
                </option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Work memo (e.g. Design review, bugfix)"
              className="w-full mt-2 bg-slate-800 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
            />
          </div>

          <div className="flex flex-col items-center sm:items-end">
            <span className="text-3xl font-black font-mono tracking-wider text-emerald-400">
              {timeFormatted}
            </span>
            <div className="flex gap-2 mt-2">
              {!isRunning ? (
                <button
                  onClick={() => setIsRunning(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Play size={13} /> Start
                </button>
              ) : (
                <button
                  onClick={() => setIsRunning(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Pause size={13} /> Pause
                </button>
              )}
              <button
                onClick={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg text-xs"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={logTrackedTime}
                className="bg-white text-slate-900 hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold"
              >
                Commit Log
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Project Task *</label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.projectName || "General"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Hours *</label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Log Date</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of work completed..."
              className="w-full bg-slate-800 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <div>
            <button
              disabled={loggingManual}
              onClick={logManualTime}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-50"
            >
              {loggingManual ? "Logging..." : "Save Time Log"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   6. PURCHASE ORDERS SUITE (PROCUREMENT)
   ========================================================================= */
export function PurchaseOrders({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]);
  const [vendorsList, setVendorsList] = useState<Any[]>([]);
  const [projectsList, setProjectsList] = useState<Any[]>([]);
  const [modal, setModal] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [poRes, vRes, pRes] = await Promise.all([
        api("/api/purchase-orders"),
        api("/api/vendors"),
        api("/api/projects"),
      ]);
      setItems(poRes.items || []);
      setVendorsList(vRes.items || []);
      setProjectsList(pRes.items || []);
    } catch (e: any) {
      notify(e.message);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!modal.title) return notify("Title is required");
    try {
      if (modal.id) {
        await api(`/api/purchase-orders/${modal.id}`, {
          method: "PUT",
          body: JSON.stringify(modal),
        });
        notify("Purchase order updated");
      } else {
        await api("/api/purchase-orders", {
          method: "POST",
          body: JSON.stringify(modal),
        });
        notify("Purchase order created and issued");
      }
      setModal(null);
      load();
    } catch (e: any) {
      notify(e.message);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this purchase order?")) return;
    try {
      await api(`/api/purchase-orders/${id}`, { method: "DELETE" });
      notify("Purchase order deleted");
      load();
    } catch (e: any) {
      notify(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" size={20} />
            Purchase Orders (Procurement)
          </h2>
          <p className="text-xs text-slate-500">
            Issue formal POs to vendors, link ordered equipment to projects, and download branded PDFs.
          </p>
        </div>
        <button
          onClick={() =>
            setModal({
              title: "",
              vendorId: "",
              projectId: "",
              status: "draft",
              currency: "USD",
              items: [{ name: "Material Supplies", quantity: 1, unitPrice: 0 }],
            })
          }
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow"
        >
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed text-sm text-slate-500">
          No purchase orders issued yet. Create your first PO to formalize supplier procurement.
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[850px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-mono font-bold text-slate-800">{po.poNumber}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{po.title}</td>
                  <td className="p-3.5">{po.vendorName || "—"}</td>
                  <td className="p-3.5">{po.projectName || "General"}</td>
                  <td className="p-3.5 font-bold text-emerald-700">{fmtMoney(po.total, po.currency)}</td>
                  <td className="p-3.5"><Badge v={po.status} /></td>
                  <td className="p-3.5 text-right space-x-1">
                    <a
                      href={`/api/purchase-orders/${po.id}/pdf`}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Download size={12} /> PDF
                    </a>
                    <button
                      onClick={() => setModal(po)}
                      className="px-2.5 py-1 border rounded-lg text-xs font-semibold hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(po.id)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xl my-auto shadow-2xl p-4 sm:p-6 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900">{modal.id ? "Edit Purchase Order" : "New Purchase Order"}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Title *</label>
                <input
                  value={modal.title || ""}
                  onChange={(e) => setModal({ ...modal, title: e.target.value })}
                  placeholder="Servers procurement — AWS"
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Vendor</label>
                  <select
                    value={modal.vendorId || ""}
                    onChange={(e) => setModal({ ...modal, vendorId: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select Vendor</option>
                    {vendorsList.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Project</label>
                  <select
                    value={modal.projectId || ""}
                    onChange={(e) => setModal({ ...modal, projectId: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">General (None)</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Total Amount</label>
                  <input
                    type="number"
                    value={modal.total || 0}
                    onChange={(e) => setModal({ ...modal, total: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Currency</label>
                  <select
                    value={modal.currency || "USD"}
                    onChange={(e) => setModal({ ...modal, currency: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>AED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Status</label>
                  <select
                    value={modal.status || "draft"}
                    onChange={(e) => setModal({ ...modal, status: e.target.value })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option>draft</option><option>issued</option><option>approved</option><option>received</option><option>cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-sm">Cancel</button>
              <button onClick={save} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save Purchase Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   7. ACCOUNTS PAYABLE (AP) AGING & BATCH REIMBURSEMENT
   ========================================================================= */
export function APAgingView({ notify }: { notify: (m: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reimbursing, setReimbursing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/finance/ap-aging");
      setData(r);
    } catch (e: any) {
      notify(e.message);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function runBatchReimburse() {
    if (selectedIds.length === 0) return notify("Select at least one expense for batch reimbursement");
    setReimbursing(true);
    try {
      const r = await api("/api/finance/ap-aging", {
        method: "POST",
        body: JSON.stringify({ expenseIds: selectedIds }),
      });
      notify(r.message);
      setSelectedIds([]);
      load();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setReimbursing(false);
    }
  }

  function toggleAll() {
    if (!data?.items) return;
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map((i: any) => i.id));
    }
  }

  if (!data) return <p className="text-slate-400">Loading AP aging ledger...</p>;
  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-emerald-600" size={20} />
            Accounts Payable (AP) Aging & Reimbursements
          </h2>
          <p className="text-xs text-slate-500">
            30/60/90-day aging buckets for supplier bills and batch reimbursement payouts.
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            disabled={reimbursing}
            onClick={runBatchReimburse}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 shadow"
          >
            <Check size={16} /> Reimburse Batch ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Aging Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">0 - 30 Days (Current)</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{fmtMoney(s.current_0_30)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">31 - 60 Days</p>
          <p className="text-xl font-black text-sky-700 mt-1">{fmtMoney(s.aging_31_60)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">61 - 90 Days</p>
          <p className="text-xl font-black text-amber-700 mt-1">{fmtMoney(s.aging_61_90)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">90+ Days Overdue</p>
          <p className="text-xl font-black text-red-600 mt-1">{fmtMoney(s.over_90)}</p>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-4 col-span-2 lg:col-span-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Outstanding</p>
          <p className="text-xl font-black text-white mt-1">{fmtMoney(s.totalPayable)}</p>
        </div>
      </div>

      {/* Payables Ledger Table */}
      <div className="bg-white border rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === data.items.length}
                  onChange={toggleAll}
                  className="rounded w-4 h-4 accent-emerald-600"
                />
              </th>
              <th className="p-3">Expense / Bill</th>
              <th className="p-3">Vendor / Category</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Aging Bracket</th>
              <th className="p-3">Age</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No accounts payable liabilities currently outstanding. All bills and claims are settled!
                </td>
              </tr>
            ) : (
              data.items.map((i: any) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(i.id)}
                      onChange={() => {
                        setSelectedIds((prev) =>
                          prev.includes(i.id) ? prev.filter((x) => x !== i.id) : [...prev, i.id]
                        );
                      }}
                      className="rounded w-4 h-4 accent-emerald-600"
                    />
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{i.title}</td>
                  <td className="p-3 text-xs text-slate-600">{i.vendorName || i.category || "General"}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtMoney(i.amount, i.currency)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${i.ageDays > 90 ? "bg-red-100 text-red-700" : i.ageDays > 60 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {i.bucket}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{i.ageDays} days</td>
                  <td className="p-3"><Badge v={i.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   8. PUBLIC INBOUND LEADS & WEBSITE FORM EMBED CODE
   ========================================================================= */
export function LeadCaptureInbox({ notify }: { notify: (m: string) => void }) {
  const [leads, setLeads] = useState<Any[]>([]);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [team, setTeam] = useState<Any[]>([]);
  const [savingLead, setSavingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "phone_call",
    status: "new",
    assignedTo: "",
    message: "",
  });

  const load = useCallback(async () => {
    try {
      const r = await api("/api/leads/submissions");
      setLeads(r.items || []);
    } catch (e: any) {
      notify(e.message);
    }
  }, [notify]);

  useEffect(() => {
    load();
    api("/api/team").then(r => setTeam(r.items || [])).catch(() => { });
  }, [load]);

  async function updateStatus(id: string, status: string) {
    try {
      await api("/api/leads/submissions", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      notify(`Lead marked as ${status}`);
      load();
    } catch (e: any) {
      notify(e.message);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await api(`/api/leads/submissions?id=${id}`, { method: "DELETE" });
      notify("Lead deleted successfully");
      load();
    } catch (e: any) {
      notify(e.message);
    }
  }

  async function saveManualLead() {
    if (!leadForm.name.trim()) return notify("Lead name is required");
    setSavingLead(true);
    try {
      await api("/api/leads/submissions", {
        method: "POST",
        body: JSON.stringify(leadForm),
      });
      notify("Lead added successfully! Contact and follow-up activity created.");
      setShowAddModal(false);
      setLeadForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "phone_call",
        status: "new",
        assignedTo: "",
        message: "",
      });
      load();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setSavingLead(false);
    }
  }

  const embedSnippet = `<!-- SAKK Group CRM Inbound Lead Capture Widget -->
<form action="${typeof window !== "undefined" ? window.location.origin : ""}/api/leads/capture" method="POST">
  <input type="text" name="name" placeholder="Your Name" required />
  <input type="email" name="email" placeholder="Your Email" required />
  <input type="tel" name="phone" placeholder="Phone Number" />
  <input type="text" name="company" placeholder="Company Name" />
  <textarea name="message" placeholder="How can we help?"></textarea>
  <button type="submit">Submit Inquiry</button>
</form>`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ArrowRight className="text-emerald-600" size={20} />
            Inbound Leads & Inquiry Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            Manage incoming leads from calls, WhatsApp, website contact forms, referrals, and marketing webhooks.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={16} /> Add Lead Manually
          </button>
          <button
            onClick={() => setShowEmbedCode(!showEmbedCode)}
            className="border bg-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            {showEmbedCode ? "Hide Form Snippet" : "Get Website Form Code"}
          </button>
        </div>
      </div>

      {showEmbedCode && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
              Embeddable HTML Contact Form Snippet
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedSnippet);
                notify("HTML form snippet copied to clipboard!");
              }}
              className="text-xs bg-emerald-600 px-3 py-1 rounded font-semibold text-white"
            >
              Copy HTML
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Paste this form into your WordPress, Webflow, React landing page, or Wix site. Submissions are auto-routed into SAKK Group CRM with instant notifications.
          </p>
          <pre className="text-xs font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-emerald-300">
            {embedSnippet}
          </pre>
        </div>
      )}

      <div className="bg-white border rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b">
            <tr>
              <th className="p-3">Lead Name</th>
              <th className="p-3">Contact Details</th>
              <th className="p-3">Company</th>
              <th className="p-3">Source</th>
              <th className="p-3">Message / Requirements</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No leads recorded yet. Click &quot;Add Lead Manually&quot; to log a phone/WhatsApp inquiry or embed the website contact form.
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{l.name}</td>
                  <td className="p-3 text-xs text-slate-600">
                    <p>{l.email}</p>
                    <p className="text-slate-400">{l.phone || ""}</p>
                  </td>
                  <td className="p-3 text-xs">{l.company || "—"}</td>
                  <td className="p-3 text-xs">
                    <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700">
                      {(l.source || "inbound").replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-600 max-w-[200px] truncate">{l.message || "—"}</td>
                  <td className="p-3 text-xs text-slate-400">{fmtDate(l.createdAt)}</td>
                  <td className="p-3"><Badge v={l.status} /></td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    {l.status !== "converted" && (
                      <button
                        onClick={() => updateStatus(l.id, "converted")}
                        className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition"
                      >
                        Convert
                      </button>
                    )}
                    {l.status !== "dismissed" && (
                      <button
                        onClick={() => updateStatus(l.id, "dismissed")}
                        className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      onClick={() => deleteLead(l.id)}
                      title="Delete lead"
                      className="p-1 text-slate-400 hover:text-red-600 rounded inline-flex items-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">Add Lead Manually</h3>
                <p className="text-xs text-slate-500">Log an inquiry from phone, WhatsApp, referral, or walk-in</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Name *</label>
                <input
                  type="text"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+91 92969 00728"
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    placeholder="e.g. Pasada Group"
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="phone_call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="walk_in">Direct Walk-In</option>
                    <option value="referral">Client Referral</option>
                    <option value="event">Trade Show / Conference</option>
                    <option value="social">LinkedIn / Social Media</option>
                    <option value="website_form">Website Contact Form</option>
                    <option value="other">Other Inbound</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Sales Rep</label>
                  <select
                    value={leadForm.assignedTo}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Auto-Assign (Round-Robin)</option>
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry / Requirement Notes</label>
                <textarea
                  rows={3}
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  placeholder="Inquired about project architecture, requested proposal by next week..."
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingLead}
                onClick={saveManualLead}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {savingLead ? "Saving Lead..." : "Save Lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
