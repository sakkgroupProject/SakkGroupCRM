"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { LayoutDashboard, Users, Building2, Handshake, KanbanSquare, CheckSquare, Package, FileText, BarChart3, Settings, LogOut, Plus, Search, Pencil, Trash2, X, Download, Phone, Mail, Calendar, ChevronRight, TrendingUp, DollarSign, AlertCircle, UserPlus, Globe, MapPin, ShoppingCart, Upload, History, ArrowRight, Layers, Sliders, ShieldCheck, Menu, Eye, EyeOff } from "lucide-react";
import { api, fmtMoney, fmtDate } from "@/lib/api";
import { Quotations, Contracts, Projects, Vendors, Expenses, Payments, Documents, Notifications, AuditLogs, Recurring } from "@/components/extra";
import { ImportWizard, ClientHistoryModal, CalendarView, ProjectGantt, TimeTrackerWidget, PurchaseOrders, APAgingView, LeadCaptureInbox } from "@/components/power-features";
import {
  AccountingSyncHub, ExecutiveProjectWidget, AdvancedSVGCharts,
  DashboardPersonalizer, ProductTieredPricingModal, WorkloadCapacityView,
  BankReconciliationView, WorkflowRulesBuilder, CustomFieldsManager
} from "@/components/enterprise-suite";
import { SakkInvoiceModal } from "@/components/sakk-invoice-modal";


