import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Loader2,
  Sparkles,
  Trash2,
  Mail,
  Database,
  Send,
  RotateCcw,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { generateEmail, type GenerateEmailResult } from "@/lib/email.functions";

const EMAILJS_SERVICE_ID = "service_zznirzy";
const EMAILJS_TEMPLATE_ID = "template_9hiuxks";
const EMAILJS_PUBLIC_KEY = "aJkp6MGihHvf3cq6I";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate a Cold Email — LeadMail AI" },
      {
        name: "description",
        content:
          "Generate a personalized cold outreach email in seconds. Pick the business type, city, and service to pitch.",
      },
      { property: "og:title", content: "Generate a Cold Email — LeadMail AI" },
      { property: "og:description", content: "Personalized cold outreach emails in seconds." },
    ],
  }),
  component: GeneratePage,
});

const BUSINESS_TYPES = [
  "Realtor",
  "Doctor / Clinic",
  "Dental Clinic",
  "Restaurant",
  "Law Firm",
  "Local Retail",
  "Salon / Spa",
  "Gym / Fitness",
  "Other",
] as const;

const SERVICES = [
  "New website build",
  "Website redesign",
  "SEO bundle",
  "Local SEO + Google Business",
  "Conversion optimization",
  "Speed & mobile fix",
  "Custom",
] as const;

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

type FieldErrors = {
  businessType?: string;
  customType?: string;
  businessName?: string;
  location?: string;
  service?: string;
  customService?: string;
  recipientEmail?: string;
};

function normalizeEmail(v: string) {
  return v.trim();
}

function isLikelyEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function inputClsWithError(hasError: boolean) {
  return hasError ? `${inputCls} border-red-500 focus:border-red-500 focus:ring-red-500/30` : inputCls;
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? <div className="mt-1 text-xs text-red-500">{error}</div> : null}
    </div>
  );
}

