import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Loader2, Sparkles, Trash2, Mail, Database } from "lucide-react";
import { generateEmail, type GenerateEmailResult } from "@/lib/email.functions";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate a Cold Email — LeadMail AI" },
      { name: "description", content: "Generate a personalized cold outreach email in seconds. Pick the business type, city, and service to pitch." },
      { property: "og:title", content: "Generate a Cold Email — LeadMail AI" },
      { property: "og:description", content: "Personalized cold outreach emails in seconds." },
    ],
  }),
  component: GeneratePage,
});

const BUSINESS_TYPES = ["Realtor", "Doctor / Clinic", "Dental Clinic", "Restaurant", "Law Firm", "Local Retail", "Salon / Spa", "Gym / Fitness", "Other"];
const SERVICES = ["New website build", "Website redesign", "SEO bundle", "Local SEO + Google Business", "Conversion optimization", "Speed & mobile fix", "Custom"];

type Saved = {
  id: string;
  at: number;
  inputs: {
    businessType: string;
    businessName: string;
    location: string;
    service: string;
    tone: number;
  };
  subject: string;
  body: string;
};

function GeneratePage() {
  const generate = useServerFn(generateEmail);

  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [customService, setCustomService] = useState("");
  const [tone, setTone] = useState(3);
  const [agencyName, setAgencyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateEmailResult | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<Saved[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lm-history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const effectiveType = businessType === "Other" ? customType.trim() : businessType;
  const effectiveService = service === "Custom" ? customService.trim() : service;
  const canSubmit = effectiveType && businessName.trim() && location.trim() && effectiveService && !loading;

  const toneLabel = useMemo(
    () => ["Very Casual", "Casual", "Balanced", "Professional", "Corporate"][tone - 1],
    [tone],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await generate({
        data: {
          businessType: effectiveType,
          businessName: businessName.trim(),
          location: location.trim(),
          service: effectiveService,
          tone,
          agencyName: agencyName.trim() || undefined,
        },
      });
      setResult(res);
      setSubject(res.subjectLines[0] ?? "");
      setBody(res.body);
      // save
      const entry: Saved = {
        id: crypto.randomUUID(),
        at: Date.now(),
        inputs: { businessType: effectiveType, businessName: businessName.trim(), location: location.trim(), service: effectiveService, tone },
        subject: res.subjectLines[0] ?? "",
        body: res.body,
      };
      const next = [entry, ...history].slice(0, 10);
      setHistory(next);
      try { localStorage.setItem("lm-history", JSON.stringify(next)); } catch {}
      toast.success("Email generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const download = (kind: "txt" | "doc") => {
    const text = `Subject: ${subject}\n\n${body}`;
    const mime = kind === "txt" ? "text/plain" : "application/msword";
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (businessName || "email").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `leadmail-${safe}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (h: Saved) => {
    setSubject(h.subject);
    setBody(h.body);
    setResult({ subjectLines: [h.subject], body: h.body });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem("lm-history"); } catch {}
    toast("History cleared");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Generate a cold email</h1>
        <p className="mt-3 text-muted-foreground">Tell us about the prospect. We'll draft a personalized email, three subject lines, and a clear CTA.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-surface p-6">
          <Field label="Business type">
            <select className={inputCls} value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {businessType === "Other" && (
              <input className={`${inputCls} mt-2`} placeholder="e.g. Veterinary clinic" value={customType} onChange={(e) => setCustomType(e.target.value)} maxLength={100} />
            )}
          </Field>

          <Field label="Business name">
            <input className={inputCls} placeholder="e.g. Joe's Pizza" value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={150} />
          </Field>

          <Field label="Location">
            <input className={inputCls} placeholder="e.g. Chicago, IL" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={150} />
          </Field>

          <Field label="Service to pitch">
            <select className={inputCls} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {service === "Custom" && (
              <input className={`${inputCls} mt-2`} placeholder="e.g. Booking system integration" value={customService} onChange={(e) => setCustomService(e.target.value)} maxLength={200} />
            )}
          </Field>

          <Field label="Your agency name (optional)">
            <input className={inputCls} placeholder="e.g. Crestview Web" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} maxLength={100} />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Tone</label>
              <span className="text-xs text-muted-foreground">{toneLabel}</span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Casual</span><span>Corporate</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:glow-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate Email"}
          </button>
        </form>

        {/* Output */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="grid h-full min-h-[400px] place-items-center rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Your generated email will appear here.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="grid h-full min-h-[400px] place-items-center rounded-2xl border border-border bg-surface p-10">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Crafting your email…</p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-border bg-surface p-6 animate-fade-up">
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject line suggestions</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.subjectLines.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${s === subject ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Subject">
                <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </Field>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium">Email body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  className={`${inputCls} resize-y leading-relaxed`}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={copyAll} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <button onClick={() => download("txt")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated">
                  <Download className="h-4 w-4" /> .txt
                </button>
                <button onClick={() => download("doc")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated">
                  <Download className="h-4 w-4" /> .doc
                </button>
                <div className="ml-auto">
                  <CrmDropdown />
                </div>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent emails</h2>
                <button onClick={clearHistory} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
              <ul className="divide-y divide-border">
                {history.map((h) => (
                  <li key={h.id}>
                    <button onClick={() => loadFromHistory(h)} className="flex w-full flex-col items-start gap-1 py-3 text-left transition-colors hover:text-primary">
                      <span className="text-sm font-medium line-clamp-1">{h.subject || "(no subject)"}</span>
                      <span className="text-xs text-muted-foreground">{h.inputs.businessName} · {h.inputs.location} · {new Date(h.at).toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function CrmDropdown() {
  const [open, setOpen] = useState(false);
  const send = (name: string) => {
    setOpen(false);
    toast(`${name} integration coming soon`, { description: "CRM sync is on our roadmap." });
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated">
        <Database className="h-4 w-4" /> Send to CRM
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-elegant">
          {["HubSpot", "Salesforce", "Pipedrive", "Close"].map((c) => (
            <button key={c} onClick={() => send(c)} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface">
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