type Any = Record<string, any>;
const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_LABEL: Record<string, string> = { lead: "Lead", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost" };
const STAGE_COLOR: Record<string, string> = { lead: "bg-slate-100 text-slate-700", qualified: "bg-sky-100 text-sky-700", proposal: "bg-amber-100 text-amber-700", negotiation: "bg-orange-100 text-orange-700", won: "bg-emerald-100 text-emerald-700", lost: "bg-red-100 text-red-700" };
const STATUS_COLOR: Record<string, string> = { lead: "bg-amber-100 text-amber-700", prospect: "bg-sky-100 text-sky-700", customer: "bg-emerald-100 text-emerald-700", active: "bg-emerald-100 text-emerald-700", churned: "bg-red-100 text-red-700", partner: "bg-violet-100 text-violet-700", draft: "bg-slate-100 text-slate-700", sent: "bg-sky-100 text-sky-700", paid: "bg-emerald-100 text-emerald-700", overdue: "bg-red-100 text-red-700", cancelled: "bg-slate-200 text-slate-600" };

function Badge({ v }: { v: string }) { return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STAGE_COLOR[v] || STATUS_COLOR[v] || "bg-slate-100 text-slate-700"}`}>{v}</span>; }
function Input(props: any) {
  const [showPw, setShowPw] = useState(false);
  if (props.type === "password") {
    return (
      <div className="relative w-full">
        <input
          {...props}
          type={showPw ? "text" : "password"}
          className={`w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition ${props.className || ""}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPw(prev => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md transition focus:outline-none min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
          aria-label={showPw ? "Hide password" : "Show password"}
          title={showPw ? "Hide password" : "Show password"}
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
  return <input {...props} className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition ${props.className || ""}`} />;
}

function Select(props: any) { return <select {...props} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />; }
function Textarea(props: any) { return <textarea {...props} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />; }
function Field({ label, children }: { label: string, children: React.ReactNode }) { return <label className="block"><span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span><div className="mt-1">{children}</div></label>; }
function Modal({ title, onClose, children, onSave, saving }: { title: string, onClose: () => void, children: React.ReactNode, onSave: () => void, saving?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b shrink-0 bg-white">
          <h3 className="font-bold text-base sm:text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center"><X size={20} /></button>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-1">{children}</div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-end gap-2 shrink-0 bg-slate-50/80">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-white min-h-[40px]">Cancel</button>
          <button disabled={saving} onClick={onSave} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 min-h-[40px]">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
function Empty({ text, action, onAction }: { text: string, action?: string, onAction?: () => void }) { return <div className="text-center py-16 bg-white rounded-xl border border-dashed"><p className="text-slate-500 text-sm">{text}</p>{action && <button onClick={onAction} className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">{action}</button>}</div>; }

export default function Home() {
  const [user, setUser] = useState<Any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "reset" | "mfa">("login"); const [inviteToken, setInviteToken] = useState(""); const [resetToken, setResetToken] = useState(""); const [mfaToken, setMfaToken] = useState(""); const [mfaCode, setMfaCode] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [authErr, setAuthErr] = useState("");
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notify = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(""), 3500); }, []);
  const checkAuth = useCallback(async () => { try { const u = await api("/api/auth/me"); setUser(u); } catch { setUser(null); } finally { setAuthLoading(false); } }, []);
  useEffect(() => { checkAuth(); try { const q = new URLSearchParams(window.location.search); if (q.get("invite")) { setInviteToken(q.get("invite") || ""); setAuthMode("register"); if (q.get("email")) setAuthForm(f => ({ ...f, email: q.get("email") || "" })); } if (q.get("reset")) { setResetToken(q.get("reset") || ""); setAuthMode("reset"); } } catch { } }, [checkAuth]);

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault(); setAuthErr(""); try {
      if (authMode === "forgot") { const r = await api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: authForm.email }) }); notify(r.message); setAuthMode("login"); return; }
      if (authMode === "reset") { await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token: resetToken, password: newPassword }) }); notify("Password reset — login with new password"); setAuthMode("login"); return; }
      if (authMode === "mfa") { const u = await api("/api/auth/mfa/verify", { method: "POST", body: JSON.stringify({ mfaToken, code: mfaCode }) }); setUser(u); notify("Welcome back (MFA verified)"); return; }
      const u = await api(`/api/auth/${authMode}`, { method: "POST", body: JSON.stringify(authMode === "register" ? { ...authForm, inviteToken } : authForm) });
      if (u.mfaRequired) { setMfaToken(u.mfaToken); setAuthMode("mfa"); notify("Enter your authenticator code"); return; }
      setUser(u); notify(authMode === "register" ? "Account created — welcome to SAKK Group CRM" : "Welcome back");
    } catch (err: any) { setAuthErr(err.message); }
  }
  async function logout() { await api("/api/auth/logout", { method: "POST" }).catch(() => { }); setUser(null); }

  if (authLoading) return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="text-center"><div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-3 text-sm text-slate-500">Loading SAKK Group CRM...</p></div></div>;

  if (!user) return (
    <div className="min-h-screen bg-slate-900 flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="SAKK Group Logo" width={64} height={64} priority className="w-16 h-16 object-contain rounded-full shadow-xl ring-2 ring-emerald-400/40 bg-slate-800" />
          <div>
            <span className="font-bold text-2xl tracking-wide">SAKK Group CRM</span>
            <p className="text-xs text-emerald-400 font-medium">Innovating for a Better Tomorrow</p>
          </div>
        </div>
        <h1 className="text-5xl font-black leading-tight mt-10">Every customer.<br />Every deal.<br /><span className="text-emerald-400">One workspace.</span></h1>
        <p className="text-slate-300 mt-5 max-w-md">Complete CRM with real — contacts, companies, pipeline, activities, products, invoicing, team &amp; reports.Everything you create is saved live.</p>
        <div className="grid grid-cols-3 gap-4 mt-10 max-w-md text-center">{[["Contacts", "Unlimited"], ["Deals", "Pipeline"], ["Invoices", "Billing"]].map(([a, b]) => <div key={a} className="bg-white/10 rounded-xl p-4"><p className="font-bold">{a}</p><p className="text-xs text-slate-300">{b}</p></div>)}</div>
      </div>
      <div className="flex-1 grid place-items-center bg-slate-50 p-6">
        <form onSubmit={submitAuth} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <Image src="/logo.png" alt="SAKK Group Logo" width={48} height={48} priority className="w-12 h-12 object-contain rounded-full shadow" />
            <div>
              <p className="font-bold text-lg leading-tight text-slate-900">SAKK Group</p>
              <p className="text-xs text-slate-500">Innovating for a Better Tomorrow</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold">{authMode === "register" ? "Create your CRM account" : authMode === "forgot" ? "Forgot password" : authMode === "reset" ? "Reset password" : authMode === "mfa" ? "Two-factor verification" : "Sign in to SAKK Group CRM"}</h2>
          <p className="text-sm text-slate-500 mt-1">{authMode === "register" ? "Start managing customers in minutes. Your data is stored in PostgreSQL." : "Use the account you registered with."}</p>
          {authErr && <div className="mt-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg flex gap-2"><AlertCircle size={16} />{authErr}</div>}
          <div className="space-y-4 mt-6">
            {authMode === "register" && <Field label="Full name"><Input required value={authForm.name} onChange={(e: any) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Alex Morgan" /></Field>}
            <>{authMode !== "mfa" && <Field label="Email"><Input required type="email" value={authForm.email} onChange={(e: any) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@company.com" /></Field>}</>
            <>{(authMode === "login" || authMode === "register") && <Field label="Password"><Input required type="password" value={authForm.password} onChange={(e: any) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" /></Field>}</>
            {authMode === "register" && <><Field label="Invitation token (required after first admin)"><Input value={inviteToken} onChange={(e: any) => setInviteToken(e.target.value)} placeholder="Paste invite token from admin email/link" /></Field><p className="text-xs bg-emerald-50 text-emerald-800 p-3 rounded-lg">Invite-only: the first user becomes Admin. Everyone else needs an admin invitation (Team → Invite). Password min 8 chars.</p></>}
            {authMode === "mfa" && <Field label="Authenticator code (6-digit)"><Input value={mfaCode} onChange={(e: any) => setMfaCode(e.target.value)} placeholder="123456" /></Field>}
            {authMode === "reset" && <Field label="New password"><Input type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="New password (min 8)" /></Field>}
          </div>
          <button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl">{authMode === "register" ? "Create account" : authMode === "forgot" ? "Send reset link" : authMode === "reset" ? "Reset password" : authMode === "mfa" ? "Verify code" : "Sign in"}</button>{authMode === "login" && <p className="text-center text-sm mt-3"><button type="button" className="text-emerald-700 font-semibold" onClick={() => setAuthMode("forgot")}>Forgot password?</button></p>}
          <p className="text-center text-sm mt-4 text-slate-500">{authMode === "login" ? <>No account? <button type="button" className="text-emerald-700 font-semibold" onClick={() => setAuthMode("register")}>Register</button></> : <>Already have an account? <button type="button" className="text-emerald-700 font-semibold" onClick={() => setAuthMode("login")}>Login</button></>}</p>
        </form>
      </div>
    </div>
  );

  const navSections = [
    {
      category: "Core & Overview",
      items: [
        ["dashboard", "Dashboard", LayoutDashboard],
        ["calendar", "Calendar", Calendar],
        ["leads_inbox", "Web Leads", ArrowRight],
        ["contacts", "Contacts", Users],
        ["companies", "Companies", Building2],
      ] as const
    },
    {
      category: "Sales & Deals",
      items: [
        ["deals", "Deals", Handshake],
        ["pipeline", "Pipeline", KanbanSquare],
        ["quotations", "Quotations", FileText],
        ["contracts", "Contracts", FileText],
        ["products", "Products", Package],
      ] as const
    },
    {
      category: "Projects & Tasks",
      items: [
        ["projects", "Projects", KanbanSquare],
        ["gantt", "Gantt Timeline", Calendar],
        ["activities", "Activities", CheckSquare],
        ["workload", "Capacity Planning", Users],
      ] as const
    },
    {
      category: "Finance & Billing",
      items: [
        ["invoices", "Invoices", FileText],
        ["recurring", "Recurring", Calendar],
        ["payments", "Payments", DollarSign],
        ["purchase_orders", "Purchase Orders", ShoppingCart],
        ["expenses", "Expenses", FileText],
        ["ap_aging", "AP Aging", DollarSign],
        ["accounting_sync", "Accounting Sync", DollarSign],
        ["reconciliation", "Bank Reconciliation", ShieldCheck],
        ["vendors", "Vendors", Building2],
      ] as const
    },
    {
      category: "Tools & Management",
      items: [
        ["import_wizard", "CSV Importer", Upload],
        ["documents", "Documents", FileText],
        ["notifications", "Notifications", Calendar],
        ["reports", "Reports", BarChart3],
        ["workflows", "Workflows", Sliders],
        ["custom_fields", "Custom Fields", Layers],
        ["team", "Team", UserPlus],
        ["audit", "Audit Logs", Settings],
        ["settings", "Settings", Settings],
      ] as const
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-30">
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <Image src="/logo.png" alt="SAKK Group Logo" width={40} height={40} priority className="w-10 h-10 object-contain rounded-full shadow ring-1 ring-white/20 bg-slate-800" />
          <div>
            <p className="font-bold leading-tight text-white">SAKK Group</p>
            <p className="text-[11px] text-slate-400 mt-0.5">SAKK-CRM</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.category}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                {section.category}
              </p>
              <div className="space-y-0.5">
                {section.items.map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${view === key
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-300 hover:bg-white/10"
                      }`}
                  >
                    <Icon size={18} />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 grid place-items-center font-bold text-sm text-slate-950 shrink-0">
              {user.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email} • {user.role}</p>
            </div>
            <button onClick={logout} title="Logout" className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="SAKK Group Logo" width={36} height={36} className="w-9 h-9 object-contain rounded-full shadow ring-1 ring-white/20 bg-slate-800" />
                <div>
                  <p className="font-bold leading-tight text-white">SAKK Group</p>
                  <p className="text-[11px] text-emerald-400 font-medium">CRM Workspace</p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.category}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                    {section.category}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(([key, label, Icon]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setView(key);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${view === key
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-300 hover:bg-white/10"
                          }`}
                      >
                        <Icon size={18} />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 grid place-items-center font-bold text-sm text-slate-950 shrink-0">
                  {user.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email} • {user.role}</p>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition shrink-0"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b sticky top-0 z-40 px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="SAKK Group Logo" width={32} height={32} className="w-8 h-8 object-contain rounded-full shadow-xs ring-1 ring-slate-200 bg-slate-800" />
              <div>
                <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight block">SAKK Group</span>
                <span className="text-[11px] text-emerald-700 font-semibold capitalize md:hidden block leading-tight">{view.replace("_", " ")}</span>
              </div>
            </div>
            <h1 className="hidden md:block text-lg font-bold capitalize text-slate-900 ml-2">{view.replace("_", " ")}</h1>
          </div>

          <div className="flex items-center gap-2">

            <button onClick={logout} title="Logout" className="md:hidden p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-6 max-w-[1400px] w-full mx-auto flex-1 min-w-0">
          {view === "dashboard" && <Dashboard go={setView} notify={notify} />}
          {view === "calendar" && <CalendarView notify={notify} />}
          {view === "contacts" && <Contacts notify={notify} />}
          {view === "companies" && <Companies notify={notify} />}
          {view === "deals" && <Deals notify={notify} />}
          {view === "pipeline" && <Pipeline notify={notify} />}
          {view === "quotations" && <Quotations notify={notify} />}
          {view === "contracts" && <Contracts notify={notify} />}
          {view === "projects" && <Projects notify={notify} />}
          {view === "gantt" && <ProjectGantt notify={notify} />}
          {view === "activities" && <Activities notify={notify} />}
          {view === "products" && <Products notify={notify} />}
          {view === "invoices" && <Invoices notify={notify} />}
          {view === "recurring" && <Recurring notify={notify} />}
          {view === "payments" && <Payments notify={notify} />}
          {view === "purchase_orders" && <PurchaseOrders notify={notify} />}
          {view === "expenses" && <Expenses notify={notify} />}
          {view === "ap_aging" && <APAgingView notify={notify} />}
          {view === "accounting_sync" && <AccountingSyncHub notify={notify} />}
          {view === "reconciliation" && <BankReconciliationView notify={notify} />}
          {view === "vendors" && <Vendors notify={notify} />}
          {view === "leads_inbox" && <LeadCaptureInbox notify={notify} />}
          {view === "import_wizard" && <ImportWizard notify={notify} />}
          {view === "documents" && <Documents notify={notify} />}
          {view === "notifications" && <Notifications notify={notify} />}
          {view === "reports" && <Reports />}
          {view === "workload" && <WorkloadCapacityView notify={notify} />}
          {view === "workflows" && <WorkflowRulesBuilder notify={notify} />}
          {view === "custom_fields" && <CustomFieldsManager notify={notify} />}
          {view === "team" && <Team current={user} notify={notify} />}
          {view === "audit" && <AuditLogs notify={notify} />}
          {view === "settings" && <SettingsPage user={user} setUser={setUser} notify={notify} />}
        </main>
      </div>
      {toast && <div className="fixed bottom-6 right-6 z-[60] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium">{toast}</div>}
    </div>
  );
}

/* ---------- shared loaders ---------- */
function useLookups() {
  const [companies, setCompanies] = useState<Any[]>([]); const [contacts, setContacts] = useState<Any[]>([]); const [team, setTeam] = useState<Any[]>([]); const [products, setProducts] = useState<Any[]>([]); const [deals, setDeals] = useState<Any[]>([]);
  useEffect(() => { (async () => { try { const [c, ct, t, p, d] = await Promise.all([api("/api/companies?limit=100"), api("/api/contacts?limit=100"), api("/api/team"), api("/api/products"), api("/api/deals?limit=100")]); setCompanies(c.items); setContacts(ct.items); setTeam(t.items); setProducts(p.items); setDeals(d.items); } catch { } })(); }, []);
  return { companies, contacts, team, products, deals };
}

/* ---------- DASHBOARD ---------- */
function Dashboard({ go, notify }: { go: (v: string) => void, notify: (m: string) => void }) {
  const [d, setD] = useState<Any | null>(null); const [err, setErr] = useState("");
  const [settings, setSettings] = useState({
    showStopwatch: true,
    showProjects: true,
    showCharts: true,
    showPipeline: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sakk_dash_settings");
      if (saved) setSettings(JSON.parse(saved));
    } catch { }
  }, []);

  function toggleSetting(key: string) {
    setSettings((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("sakk_dash_settings", JSON.stringify(next)); } catch { }
      return next;
    });
  }

  useEffect(() => { api("/api/dashboard").then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <div className="bg-red-50 text-red-700 p-4 rounded-xl">{err}</div>;
  if (!d) return <p className="text-slate-500">Loading dashboard from API...</p>;
  const s = d.stats;
  const cards = [["Total Contacts", s.totalContacts, Users, "contacts"], ["Companies", s.totalCompanies, Building2, "companies"], ["Total Deals", s.totalDeals, Handshake, "deals"], ["Pipeline Value", fmtMoney(s.pipelineValue), TrendingUp, "pipeline"], ["Revenue Won", fmtMoney(s.revenue), DollarSign, "deals"], ["Paid Invoices", fmtMoney(s.paidInvoices), FileText, "invoices"], ["Win Rate", `${s.winRate}%`, BarChart3, "reports"], ["Overdue Tasks", s.overdueTasks, AlertCircle, "activities"]];
  const maxStage = Math.max(1, ...d.byStage.map((x: Any) => Number(x.v || 0)));
  return <div className="space-y-6">
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Business overview — live from PostgreSQL</h2>
        <p className="text-slate-300 text-xs sm:text-sm mt-1">All numbers below are calculated in real time from your CRM database. Create contacts, deals and invoices to see them update.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <DashboardPersonalizer settings={settings} onToggle={toggleSetting} />
        <button onClick={() => go("leads_inbox")} className="bg-sky-500 hover:bg-sky-600 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition text-white">+ Add Lead</button>
        <button onClick={() => go("contacts")} className="bg-emerald-500 hover:bg-emerald-600 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition">+ Add Contact</button>
        <button onClick={() => go("deals")} className="bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition">+ Add Deal</button>
      </div>
    </div>

    {settings.showProjects && <ExecutiveProjectWidget notify={notify} />}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(([label, val, Icon, target]: any) => (
        <button key={label} onClick={() => go(target)} className="bg-white rounded-xl border p-4 sm:p-5 text-left hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-slate-500 uppercase truncate">{label}</p>
            <Icon size={18} className="text-emerald-600 shrink-0 ml-2" />
          </div>
          <p className="text-xl sm:text-2xl font-black mt-2 truncate text-slate-900">{val}</p>
        </button>
      ))}
    </div>

    {settings.showCharts && (
      <AdvancedSVGCharts
        revenueByMonth={d?.revenueByMonth}
        dealsByStage={d?.byStage}
        funnelStages={d?.funnelStages}
        revenueGrowth={d?.revenueGrowth}
        totalRevenue={d?.stats?.paidInvoices || d?.stats?.revenue}
      />
    )}

    {settings.showPipeline && (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Pipeline by stage</h3>{d.byStage.length === 0 ? <p className="text-sm text-slate-400">No deals yet.</p> : d.byStage.map((x: Any) => <div key={x.stage} className="mb-3"><div className="flex justify-between text-sm"><span className="capitalize font-medium">{x.stage} ({x.c})</span><span className="font-semibold">{fmtMoney(x.v)}</span></div><div className="h-2 bg-slate-100 rounded mt-1"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${(Number(x.v || 0) / maxStage) * 100}%` }} /></div></div>)}</div>
        <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Upcoming activities</h3>{d.upcoming.length === 0 ? <p className="text-sm text-slate-400">No upcoming activities. Create one in Activities.</p> : d.upcoming.map((a: Any) => <div key={a.id} className="flex gap-3 py-2 border-b last:border-0"><CheckSquare size={16} className="text-emerald-600 mt-0.5" /><div><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-slate-500 capitalize">{a.type} • {fmtDate(a.dueDate)} • {a.priority}</p></div></div>)}</div>
        <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Contacts by status</h3>{d.byStatus.length === 0 ? <p className="text-sm text-slate-400">No contacts yet.</p> : d.byStatus.map((x: Any) => <div key={x.status} className="flex justify-between py-2 border-b last:border-0 text-sm"><Badge v={x.status} /><span className="font-bold">{x.c}</span></div>)}
          <h3 className="font-bold mt-6 mb-3">Recent contacts</h3>{d.recentContacts.map((c: Any) => <p key={c.id} className="text-sm py-1">{c.firstName} {c.lastName} <span className="text-slate-400">• {c.status}</span></p>)}</div>
      </div>
    )}

    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-3">Recent deals</h3>{d.recentDeals.length === 0 ? <Empty text="No deals yet — create your first deal to start tracking revenue." action="Go to Deals" onAction={() => go("deals")} /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Deal</th><th>Value</th><th>Stage</th><th>Close date</th></tr></thead><tbody>{d.recentDeals.map((x: Any) => <tr key={x.id} className="border-b last:border-0"><td className="py-2 font-medium">{x.title}</td><td>{fmtMoney(x.value, x.currency)}</td><td><Badge v={x.stage} /></td><td>{fmtDate(x.expectedCloseDate)}</td></tr>)}</tbody></table></div>}</div>

    {/* Task Stopwatch & Time Logger timer placed at the bottom after Recent deals */}
    {settings.showStopwatch && <TimeTrackerWidget notify={notify} />}
  </div>;
}