function CrmDropdown() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDoc = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-crm-dropdown]")) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const send = (name: string) => {
    setOpen(false);
    toast(`${name} integration coming soon`, { description: "CRM sync is on our roadmap." });
  };

  return (
    <div className="relative" data-crm-dropdown>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated active:opacity-90"
        aria-expanded={open}
      >
        <Database className="h-4 w-4" /> Send to CRM
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-elegant">
          {["HubSpot", "Salesforce", "Pipedrive", "Close"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => send(c)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-surface active:opacity-90"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneratePage() {
  const generate = useServerFn(generateEmail);

  const [businessType, setBusinessType] = useState<(typeof BUSINESS_TYPES)[number]>(BUSINESS_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState<(typeof SERVICES)[number]>(SERVICES[0]);
  const [customService, setCustomService] = useState("");
  const [tone, setTone] = useState(3);
  const [agencyName, setAgencyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateEmailResult | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [history, setHistory] = useState<Saved[]>([]);

  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const generateLockedRef = useRef(false);
  const sendLockedRef = useRef(false);

  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lm-history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const effectiveType = businessType === "Other" ? customType.trim() : businessType;
  const effectiveService = service === "Custom" ? customService.trim() : service;

  const canGenerateBase =
    Boolean(effectiveType) && Boolean(businessName.trim()) && Boolean(location.trim()) && Boolean(effectiveService);
  const canGenerate = canGenerateBase && !loading;

  const toneLabel = useMemo(
    () => ["Very Casual", "Casual", "Balanced", "Professional", "Corporate"][tone - 1] || "",
    [tone]
  );

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (businessType === "Other") {
      if (!customType.trim()) next.customType = "Please enter the business type.";
    } else {
      if (!businessType) next.businessType = "Please select a business type.";
    }

    if (!businessName.trim()) next.businessName = "Business name is required.";
    else if (businessName.trim().length < 2) next.businessName = "Please enter a valid business name.";

    if (!location.trim()) next.location = "Location is required.";
    else if (location.trim().length < 2) next.location = "Please enter a valid location.";

    if (service === "Custom") {
      if (!customService.trim()) next.customService = "Please enter what service to pitch.";
    } else {
      if (!service) next.service = "Please select a service.";
    }

    if (recipientEmail.trim()) {
      if (!isLikelyEmail(recipientEmail)) next.recipientEmail = "Please enter a valid email address.";
    }

    return next;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) return;

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Fix the highlighted fields to generate an email.");
      return;
    }

    if (generateLockedRef.current) return;
    generateLockedRef.current = true;

    setGenerateError(null);
    setSendError(null);
    setLoading(true);

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
      setSubject(res.subjectLines?.[0] ?? "");
      setBody(res.body ?? "");

      const entry: Saved = {
        id: crypto.randomUUID(),
        at: Date.now(),
        inputs: {
          businessType: effectiveType,
          businessName: businessName.trim(),
          location: location.trim(),
          service: effectiveService,
          tone,
        },
        subject: res.subjectLines?.[0] ?? "",
        body: res.body ?? "",
      };

      const next = [entry, ...history].slice(0, 10);
      setHistory(next);
      try {
        localStorage.setItem("lm-history", JSON.stringify(next));
      } catch {
        // ignore
      }

      toast.success("Email generated");
      scrollToTop();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate email. Please try again.";
      setGenerateError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      generateLockedRef.current = false;
    }
  };

  const retryGenerate = async () => {
    if (loading) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Fix the highlighted fields to generate an email.");
      return;
    }
    await onSubmit({ preventDefault() {}, stopPropagation() {} } as unknown as React.FormEvent);
  };

  const copyAll = async () => {
    const text = `Subject: ${subject}\n\n${body}`.trim();
    if (!text || (!subject.trim() && !body.trim())) {
      toast.error("Nothing to copy yet.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
        return;
      }

      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) throw new Error("Copy command failed");
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed. Try downloading instead.");
    }
  };

  const download = (kind: "txt" | "doc") => {
    const text = `Subject: ${subject}\n\n${body}`.trim();
    if (!text || (!subject.trim() && !body.trim())) {
      toast.error("Nothing to download yet.");
      return;
    }

    const mime = kind === "txt" ? "text/plain;charset=utf-8" : "application/msword";
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    const safe = (businessName || "email")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    a.download = `leadmail-${safe || "email"}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded .${kind}`);
  };

  const loadFromHistory = (h: Saved) => {
    setSubject(h.subject);
    setBody(h.body);
    setResult({ subjectLines: [h.subject], body: h.body } as GenerateEmailResult);
    scrollToTop();
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("lm-history");
    } catch {
      // ignore
    }
    toast("History cleared");
  };

  const handleSend = async () => {
    const to = normalizeEmail(recipientEmail);
    if (sendLockedRef.current || sending) return;

    if (!to) {
      setSendError("Recipient email is required to send.");
      toast.error("Recipient email is required to send.");
      return;
    }
    if (!isLikelyEmail(to)) {
      setSendError("Please enter a valid recipient email address.");
      toast.error("Please enter a valid recipient email address.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setSendError("Generate an email before sending.");
      toast.error("Generate an email before sending.");
      return;
    }

    sendLockedRef.current = true;
    setSendError(null);
    setSending(true);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: to,
          subject: subject,
          body: body,
        },
        EMAILJS_PUBLIC_KEY
      );

      toast.success(`✅ Email sent to ${to}!`);
    } catch {
      const msg = "⚠️ Failed to send. Please try again.";
      setSendError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
      sendLockedRef.current = false;
    }
  };

  const retrySend = async () => {
    if (sending) return;
    await handleSend();
  };

  const canCopy = Boolean(subject.trim() || body.trim());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Generate a cold email</h1>
        <p className="mt-3 text-muted-foreground text-sm sm:text-base">
          Tell us about the prospect. We'll draft a personalized email, three subject lines, and a clear CTA.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6"
          aria-busy={loading}
        >
          <Field label="Business type" error={businessType === "Other" ? errors.customType : errors.businessType}>
            <select
              className={inputClsWithError(Boolean(errors.businessType))}
              value={businessType}
              onChange={(e) => {
                setBusinessType(e.target.value as (typeof BUSINESS_TYPES)[number]);
                setErrors((prev) => ({ ...prev, businessType: undefined, customType: undefined }));
              }}
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {businessType === "Other" && (
              <input
                className={`${inputClsWithError(Boolean(errors.customType))} mt-2`}
                placeholder="e.g. Veterinary clinic"
                value={customType}
                onChange={(e) => {
                  setCustomType(e.target.value);
                  setErrors((prev) => ({ ...prev, customType: undefined }));
                }}
                maxLength={100}
                inputMode="text"
              />
            )}
          </Field>

          <Field label="Business name" error={errors.businessName}>
            <input
              className={inputClsWithError(Boolean(errors.businessName))}
              placeholder="e.g. Joe's Pizza"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setErrors((prev) => ({ ...prev, businessName: undefined }));
              }}
              maxLength={150}
              inputMode="text"
            />
          </Field>

          <Field label="Location" error={errors.location}>
            <input
              className={inputClsWithError(Boolean(errors.location))}
              placeholder="e.g. Chicago, IL"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setErrors((prev) => ({ ...prev, location: undefined }));
              }}
              maxLength={150}
              inputMode="text"
            />
          </Field>

          <Field label="Service to pitch" error={service === "Custom" ? errors.customService : errors.service}>
            <select
              className={inputClsWithError(Boolean(errors.service))}
              value={service}
              onChange={(e) => {
                setService(e.target.value as (typeof SERVICES)[number]);
                setErrors((prev) => ({ ...prev, service: undefined, customService: undefined }));
              }}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {service === "Custom" && (
              <input
                className={`${inputClsWithError(Boolean(errors.customService))} mt-2`}
                placeholder="e.g. Booking system integration"
                value={customService}
                onChange={(e) => {
                  setCustomService(e.target.value);
                  setErrors((prev) => ({ ...prev, customService: undefined }));
                }}
                maxLength={200}
                inputMode="text"
              />
            )}
          </Field>

          <Field label="Your agency name (optional)">
            <input
              className={inputCls}
              placeholder="e.g. Crestview Web"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              maxLength={100}
              inputMode="text"
            />
          </Field>

          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Tone</label>
              <span className="text-xs text-muted-foreground">{toneLabel}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Casual</span>
              <span>Corporate</span>
            </div>
          </div>

          <Field label="Send to (optional)" error={errors.recipientEmail}>
            <input
              type="email"
              className={inputClsWithError(Boolean(errors.recipientEmail))}
              placeholder="client@business.com"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
                setErrors((prev) => ({ ...prev, recipientEmail: undefined }));
              }}
              inputMode="email"
            />
          </Field>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={!canGenerate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:glow-red active:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : "Generate Email"}
            </button>

            {generateError && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="text-sm font-medium">Couldn't generate email</div>
                <div className="mt-1 text-sm text-muted-foreground">{generateError}</div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={retryGenerate}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Output */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Your generated email will appear here.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="grid min-h-[320px] place-items-center rounded-2xl border border-border bg-surface p-8">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Crafting your email…</p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 animate-fade-up">
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject line suggestions
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.subjectLines?.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors active:opacity-95 ${
                        s === subject
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
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

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2 w-full sm:flex-1">
                  <button
                    type="button"
                    onClick={copyAll}
                    disabled={!canCopy}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 active:opacity-95"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => download("txt")}
                    disabled={!canCopy}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 active:opacity-95"
                  >
                    <Download className="h-4 w-4" /> .txt
                  </button>

                  <button
                    type="button"
                    onClick={() => download("doc")}
                    disabled={!canCopy}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 active:opacity-95"
                  >
                    <Download className="h-4 w-4" /> .doc
                  </button>
                </div>

                <div className="w-full sm:w-auto sm:ml-auto">
                  <CrmDropdown />
                </div>
              </div>

              {/* Send */}
              <div className="mt-4">
                {recipientEmail.trim() && (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !subject.trim() || !body.trim() || !recipientEmail.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:glow-red active:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? "Sending..." : "📤 Send via Gmail"}
                  </button>
                )}

                {sendError && (
                  <div className="mt-3 rounded-xl border border-border bg-surface p-4">
                    <div className="text-sm font-medium">Send failed</div>
                    <div className="mt-1 text-sm text-muted-foreground">{sendError}</div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={retrySend}
                        disabled={sending}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated disabled:opacity-50 active:opacity-95"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Retry Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent emails</h2>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
              <ul className="divide-y divide-border">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => loadFromHistory(h)}
                      className="flex w-full flex-col items-start gap-1 py-3 text-left transition-colors hover:text-primary"
                    >
                      <span className="text-sm font-medium line-clamp-1">{h.subject || "(no subject)"}</span>
                      <span className="text-xs text-muted-foreground">
                        {h.inputs.businessName} · {h.inputs.location} · {new Date(h.at).toLocaleString()}
                      </span>
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