/* ---------- CONTACTS ---------- */
function Contacts({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [total, setTotal] = useState(0); const [modal, setModal] = useState<any>(null); const [saving, setSaving] = useState(false); const [historyContactId, setHistoryContactId] = useState<string | null>(null); const { companies, team } = useLookups();
  const load = useCallback(async () => { const d = await api(`/api/contacts?search=${encodeURIComponent(search)}&status=${status}&limit=100`); setItems(d.items); setTotal(d.total); }, [search, status]);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { if (!modal.firstName || !modal.lastName) return notify("First & last name required"); setSaving(true); try { if (modal.id) await api(`/api/contacts/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/contacts", { method: "POST", body: JSON.stringify(modal) }); notify(modal.id ? "Contact updated" : "Contact created"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function del(id: string) { if (!confirm("Delete this contact permanently?")) return; await api(`/api/contacts/${id}`, { method: "DELETE" }); notify("Contact deleted"); load(); }
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2 items-center"><div className="relative flex-1 min-w-[220px]"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone..." className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white text-sm" /></div>
      <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-xl px-3 py-2.5 bg-white text-sm"><option value="">All statuses</option><option>lead</option><option>prospect</option><option>customer</option><option>churned</option></select>
      <a href="/api/export?type=contacts" className="px-3 py-2.5 border bg-white rounded-xl text-sm font-medium flex gap-1 items-center"><Download size={15} /> Export CSV</a>
      <button onClick={() => setModal({ firstName: "", lastName: "", email: "", phone: "", title: "", status: "lead", source: "website", companyId: "", ownerId: "", tags: "", notes: "" })} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex gap-1 items-center"><Plus size={16} /> New Contact</button></div>
    <p className="text-xs text-slate-500">{total} contact(s) in database</p>
    {items.length === 0 ? <Empty text="No contacts found in database. Add your first real contact." action="Add Contact" onAction={() => setModal({ firstName: "", lastName: "", status: "lead", source: "website" })} /> : <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-sm min-w-[800px]"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Contact</th><th className="p-3">Company</th><th className="p-3">Contact info</th><th className="p-3">Status</th><th className="p-3">Owner</th><th className="p-3">Created</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{items.map(c => <tr key={c.id} className="border-t hover:bg-slate-50"><td className="p-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-bold text-xs">{c.firstName[0]}{c.lastName[0]}</div><div><p className="font-semibold">{c.firstName} {c.lastName}</p><p className="text-xs text-slate-500">{c.title || "—"}</p></div></div></td><td className="p-3">{c.companyName || "—"}</td><td className="p-3 text-slate-600"><p>{c.email || "—"}</p><p className="text-xs">{c.phone || ""}</p></td><td className="p-3"><Badge v={c.status} /></td><td className="p-3">{c.ownerName || "—"}</td><td className="p-3 text-slate-500">{fmtDate(c.createdAt)}</td><td className="p-3 text-right space-x-1"><button onClick={() => setHistoryContactId(c.id)} title="View 360° History" className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded"><History size={15} /></button><button onClick={() => setModal(c)} className="p-1.5 hover:bg-slate-100 rounded"><Pencil size={15} /></button><button onClick={() => del(c.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}
    {modal && <Modal title={modal.id ? "Edit Contact" : "New Contact"} onClose={() => setModal(null)} onSave={save} saving={saving}>
      <Field label="First name *"><Input value={modal.firstName || ""} onChange={(e: any) => setModal({ ...modal, firstName: e.target.value })} /></Field>
      <Field label="Last name *"><Input value={modal.lastName || ""} onChange={(e: any) => setModal({ ...modal, lastName: e.target.value })} /></Field>
      <Field label="Email"><Input type="email" value={modal.email || ""} onChange={(e: any) => setModal({ ...modal, email: e.target.value })} /></Field>
      <Field label="Phone"><Input value={modal.phone || ""} onChange={(e: any) => setModal({ ...modal, phone: e.target.value })} /></Field>
      <Field label="Job title"><Input value={modal.title || ""} onChange={(e: any) => setModal({ ...modal, title: e.target.value })} /></Field>
      <Field label="Company"><Select value={modal.companyId || ""} onChange={(e: any) => setModal({ ...modal, companyId: e.target.value })}><option value="">No company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Status"><Select value={modal.status} onChange={(e: any) => setModal({ ...modal, status: e.target.value })}><option>lead</option><option>prospect</option><option>customer</option><option>churned</option></Select></Field>
      <Field label="Source"><Select value={modal.source || "website"} onChange={(e: any) => setModal({ ...modal, source: e.target.value })}><option>website</option><option>referral</option><option>cold</option><option>social</option><option>event</option><option>other</option></Select></Field>
      <Field label="Owner"><Select value={modal.ownerId || ""} onChange={(e: any) => setModal({ ...modal, ownerId: e.target.value })}><option value="">Me (default)</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      <Field label="Tags (comma separated)"><Input value={modal.tags || ""} onChange={(e: any) => setModal({ ...modal, tags: e.target.value })} placeholder="vip, enterprise" /></Field>
      <Field label="City"><Input value={modal.city || ""} onChange={(e: any) => setModal({ ...modal, city: e.target.value })} /></Field>
      <Field label="Country"><Input value={modal.country || ""} onChange={(e: any) => setModal({ ...modal, country: e.target.value })} /></Field>
      <div className="sm:col-span-2"><Field label="Notes"><Textarea value={modal.notes || ""} onChange={(e: any) => setModal({ ...modal, notes: e.target.value })} /></Field></div>
    </Modal>}
    {historyContactId && <ClientHistoryModal contactId={historyContactId} onClose={() => setHistoryContactId(null)} />}
  </div>;
}

/* ---------- COMPANIES ---------- */
function Companies({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [modal, setModal] = useState<any>(null); const [saving, setSaving] = useState(false); const { team } = useLookups();
  const load = useCallback(async () => { const d = await api(`/api/companies?search=${encodeURIComponent(search)}&status=${status}&limit=100`); setItems(d.items); }, [search, status]);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { if (!modal.name) return notify("Company name required"); setSaving(true); try { if (modal.id) await api(`/api/companies/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/companies", { method: "POST", body: JSON.stringify(modal) }); notify("Company saved"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function del(id: string) { if (!confirm("Delete this company? Contacts will be unlinked.")) return; await api(`/api/companies/${id}`, { method: "DELETE" }); notify("Company deleted"); load(); }
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2"><div className="relative flex-1 min-w-[220px]"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white text-sm" /></div>
      <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-xl px-3 py-2.5 bg-white text-sm"><option value="">All statuses</option><option>prospect</option><option>active</option><option>partner</option><option>churned</option></select>
      <a href="/api/export?type=companies" className="px-3 py-2.5 border bg-white rounded-xl text-sm font-medium flex gap-1 items-center"><Download size={15} /> Export</a>
      <button onClick={() => setModal({ name: "", industry: "", website: "", email: "", phone: "", city: "", country: "", size: "11-50", status: "prospect", annualRevenue: "" })} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex gap-1"><Plus size={16} /> New Company</button></div>
    {items.length === 0 ? <Empty text="No companies in database yet." action="Add Company" onAction={() => setModal({ name: "", status: "prospect", size: "11-50" })} /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(c => <div key={c.id} className="bg-white rounded-xl border p-5 hover:shadow-md"><div className="flex justify-between"><div className="w-11 h-11 bg-slate-900 text-white rounded-xl grid place-items-center font-bold">{c.name.slice(0, 2).toUpperCase()}</div><Badge v={c.status} /></div><h3 className="font-bold mt-3">{c.name}</h3><p className="text-sm text-slate-500">{c.industry || "Industry not set"} • {c.size || ""} employees</p><div className="text-xs text-slate-500 mt-3 space-y-1">{c.email && <p className="flex gap-1"><Mail size={12} />{c.email}</p>}{c.phone && <p className="flex gap-1"><Phone size={12} />{c.phone}</p>}{(c.city || c.country) && <p className="flex gap-1"><MapPin size={12} />{c.city} {c.country}</p>}{c.website && <p className="flex gap-1"><Globe size={12} />{c.website}</p>}</div><div className="flex gap-4 mt-4 text-sm border-t pt-3"><span><b>{c.contactCount}</b> contacts</span><span><b>{c.dealCount}</b> deals</span>{c.annualRevenue && <span className="ml-auto font-semibold">{fmtMoney(c.annualRevenue)}/yr</span>}</div><div className="flex gap-2 mt-3"><button onClick={() => setModal(c)} className="flex-1 border rounded-lg py-1.5 text-sm font-medium flex items-center justify-center gap-1"><Pencil size={13} /> Edit</button><button onClick={() => del(c.id)} className="px-3 border border-red-200 text-red-600 rounded-lg"><Trash2 size={14} /></button></div></div>)}</div>}
    {modal && <Modal title={modal.id ? "Edit Company" : "New Company"} onClose={() => setModal(null)} onSave={save} saving={saving}>
      <Field label="Company name *"><Input value={modal.name || ""} onChange={(e: any) => setModal({ ...modal, name: e.target.value })} /></Field>
      <Field label="Industry"><Input value={modal.industry || ""} onChange={(e: any) => setModal({ ...modal, industry: e.target.value })} placeholder="SaaS, Healthcare..." /></Field>
      <Field label="Website"><Input value={modal.website || ""} onChange={(e: any) => setModal({ ...modal, website: e.target.value })} placeholder="https://" /></Field>
      <Field label="Email"><Input value={modal.email || ""} onChange={(e: any) => setModal({ ...modal, email: e.target.value })} /></Field>
      <Field label="Phone"><Input value={modal.phone || ""} onChange={(e: any) => setModal({ ...modal, phone: e.target.value })} /></Field>
      <Field label="Status"><Select value={modal.status} onChange={(e: any) => setModal({ ...modal, status: e.target.value })}><option>prospect</option><option>active</option><option>partner</option><option>churned</option></Select></Field>
      <Field label="Company size"><Select value={modal.size || "11-50"} onChange={(e: any) => setModal({ ...modal, size: e.target.value })}><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option></Select></Field>
      <Field label="Annual revenue (USD)"><Input type="number" value={modal.annualRevenue || ""} onChange={(e: any) => setModal({ ...modal, annualRevenue: e.target.value })} /></Field>
      <Field label="City"><Input value={modal.city || ""} onChange={(e: any) => setModal({ ...modal, city: e.target.value })} /></Field>
      <Field label="Country"><Input value={modal.country || ""} onChange={(e: any) => setModal({ ...modal, country: e.target.value })} /></Field>
      <Field label="Owner"><Select value={modal.ownerId || ""} onChange={(e: any) => setModal({ ...modal, ownerId: e.target.value })}><option value="">Me (default)</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      <Field label="Address"><Input value={modal.address || ""} onChange={(e: any) => setModal({ ...modal, address: e.target.value })} /></Field>
      <div className="sm:col-span-2"><Field label="Notes"><Textarea value={modal.notes || ""} onChange={(e: any) => setModal({ ...modal, notes: e.target.value })} /></Field></div>
    </Modal>}
  </div>;
}

/* ---------- DEALS ---------- */
function Deals({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]); const [search, setSearch] = useState(""); const [stage, setStage] = useState(""); const [modal, setModal] = useState<any>(null); const [saving, setSaving] = useState(false); const { contacts, companies, team } = useLookups();
  const load = useCallback(async () => { const d = await api(`/api/deals?search=${encodeURIComponent(search)}&stage=${stage}&limit=100`); setItems(d.items); }, [search, stage]);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { if (!modal.title) return notify("Deal title required"); setSaving(true); try { if (modal.id) await api(`/api/deals/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/deals", { method: "POST", body: JSON.stringify(modal) }); notify("Deal saved"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function del(id: string) { if (!confirm("Delete this deal?")) return; await api(`/api/deals/${id}`, { method: "DELETE" }); notify("Deal deleted"); load(); }
  const totalVal = items.reduce((a, b) => a + Number(b.value || 0), 0);
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2 items-center"><div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals..." className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white text-sm" /></div>
      <select value={stage} onChange={e => setStage(e.target.value)} className="border rounded-xl px-3 py-2.5 bg-white text-sm"><option value="">All stages</option>{STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
      <span className="bg-white border rounded-xl px-3 py-2.5 text-sm font-semibold">Total: {fmtMoney(totalVal)}</span>
      <a href="/api/export?type=deals" className="px-3 py-2.5 border bg-white rounded-xl text-sm font-medium flex gap-1 items-center"><Download size={15} /> Export</a>
      <button onClick={() => setModal({ title: "", value: "", stage: "lead", currency: "USD", expectedCloseDate: "", contactId: "", companyId: "", description: "" })} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex gap-1"><Plus size={16} /> New Deal</button></div>
    {items.length === 0 ? <Empty text="No deals in database yet." action="Create Deal" onAction={() => setModal({ title: "", value: "", stage: "lead", currency: "USD" })} /> : <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-sm min-w-[850px]"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Deal</th><th className="p-3">Value</th><th className="p-3">Stage</th><th className="p-3">Probability</th><th className="p-3">Contact / Company</th><th className="p-3">Close date</th><th className="p-3">Owner</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{items.map(d => <tr key={d.id} className="border-t hover:bg-slate-50"><td className="p-3 font-semibold">{d.title}</td><td className="p-3 font-bold text-emerald-700">{fmtMoney(d.value, d.currency)}</td><td className="p-3"><Badge v={d.stage} /></td><td className="p-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-100 rounded"><div className="h-full bg-emerald-500 rounded" style={{ width: `${d.probability}%` }} /></div>{d.probability}%</div></td><td className="p-3 text-slate-600">{d.contactName || "—"}<p className="text-xs">{d.companyName || ""}</p></td><td className="p-3">{fmtDate(d.expectedCloseDate)}</td><td className="p-3">{d.ownerName || "—"}</td><td className="p-3 text-right"><button onClick={() => setModal(d)} className="p-1.5 hover:bg-slate-100 rounded"><Pencil size={15} /></button><button onClick={() => del(d.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}
    {modal && <Modal title={modal.id ? "Edit Deal" : "New Deal"} onClose={() => setModal(null)} onSave={save} saving={saving}>
      <Field label="Deal title *"><Input value={modal.title || ""} onChange={(e: any) => setModal({ ...modal, title: e.target.value })} placeholder="Enterprise licence — Acme" /></Field>
      <Field label="Value"><Input type="number" value={modal.value || ""} onChange={(e: any) => setModal({ ...modal, value: e.target.value })} /></Field>
      <Field label="Stage"><Select value={modal.stage} onChange={(e: any) => setModal({ ...modal, stage: e.target.value })}>{STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</Select></Field>
      <Field label="Currency"><Select value={modal.currency || "USD"} onChange={(e: any) => setModal({ ...modal, currency: e.target.value })}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>AED</option></Select></Field>
      <Field label="Contact"><Select value={modal.contactId || ""} onChange={(e: any) => setModal({ ...modal, contactId: e.target.value })}><option value="">Select contact</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</Select></Field>
      <Field label="Company"><Select value={modal.companyId || ""} onChange={(e: any) => setModal({ ...modal, companyId: e.target.value })}><option value="">Select company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Expected close date"><Input type="date" value={modal.expectedCloseDate || ""} onChange={(e: any) => setModal({ ...modal, expectedCloseDate: e.target.value })} /></Field>
      <Field label="Owner"><Select value={modal.ownerId || ""} onChange={(e: any) => setModal({ ...modal, ownerId: e.target.value })}><option value="">Me (default)</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      {modal.stage === "lost" && <Field label="Lost reason"><Input value={modal.lostReason || ""} onChange={(e: any) => setModal({ ...modal, lostReason: e.target.value })} /></Field>}
      <div className="sm:col-span-2"><Field label="Description"><Textarea value={modal.description || ""} onChange={(e: any) => setModal({ ...modal, description: e.target.value })} /></Field></div>
    </Modal>}
  </div>;
}

/* ---------- PIPELINE KANBAN ---------- */
function Pipeline({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { contacts, companies, team } = useLookups();
  const load = useCallback(async () => { const d = await api("/api/deals?limit=200"); setItems(d.items); }, []);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function move(id: string, stage: string) { try { await api(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) }); notify(`Moved to ${STAGE_LABEL[stage]}`); load(); } catch (e: any) { notify(e.message); } }
  async function saveDeal() {
    if (!modal.title) return notify("Deal title required");
    setSaving(true);
    try {
      await api("/api/deals", { method: "POST", body: JSON.stringify(modal) });
      notify("Deal added to pipeline!");
      setModal(null);
      load();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setSaving(false);
    }
  }
  return <div>
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Visual Sales Pipeline Kanban</h2>
        <p className="text-xs text-slate-500">Drag or move deals across lifecycle stages from lead to closed-won.</p>
      </div>
      <button
        onClick={() => setModal({ title: "", value: "", stage: "lead", currency: "USD", expectedCloseDate: "", contactId: "", companyId: "", description: "" })}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
      >
        <Plus size={16} /> New Deal
      </button>
    </div>
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x">{STAGES.map(stage => { const col = items.filter(d => d.stage === stage); const sum = col.reduce((a, b) => a + Number(b.value || 0), 0); return <div key={stage} className="min-w-[260px] sm:min-w-[270px] w-[260px] sm:w-[270px] bg-slate-200/60 rounded-2xl p-3 shrink-0 snap-start"><div className="flex justify-between items-center px-1 pb-3"><h3 className="font-bold text-sm">{STAGE_LABEL[stage]} <span className="text-slate-500">({col.length})</span></h3><div className="flex items-center gap-1.5"><span className="text-xs font-bold text-emerald-700">{fmtMoney(sum)}</span><button onClick={() => setModal({ title: "", value: "", stage, currency: "USD", expectedCloseDate: "", contactId: "", companyId: "", description: "" })} title={`Add deal to ${STAGE_LABEL[stage]}`} className="w-5 h-5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition">+</button></div></div><div className="space-y-3">{col.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No deals</p>}{col.map(d => <div key={d.id} className="bg-white rounded-xl border p-4 shadow-sm"><p className="font-semibold text-sm">{d.title}</p><p className="text-xs text-slate-500 mt-1">{d.companyName || d.contactName || "No company"}</p><p className="font-bold text-emerald-700 mt-2">{fmtMoney(d.value, d.currency)}</p><p className="text-[11px] text-slate-400">{d.probability}% • {fmtDate(d.expectedCloseDate)}</p><div className="flex gap-1 mt-3">{STAGES.filter(s => s !== stage).slice(0, 3).map(s => <button key={s} onClick={() => move(d.id, s)} className="text-[10px] px-2 py-1 bg-slate-100 rounded-full font-medium">→ {STAGE_LABEL[s]}</button>)}</div><select value={stage} onChange={e => move(d.id, e.target.value)} className="w-full mt-2 border rounded-lg text-xs py-1.5 px-2"><option value={stage}>Move to...</option>{STAGES.filter(s => s !== stage).map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></div>)}</div></div>; })}</div>
    <p className="text-xs text-slate-500 mt-2">Tip: Use the dropdown on any card to move it — the stage &amp; probability update instantly in Database via PATCH /api/deals/:id</p>
    {modal && (
      <Modal title="New Deal" onClose={() => setModal(null)} onSave={saveDeal} saving={saving}>
        <Field label="Deal title *"><Input value={modal.title || ""} onChange={(e: any) => setModal({ ...modal, title: e.target.value })} placeholder="e.g. Enterprise License" /></Field>
        <Field label="Value"><Input type="number" value={modal.value || ""} onChange={(e: any) => setModal({ ...modal, value: e.target.value })} /></Field>
        <Field label="Stage"><Select value={modal.stage} onChange={(e: any) => setModal({ ...modal, stage: e.target.value })}>{STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</Select></Field>
        <Field label="Currency"><Select value={modal.currency || "USD"} onChange={(e: any) => setModal({ ...modal, currency: e.target.value })}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option></Select></Field>
        <Field label="Contact"><Select value={modal.contactId || ""} onChange={(e: any) => setModal({ ...modal, contactId: e.target.value })}><option value="">Select contact</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</Select></Field>
        <Field label="Company"><Select value={modal.companyId || ""} onChange={(e: any) => setModal({ ...modal, companyId: e.target.value })}><option value="">Select company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Expected close date"><Input type="date" value={modal.expectedCloseDate || ""} onChange={(e: any) => setModal({ ...modal, expectedCloseDate: e.target.value })} /></Field>
        <Field label="Owner"><Select value={modal.ownerId || ""} onChange={(e: any) => setModal({ ...modal, ownerId: e.target.value })}><option value="">Me (default)</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        <div className="sm:col-span-2"><Field label="Description"><Textarea value={modal.description || ""} onChange={(e: any) => setModal({ ...modal, description: e.target.value })} /></Field></div>
      </Modal>
    )}
  </div>;
}

/* ---------- ACTIVITIES ---------- */
function Activities({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]); const [type, setType] = useState(""); const [filter, setFilter] = useState(""); const [modal, setModal] = useState<any>(null); const [saving, setSaving] = useState(false); const { contacts, companies, deals, team } = useLookups();
  const load = useCallback(async () => { const d = await api(`/api/activities?type=${type}&completed=${filter}&limit=100`); setItems(d.items); }, [type, filter]);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { if (!modal.title) return notify("Title required"); setSaving(true); try { if (modal.id) await api(`/api/activities/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/activities", { method: "POST", body: JSON.stringify(modal) }); notify("Activity saved"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function toggle(a: Any) { await api(`/api/activities/${a.id}`, { method: "PATCH", body: JSON.stringify({ completed: !a.completed }) }); load(); }
  async function del(id: string) { if (!confirm("Delete this activity?")) return; await api(`/api/activities/${id}`, { method: "DELETE" }); notify("Deleted"); load(); }
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2"><select value={type} onChange={e => setType(e.target.value)} className="border rounded-xl px-3 py-2.5 bg-white text-sm"><option value="">All types</option><option>call</option><option>email</option><option>meeting</option><option>task</option><option>note</option></select>
      <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-xl px-3 py-2.5 bg-white text-sm"><option value="">All</option><option value="false">Pending</option><option value="true">Completed</option></select>
      <button onClick={() => setModal({ type: "task", title: "", description: "", dueDate: "", priority: "medium", contactId: "", companyId: "", dealId: "", assignedTo: "" })} className="ml-auto bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex gap-1"><Plus size={16} /> New Activity</button></div>
    {items.length === 0 ? <Empty text="No activities found. Log a call, meeting or task." action="Add Activity" onAction={() => setModal({ type: "task", title: "", priority: "medium" })} /> : <div className="space-y-3">{items.map(a => <div key={a.id} className={`bg-white rounded-xl border p-4 flex gap-3 ${a.completed ? "opacity-60" : ""}`}><input type="checkbox" checked={a.completed} onChange={() => toggle(a)} className="w-5 h-5 accent-emerald-600 mt-0.5" /><div className="flex-1"><div className="flex flex-wrap gap-2 items-center"><p className={`font-semibold text-sm ${a.completed ? "line-through" : ""}`}>{a.title}</p><Badge v={a.type} /><span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${a.priority === "urgent" || a.priority === "high" ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>{a.priority}</span>{a.dueDate && new Date(a.dueDate) < new Date() && !a.completed && <span className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full">Overdue</span>}</div><p className="text-sm text-slate-500 mt-1">{a.description || ""}</p><p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3"><span className="flex gap-1"><Calendar size={12} />{a.dueDate ? fmtDate(a.dueDate) : "No due date"}</span>{a.contactName && <span>Contact: {a.contactName}</span>}{a.companyName && <span>{a.companyName}</span>}{a.dealTitle && <span>Deal: {a.dealTitle}</span>}{a.assigneeName && <span>Assigned: {a.assigneeName}</span>}</p></div><button onClick={() => setModal({ ...a, dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "" })} className="p-1.5 hover:bg-slate-100 rounded h-fit"><Pencil size={15} /></button><button onClick={() => del(a.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded h-fit"><Trash2 size={15} /></button></div>)}</div>}
    {modal && <Modal title={modal.id ? "Edit Activity" : "New Activity"} onClose={() => setModal(null)} onSave={save} saving={saving}>
      <Field label="Type"><Select value={modal.type} onChange={(e: any) => setModal({ ...modal, type: e.target.value })}><option>task</option><option>call</option><option>email</option><option>meeting</option><option>note</option></Select></Field>
      <Field label="Priority"><Select value={modal.priority} onChange={(e: any) => setModal({ ...modal, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>urgent</option></Select></Field>
      <div className="sm:col-span-2"><Field label="Title *"><Input value={modal.title || ""} onChange={(e: any) => setModal({ ...modal, title: e.target.value })} placeholder="Call with John about proposal" /></Field></div>
      <Field label="Due date"><Input type="datetime-local" value={modal.dueDate || ""} onChange={(e: any) => setModal({ ...modal, dueDate: e.target.value })} /></Field>
      <Field label="Assigned to"><Select value={modal.assignedTo || ""} onChange={(e: any) => setModal({ ...modal, assignedTo: e.target.value })}><option value="">Me (default)</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      <Field label="Contact"><Select value={modal.contactId || ""} onChange={(e: any) => setModal({ ...modal, contactId: e.target.value })}><option value="">None</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</Select></Field>
      <Field label="Company"><Select value={modal.companyId || ""} onChange={(e: any) => setModal({ ...modal, companyId: e.target.value })}><option value="">None</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Deal"><Select value={modal.dealId || ""} onChange={(e: any) => setModal({ ...modal, dealId: e.target.value })}><option value="">None</option>{deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</Select></Field>
      <div className="sm:col-span-2"><Field label="Description / notes"><Textarea value={modal.description || ""} onChange={(e: any) => setModal({ ...modal, description: e.target.value })} /></Field></div>
    </Modal>}
  </div>;
}

/* ---------- PRODUCTS ---------- */
function Products({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]); const [search, setSearch] = useState(""); const [modal, setModal] = useState<any>(null); const [saving, setSaving] = useState(false); const [tierProduct, setTierProduct] = useState<Any | null>(null);
  const load = useCallback(async () => { const d = await api(`/api/products?search=${encodeURIComponent(search)}`); setItems(d.items); }, [search]);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { if (!modal.name) return notify("Name required"); setSaving(true); try { if (modal.id) await api(`/api/products/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/products", { method: "POST", body: JSON.stringify(modal) }); notify("Product saved"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function del(id: string) { if (!confirm("Delete product?")) return; await api(`/api/products/${id}`, { method: "DELETE" }); notify("Deleted"); load(); }
  return <div className="space-y-4"><div className="flex gap-2"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, SKU, category..." className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white text-sm" /></div><button onClick={() => setModal({ name: "", sku: "", category: "", price: "", currency: "USD", description: "", isActive: true })} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex gap-1"><Plus size={16} /> New Product</button></div>
    {items.length === 0 ? <Empty text="No products in catalogue yet." action="Add Product" onAction={() => setModal({ name: "", price: "", currency: "USD", isActive: true })} /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(p => <div key={p.id} className="bg-white rounded-xl border p-5"><div className="flex justify-between"><span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{p.sku || "NO-SKU"}</span><span className={`text-xs font-semibold ${p.isActive ? "text-emerald-600" : "text-red-500"}`}>{p.isActive ? "Active" : "Inactive"}</span></div><h3 className="font-bold mt-3">{p.name}</h3><p className="text-sm text-slate-500">{p.category || ""}</p><p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.description || ""}</p><p className="text-xl font-black text-emerald-700 mt-3">{fmtMoney(p.price, p.currency)}</p><div className="flex gap-2 mt-4"><button onClick={() => setTierProduct(p)} className="flex-1 bg-slate-900 text-white rounded-lg py-1.5 text-xs font-semibold">Tiers</button><button onClick={() => setModal(p)} className="flex-1 border rounded-lg py-1.5 text-sm font-medium">Edit</button><button onClick={() => del(p.id)} className="px-3 border border-red-200 text-red-600 rounded-lg"><Trash2 size={14} /></button></div></div>)}</div>}
    {modal && <Modal title={modal.id ? "Edit Product" : "New Product"} onClose={() => setModal(null)} onSave={save} saving={saving}><Field label="Name *"><Input value={modal.name || ""} onChange={(e: any) => setModal({ ...modal, name: e.target.value })} /></Field><Field label="SKU"><Input value={modal.sku || ""} onChange={(e: any) => setModal({ ...modal, sku: e.target.value })} /></Field><Field label="Category"><Input value={modal.category || ""} onChange={(e: any) => setModal({ ...modal, category: e.target.value })} /></Field><Field label="Price"><Input type="number" value={modal.price || ""} onChange={(e: any) => setModal({ ...modal, price: e.target.value })} /></Field><Field label="Currency"><Select value={modal.currency || "USD"} onChange={(e: any) => setModal({ ...modal, currency: e.target.value })}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option></Select></Field><Field label="Active"><Select value={String(modal.isActive)} onChange={(e: any) => setModal({ ...modal, isActive: e.target.value === "true" })}><option value="true">Active</option><option value="false">Inactive</option></Select></Field><div className="sm:col-span-2"><Field label="Description"><Textarea value={modal.description || ""} onChange={(e: any) => setModal({ ...modal, description: e.target.value })} /></Field></div></Modal>}
    {tierProduct && <ProductTieredPricingModal productId={tierProduct.id} productName={tierProduct.name} basePrice={tierProduct.price} onClose={() => setTierProduct(null)} notify={notify} />}
  </div>;
}

/* ---------- INVOICES ---------- */
function Invoices({ notify }: { notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]);
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<any>(null);
  const [nextNum, setNextNum] = useState("SAKK-INV-26-001");
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { contacts, companies, deals, products } = useLookups();
  const load = useCallback(async () => {
    const d = await api(`/api/invoices?status=${status}`);
    setItems(d.items);
    if (d.nextInvoiceNumber) setNextNum(d.nextInvoiceNumber);
  }, [status]);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { if (!modal.title) return notify("Title required"); setSaving(true); try { if (modal.id) await api(`/api/invoices/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/invoices", { method: "POST", body: JSON.stringify(modal) }); notify("Invoice saved"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function del(id: string) { if (!confirm("Delete invoice?")) return; await api(`/api/invoices/${id}`, { method: "DELETE" }); notify("Deleted"); load(); }
  async function quickStatus(inv: Any, st: string) { await api(`/api/invoices/${inv.id}`, { method: "PUT", body: JSON.stringify({ ...inv, status: st }) }); notify(`Invoice ${st}`); load(); }
  const totalDue = items.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((a, b) => a + Number(b.total || 0), 0); const totalPaid = items.filter(i => i.status === "paid").reduce((a, b) => a + Number(b.total || 0), 0);
  return <div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"><div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 font-semibold uppercase">Outstanding</p><p className="text-xl font-black text-amber-600 mt-1">{fmtMoney(totalDue)}</p></div><div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 font-semibold uppercase">Paid</p><p className="text-xl font-black text-emerald-600 mt-1">{fmtMoney(totalPaid)}</p></div><div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 font-semibold uppercase">Total Invoices</p><p className="text-xl font-black text-slate-900 mt-1">{items.length}</p></div></div>
    <div className="flex gap-2 flex-wrap"><select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-xl px-3 py-2.5 bg-white text-sm"><option value="">All statuses</option><option>draft</option><option>sent</option><option>paid</option><option>overdue</option><option>cancelled</option></select><a href="/api/export?type=invoices" className="px-3 py-2.5 border bg-white rounded-xl text-sm font-medium flex gap-1 items-center"><Download size={15} /> Export CSV</a><button onClick={() => setModal({ invoiceNumber: nextNum, title: "", amount: "", quantity: 1, taxRate: 18, status: "draft", currency: "USD", contactId: "", companyId: "", dealId: "", productId: "", dueDate: "" })} className="ml-auto bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex gap-1"><Plus size={16} /> New Invoice</button></div>
    {items.length === 0 ? <Empty text="No invoices yet. Create one linked to a deal, contact or product." action="Create Invoice" onAction={() => setModal({ invoiceNumber: nextNum, title: "", amount: "", quantity: 1, taxRate: 18, status: "draft", currency: "USD" })} /> : <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-sm min-w-[800px]"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Amount</th><th className="p-3">Total (incl tax)</th><th className="p-3">Status</th><th className="p-3">Due</th><th className="p-3">Quick action</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{items.map(inv => <tr key={inv.id} className="border-t"><td className="p-3"><p className="font-semibold">{inv.title}</p><p className="text-xs text-slate-500 font-mono font-bold text-amber-700">{inv.invoiceNumber}</p></td><td className="p-3">{inv.contactName || inv.companyName || "—"}</td><td className="p-3">{fmtMoney(inv.amount, inv.currency)} × {inv.quantity}</td><td className="p-3 font-bold">{fmtMoney(inv.total, inv.currency)}</td><td className="p-3"><Badge v={inv.derivedStatus || inv.status} /><p className="text-[11px] text-slate-500 mt-1">Paid {fmtMoney(inv.paidAmount || 0)} • Due {fmtMoney(inv.outstanding || 0)}</p></td><td className="p-3">{fmtDate(inv.dueDate)}</td><td className="p-3 flex gap-1">{inv.status !== "paid" && <button onClick={() => quickStatus(inv, "paid")} className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Mark Paid</button>}{inv.status === "draft" && <button onClick={() => quickStatus(inv, "sent")} className="text-[11px] bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-semibold">Send</button>}<button onClick={() => setPreviewInvoice(inv)} className="text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-900 px-2 py-1 rounded-full font-semibold">Preview</button><a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-slate-900 text-white px-2 py-1 rounded-full font-semibold">PDF</a><button onClick={async () => { try { const r = await api(`/api/invoices/${inv.id}/send`, { method: "POST", body: JSON.stringify({}) }); notify(r.message || `Email ${r.emailStatus}`); load(); } catch (e: any) { notify(e.message) } }} className="text-[11px] bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-semibold">Email</button></td><td className="p-3 text-right"><button onClick={() => setModal({ ...inv, amount: inv.amount })} className="p-1.5 hover:bg-slate-100 rounded"><Pencil size={15} /></button><button onClick={() => del(inv.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}
    {modal && <Modal title={modal.id ? "Edit Invoice" : "New Invoice"} onClose={() => setModal(null)} onSave={save} saving={saving}><Field label="Invoice Number *"><Input value={modal.invoiceNumber || nextNum} onChange={(e: any) => setModal({ ...modal, invoiceNumber: e.target.value })} placeholder="SAKK-INV-26-001" /></Field><Field label="Title *"><Input value={modal.title || ""} onChange={(e: any) => setModal({ ...modal, title: e.target.value })} placeholder="Consulting — March" /></Field><Field label="Status"><Select value={modal.status} onChange={(e: any) => setModal({ ...modal, status: e.target.value })}><option>draft</option><option>sent</option><option>paid</option><option>overdue</option><option>cancelled</option></Select></Field><Field label="Amount"><Input type="number" value={modal.amount || ""} onChange={(e: any) => setModal({ ...modal, amount: e.target.value })} /></Field><Field label="Quantity"><Input type="number" value={modal.quantity || 1} onChange={(e: any) => setModal({ ...modal, quantity: e.target.value })} /></Field><Field label="Tax %"><Input type="number" value={modal.taxRate ?? 18} onChange={(e: any) => setModal({ ...modal, taxRate: e.target.value })} /></Field><Field label="Currency"><Select value={modal.currency || "USD"} onChange={(e: any) => setModal({ ...modal, currency: e.target.value })}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option></Select></Field><Field label="Contact"><Select value={modal.contactId || ""} onChange={(e: any) => setModal({ ...modal, contactId: e.target.value })}><option value="">None</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</Select></Field><Field label="Company"><Select value={modal.companyId || ""} onChange={(e: any) => setModal({ ...modal, companyId: e.target.value })}><option value="">None</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field><Field label="Product"><Select value={modal.productId || ""} onChange={(e: any) => { const p = products.find(x => x.id === e.target.value); setModal({ ...modal, productId: e.target.value, amount: p ? p.price : modal.amount, title: modal.title || p?.name || "" }); }}><option value="">None</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} — {fmtMoney(p.price)}</option>)}</Select></Field><Field label="Deal"><Select value={modal.dealId || ""} onChange={(e: any) => setModal({ ...modal, dealId: e.target.value })}><option value="">None</option>{deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</Select></Field><Field label="Issued date"><Input type="date" value={modal.issuedDate || ""} onChange={(e: any) => setModal({ ...modal, issuedDate: e.target.value })} /></Field><Field label="Due date"><Input type="date" value={modal.dueDate || ""} onChange={(e: any) => setModal({ ...modal, dueDate: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Notes"><Textarea value={modal.notes || ""} onChange={(e: any) => setModal({ ...modal, notes: e.target.value })} /></Field></div></Modal>}
    {previewInvoice && <SakkInvoiceModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />}
  </div>;
}

/* ---------- REPORTS ---------- */
function Reports() {
  const [r, setR] = useState<Any | null>(null);
  useEffect(() => { api("/api/reports").then(setR).catch(() => { }); }, []);
  if (!r) return <p className="text-slate-500">Loading reports from database...</p>;
  const maxDeal = Math.max(1, ...r.dealsByStage.map((x: Any) => Number(x.v || 0)));
  return <div className="space-y-6"><div className="grid md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Deals by stage (value)</h3>{r.dealsByStage.length === 0 ? <p className="text-sm text-slate-400">No data</p> : r.dealsByStage.map((x: Any) => <div key={x.stage} className="mb-3"><div className="flex justify-between text-sm"><span className="capitalize">{x.stage} ({x.c})</span><b>{fmtMoney(x.v)}</b></div><div className="h-2.5 bg-slate-100 rounded mt-1"><div className="h-full bg-emerald-500 rounded" style={{ width: `${Number(x.v || 0) / maxDeal * 100}%` }} /></div></div>)}</div>
    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Invoices by status</h3>{r.invoicesByStatus.map((x: Any) => <div key={x.status} className="flex justify-between py-2 border-b text-sm"><Badge v={x.status} /><span>{x.c} • <b>{fmtMoney(x.v)}</b></span></div>)}{r.invoicesByStatus.length === 0 && <p className="text-sm text-slate-400">No invoices</p>}</div>
    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Contacts by source</h3>{r.contactsBySource.map((x: Any) => <div key={String(x.source)} className="flex justify-between py-2 border-b text-sm"><span className="capitalize">{x.source || "unknown"}</span><b>{x.c}</b></div>)}</div>
    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Activities by type</h3>{r.activityByType.map((x: Any) => <div key={x.type} className="flex justify-between py-2 border-b text-sm"><span className="capitalize">{x.type}</span><b>{x.c}</b></div>)}</div>
  </div>
    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Top companies by deal value</h3>{r.topCompanies.length === 0 ? <p className="text-sm text-slate-400">No companies</p> : <table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Company</th><th>Deals</th><th>Value</th></tr></thead><tbody>{r.topCompanies.map((c: Any, i: number) => <tr key={i} className="border-b"><td className="py-2 font-medium">{c.name}</td><td>{c.deals}</td><td className="font-bold">{fmtMoney(c.value)}</td></tr>)}</tbody></table>}</div>
    <div className="bg-white rounded-xl border p-5"><h3 className="font-bold mb-4">Won revenue by month</h3>{r.revenueByMonth.length === 0 ? <p className="text-sm text-slate-400">No won deals yet — mark deals as Won to see revenue here.</p> : r.revenueByMonth.map((x: Any) => <div key={x.month} className="flex justify-between py-2 border-b text-sm"><span>{x.month}</span><span>{x.deals} deals • <b>{fmtMoney(x.revenue)}</b></span></div>)}</div>
    <div className="flex gap-2 flex-wrap">{["contacts", "companies", "deals", "invoices"].map(t => <a key={t} href={`/api/export?type=${t}`} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium flex gap-1 items-center capitalize"><Download size={14} /> Export {t} CSV</a>)}</div>
  </div>;
}

/* ---------- TEAM ---------- */
function Team({ current, notify }: { current: Any, notify: (m: string) => void }) {
  const [items, setItems] = useState<Any[]>([]); const [modal, setModal] = useState<any>(null); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { const d = await api("/api/team"); setItems(d.items); }, []);
  useEffect(() => { load().catch(e => notify(e.message)); }, [load, notify]);
  async function save() { setSaving(true); try { if (modal.id) await api(`/api/team/${modal.id}`, { method: "PUT", body: JSON.stringify(modal) }); else await api("/api/team", { method: "POST", body: JSON.stringify(modal) }); notify("Team member saved"); setModal(null); load(); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function del(id: string) { if (!confirm("Remove this team member?")) return; try { await api(`/api/team/${id}`, { method: "DELETE" }); notify("Removed"); load(); } catch (e: any) { notify(e.message); } }
  return <div className="space-y-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <p className="text-sm text-slate-500">{items.length} team member(s) — all can login and use the CRM</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={async () => { const email = prompt("Invite email?"); if (!email) return; const role = prompt("Role? admin/manager/finance/sales/support", "sales") || "sales"; try { const r = await api("/api/invitations", { method: "POST", body: JSON.stringify({ email, role }) }); await navigator.clipboard.writeText(r.inviteLink).catch(() => { }); notify(`Invitation created for ${email} — link copied (also queued in Email Outbox)`); } catch (e: any) { notify(e.message); } }} className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex gap-1 items-center min-h-[38px]"><Mail size={15} /> Invite Member</button>
        <button onClick={() => setModal({ name: "", email: "", password: "", role: "sales", phone: "" })} className="bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex gap-1 items-center min-h-[38px]"><UserPlus size={16} /> Add Member</button>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">{items.map(m => <div key={m.id} className="bg-white rounded-xl border p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-slate-900 text-white grid place-items-center font-bold shrink-0">{m.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-bold truncate">{m.name} {m.id === current.id && <span className="text-xs text-emerald-600 font-semibold">(You)</span>}</p><p className="text-xs text-slate-500 truncate">{m.email}</p></div></div><div className="flex gap-2 mt-3 items-center flex-wrap"><Badge v={m.role} /><span className={`text-xs font-semibold ${m.isActive ? "text-emerald-600" : "text-red-500"}`}>{m.isActive ? "Active" : "Inactive"}</span><span className="text-[11px] text-slate-400 ml-auto">Joined {fmtDate(m.createdAt)}</span></div><div className="flex gap-2 mt-4"><button onClick={() => setModal(m)} className="flex-1 border rounded-lg py-1.5 text-xs sm:text-sm font-medium hover:bg-slate-50">Edit</button>{m.id !== current.id && <button onClick={() => del(m.id)} className="px-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>}</div></div>)}</div>
    {modal && <Modal title={modal.id ? "Edit Member" : "Add Team Member"} onClose={() => setModal(null)} onSave={save} saving={saving}><Field label="Name *"><Input value={modal.name || ""} onChange={(e: any) => setModal({ ...modal, name: e.target.value })} /></Field><Field label="Email *"><Input disabled={!!modal.id} value={modal.email || ""} onChange={(e: any) => setModal({ ...modal, email: e.target.value })} /></Field>{!modal.id && <Field label="Password *"><Input type="password" value={modal.password || ""} onChange={(e: any) => setModal({ ...modal, password: e.target.value })} /></Field>}<Field label="Role"><Select value={modal.role} onChange={(e: any) => setModal({ ...modal, role: e.target.value })}><option>admin</option><option>manager</option><option>finance</option><option>sales</option><option>support</option></Select></Field><Field label="Phone"><Input value={modal.phone || ""} onChange={(e: any) => setModal({ ...modal, phone: e.target.value })} /></Field>{modal.id && <Field label="Status"><Select value={String(modal.isActive)} onChange={(e: any) => setModal({ ...modal, isActive: e.target.value === "true" })}><option value="true">Active</option><option value="false">Inactive</option></Select></Field>}</Modal>}
  </div>;
}

/* ---------- SETTINGS ---------- */
function SettingsPage({ user, setUser, notify }: { user: Any, setUser: (u: Any) => void, notify: (m: string) => void }) {
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", role: user.role }); const [saving, setSaving] = useState(false);
  const [kv, setKv] = useState<Any>({}); const [outbox, setOutbox] = useState<Any[]>([]); const [gateway, setGateway] = useState<any>(null);
  const [mfa, setMfa] = useState<any>(null); const [mfaCode, setMfaCode] = useState(""); const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  useEffect(() => { (async () => { try { setKv(await api("/api/settings")); const o = await api("/api/email/outbox"); setOutbox(o.items); } catch { } try { setGateway(await api("/api/payments/gateway/status")); } catch { } })(); }, []);
  async function save() { setSaving(true); try { const u = await api("/api/auth/me", { method: "PUT", body: JSON.stringify(form) }); setUser(u); notify("Profile updated in database"); } catch (e: any) { notify(e.message); } finally { setSaving(false); } }
  async function saveKv() { try { await api("/api/settings", { method: "PUT", body: JSON.stringify(kv) }); notify("Business settings saved (company, currency, tax)"); } catch (e: any) { notify(e.message); } }
  async function mfaAction(action: string) { try { const r = await api("/api/auth/mfa", { method: "POST", body: JSON.stringify({ action, code: mfaCode }) }); if (action === "setup") { setMfa(r); notify("MFA secret generated — add to authenticator, then Enable"); } else { notify(action === "enable" ? "MFA enabled — required at next login" : "MFA disabled"); setUser({ ...user, mfaEnabled: action === "enable" }); } } catch (e: any) { notify(e.message); } }
  async function changePw() { try { const r = await api("/api/auth/change-password", { method: "POST", body: JSON.stringify(pw) }); notify(r.message); setPw({ currentPassword: "", newPassword: "" }); } catch (e: any) { notify(e.message); } }
  return <div className="max-w-3xl space-y-6"><div className="bg-white rounded-xl border p-6"><h3 className="font-bold text-lg">My Profile</h3><p className="text-sm text-slate-500">Stored in the users table • {user.email} • MFA {user.mfaEnabled ? "ON" : "OFF"}</p><div className="space-y-4 mt-5"><Field label="Full name"><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Phone"><Input value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Role (assigned by Admin via Team)"><Input disabled value={form.role} onChange={() => { }} /></Field><button disabled={saving} onClick={save} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></div></div>
    <div className="bg-white rounded-xl border p-6"><h3 className="font-bold">Business Settings</h3><p className="text-sm text-slate-500">Saved to app_settings table (admin/manager only). Payment gateway: {gateway ? `${gateway.provider} ${gateway.configured ? "configured" : "NOT configured — set Razorpay test keys"}` : "..."}</p><div className="grid sm:grid-cols-2 gap-4 mt-4"><Field label="Company name"><Input value={kv.companyName || ""} onChange={(e: any) => setKv({ ...kv, companyName: e.target.value })} placeholder="SAKK Group" /></Field><Field label="Default currency"><Input value={kv.defaultCurrency || ""} onChange={(e: any) => setKv({ ...kv, defaultCurrency: e.target.value })} placeholder="INR" /></Field><Field label="Default tax %"><Input value={kv.defaultTaxRate || ""} onChange={(e: any) => setKv({ ...kv, defaultTaxRate: e.target.value })} placeholder="18" /></Field><Field label="Invoice prefix"><Input value={kv.invoicePrefix || ""} onChange={(e: any) => setKv({ ...kv, invoicePrefix: e.target.value })} placeholder="INV-" /></Field></div><button onClick={saveKv} className="mt-4 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Save settings</button></div>
    <div className="bg-white rounded-xl border p-6"><h3 className="font-bold">Security — MFA & Password</h3><div className="flex gap-2 flex-wrap mt-3"><button onClick={() => mfaAction("setup")} className="border px-4 py-2 rounded-lg text-sm font-medium">1. Generate MFA secret</button><button onClick={() => mfaAction("enable")} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">2. Enable MFA</button><button onClick={() => mfaAction("disable")} className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">Disable MFA</button></div>{mfa && <div className="mt-3 bg-slate-50 rounded-lg p-4 text-sm break-all"><p><b>Secret:</b> {mfa.secret}</p><p className="text-xs mt-1">{mfa.otpauthUrl}</p><p className="text-xs text-slate-500 mt-1">{mfa.instructions}</p></div>}<div className="mt-3 max-w-xs"><Field label="Authenticator code"><Input value={mfaCode} onChange={(e: any) => setMfaCode(e.target.value)} placeholder="6-digit code" /></Field></div><div className="grid sm:grid-cols-2 gap-4 mt-5"><Field label="Current password"><Input type="password" value={pw.currentPassword} onChange={(e: any) => setPw({ ...pw, currentPassword: e.target.value })} /></Field><Field label="New password"><Input type="password" value={pw.newPassword} onChange={(e: any) => setPw({ ...pw, newPassword: e.target.value })} /></Field></div><button onClick={changePw} className="mt-3 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold">Change password</button></div>
    <div className="bg-white rounded-xl border p-6"><h3 className="font-bold">Email Outbox</h3><p className="text-sm text-slate-500">{outbox.length} email(s) — sent via SMTP when configured, otherwise queued here (never faked as sent). Invites, password resets, invoices & quotations land here.</p><div className="mt-3 space-y-2 max-h-64 overflow-y-auto">{outbox.slice(0, 20).map((o: Any) => <div key={o.id} className="flex gap-2 text-sm border rounded-lg p-3"><Badge v={o.status} /><div><p className="font-medium">{o.subject}</p><p className="text-xs text-slate-500">to {o.toEmail} • {fmtDate(o.createdAt)}</p></div></div>)}{outbox.length === 0 && <p className="text-sm text-slate-400">No emails queued yet.</p>}</div><button onClick={async () => { try { const r = await api("/api/email/outbox", { method: "POST" }); notify(`Retry: ${r.sent} sent, gateway configured: ${r.configured}`); } catch (e: any) { notify(e.message) } }} className="mt-3 border px-4 py-2 rounded-lg text-sm">Retry queued emails</button></div>
    <div className="bg-white rounded-xl border p-6"><h3 className="font-bold">API Integration — all endpoints live</h3><div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-50 rounded-lg p-4">{["POST /api/auth/register (invite-only)", "POST /api/auth/login + MFA", "POST /api/auth/forgot/reset-password", "POST /api/invitations (admin)", "GET|POST /api/contacts + convert", "GET|POST /api/companies", "GET|POST /api/deals (PATCH stage)", "GET|POST /api/quotations + convert/pdf/send", "GET|POST /api/contracts", "GET|POST /api/projects + tasks", "GET|POST /api/invoices + pdf/send", "GET|POST /api/payments + allocate", "POST /api/payments/gateway/* (Razorpay)", "POST /api/credit-notes", "GET|POST /api/expenses (approval)", "GET|POST /api/vendors", "POST /api/documents/upload + signed-link", "GET /api/recurring + run", "GET /api/notifications", "GET /api/audit-logs", "GET|PUT /api/settings", "GET /api/dashboard /reports /export"].map(e => <p key={e} className="flex gap-1 items-center"><ChevronRight size={12} className="text-emerald-600" />{e}</p>)}</div><p className="text-xs text-slate-500 mt-3">Every screen reads & writes through these APIs to Database via Drizzle ORM. No mock, demo or hardcoded records.</p></div></div>;
}
