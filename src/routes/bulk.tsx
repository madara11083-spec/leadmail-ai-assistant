import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  Play,
  Pause,
  RefreshCcw,
  Send,
  Mail,
  Database,
} from "lucide-react";
import {
  loadLeadsFromSheet,
  createBulkCampaign,
  listBulkCampaigns,
  getCampaignStatus,
  setCampaignStatus,
  type SheetLead,
} from "@/lib/bulk.functions";

export const Route = createFileRoute("/bulk")({
  head: () => ({
    meta: [
      { title: "Bulk Campaign — LeadMail AI" },
      {
        name: "description",
        content:
          "Run high-volume cold email campaigns from a Google Sheet. Personalized AI emails, daily send limits, live progress.",
      },
      { property: "og:title", content: "Bulk Campaign — LeadMail AI" },
      {
        property: "og:description",
        content: "Send personalized cold emails to leads from Google Sheets on autopilot.",
      },
    ],
  }),
  component: BulkPage,
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
];

const TONE_LABELS = ["Very casual", "Casual", "Friendly-pro", "Professional", "Formal"];

type CampaignRow = {
  id: string;
  name: string;
  status: string;
  sent_today: number;
  daily_limit: number;
  created_at: string;
};

function BulkPage() {
  const loadLeads = useServerFn(loadLeadsFromSheet);
  const createCampaign = useServerFn(createBulkCampaign);
  const listCampaigns = useServerFn(listBulkCampaigns);
  const getStatus = useServerFn(getCampaignStatus);
  const setStatus = useServerFn(setCampaignStatus);

  // Form
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetTab, setSheetTab] = useState("Sheet1");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [service, setService] = useState("Modern responsive website + SEO");
  const [tone, setTone] = useState(3);
  const [agencyName, setAgencyName] = useState("Your Agency");
  const [fromName, setFromName] = useState("Your Name");
  const [dailyLimit, setDailyLimit] = useState(40);
  const [unsubText, setUnsubText] = useState(
    'Not interested? Reply "unsubscribe" and I won\'t reach out again.',
  );

  // Leads
  const [loading, setLoading] = useState(false);
  const [sheetId, setSheetId] = useState("");
  const [leads, setLeads] = useState<SheetLead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Campaign list + active
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<{
    campaign: CampaignRow & { last_error?: string | null };
    counts: { total: number; sent: number; failed: number; pending: number; skipped: number };
    leads: Array<{
      id: string;
      email: string;
      name: string;
      business: string;
      status: string;
      error: string | null;
      sent_at: string | null;
      subject: string | null;
    }>;
  } | null>(null);

  const refreshCampaigns = async () => {
    try {
      const c = (await listCampaigns()) as CampaignRow[];
      setCampaigns(c);
      if (!activeId && c.length > 0) setActiveId(c[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const d = await getStatus({ data: { campaignId: activeId } });
        if (!cancelled) setActiveData(d as typeof activeData);
      } catch (e) {
        console.error(e);
      }
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [activeId, getStatus]);

  const handleLoad = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Paste a Google Sheet URL or ID");
      return;
    }
    setLoading(true);
    try {
      const res = await loadLeads({
        data: { sheetUrlOrId: sheetUrl.trim(), sheetTab: sheetTab.trim() || "Sheet1" },
      });
      setLeads(res.leads);
      setSheetId(res.sheetId);
      setSelected(new Set(res.leads.map((l) => l.rowIndex)));
      toast.success(`Loaded ${res.leads.length} new leads`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load sheet");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (row: number) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(row)) n.delete(row);
      else n.add(row);
      return n;
    });
  };

  const allSelected = leads.length > 0 && selected.size === leads.length;

  const handleStart = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one lead");
      return;
    }
    if (!name.trim()) {
      toast.error("Give the campaign a name");
      return;
    }
    setLoading(true);
    try {
      const picked = leads.filter((l) => selected.has(l.rowIndex));
      const res = await createCampaign({
        data: {
          name: name.trim(),
          sheetId,
          sheetTab: sheetTab.trim() || "Sheet1",
          businessType,
          service,
          tone,
          agencyName,
          fromName,
          dailyLimit,
          unsubscribeText: unsubText,
          leads: picked,
        },
      });
      toast.success("Campaign started");
      setActiveId(res.campaignId);
      setLeads([]);
      setSelected(new Set());
      setSheetUrl("");
      await refreshCampaigns();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start campaign");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (target: "running" | "paused") => {
    if (!activeId) return;
    await setStatus({ data: { campaignId: activeId, status: target } });
    await refreshCampaigns();
  };

  const remaining = activeData
    ? activeData.counts.total - activeData.counts.sent - activeData.counts.failed
    : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Database className="h-3.5 w-3.5" /> Bulk Campaign
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Run outreach on autopilot</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Connect a Google Sheet of leads, set your daily send limit, and let the AI personalize
          and send each email through your Gmail. Sheet columns: Name | Business | Email | Niche |
          Status | Email_Sent_Date. Only rows with Status = <span className="font-mono">New</span>{" "}
          are loaded.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: form + leads */}
        <section className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-surface/50 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Download className="h-4 w-4 text-primary" /> Load leads
            </h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Google Sheet URL or ID
                </label>
                <input
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Tab name</label>
                <input
                  value={sheetTab}
                  onChange={(e) => setSheetTab(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleLoad}
              disabled={loading}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Load Leads
            </button>
          </div>

          {leads.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-surface/50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">
                  {selected.size} / {leads.length} selected
                </h3>
                <button
                  onClick={() =>
                    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.rowIndex)))
                  }
                  className="text-xs text-primary hover:underline"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="max-h-72 overflow-auto rounded-md border border-border/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background/60 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2"></th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Business</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Niche</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.rowIndex} className="border-t border-border/40">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(l.rowIndex)}
                            onChange={() => toggle(l.rowIndex)}
                          />
                        </td>
                        <td className="px-3 py-2">{l.name}</td>
                        <td className="px-3 py-2">{l.business}</td>
                        <td className="px-3 py-2 text-muted-foreground">{l.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">{l.niche}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {leads.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-surface/50 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Mail className="h-4 w-4 text-primary" /> Campaign settings
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Campaign name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Realtors Q3"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Business type">
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {BUSINESS_TYPES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Service to pitch" span2>
                  <input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Agency name">
                  <input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Signature name">
                  <input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label={`Tone: ${TONE_LABELS[tone - 1]}`}>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={tone}
                    onChange={(e) => setTone(Number(e.target.value))}
                    className="w-full"
                  />
                </Field>
                <Field label="Daily send limit">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Unsubscribe line" span2>
                  <input
                    value={unsubText}
                    onChange={(e) => setUnsubText(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <button
                onClick={handleStart}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Start Campaign ({selected.size})
              </button>
            </div>
          )}
        </section>

        {/* Right: campaigns + progress */}
        <section className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-surface/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Campaigns</h2>
              <button
                onClick={refreshCampaigns}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCcw className="h-3 w-3" /> Refresh
              </button>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            ) : (
              <ul className="space-y-2">
                {campaigns.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        activeId === c.id
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-background hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c.name}</span>
                        <StatusPill status={c.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.sent_today}/{c.daily_limit} sent today
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {activeData?.campaign && (
            <div className="rounded-xl border border-border/60 bg-surface/50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{activeData.campaign.name}</h2>
                <div className="flex gap-2">
                  {activeData.campaign.status === "running" ? (
                    <button
                      onClick={() => handlePauseResume("paused")}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePauseResume("running")}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Stat label="Total" value={activeData.counts.total} />
                <Stat label="Sent" value={activeData.counts.sent} accent />
                <Stat label="Failed" value={activeData.counts.failed} />
                <Stat label="Remaining" value={remaining} />
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Sent today: {activeData.campaign.sent_today} / {activeData.campaign.daily_limit}
              </div>

              {activeData.campaign.last_error && (
                <p className="mt-2 text-xs text-destructive">
                  Last error: {activeData.campaign.last_error}
                </p>
              )}

              <div className="mt-4 max-h-80 overflow-auto rounded-md border border-border/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background/60 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeData.leads.map((l) => (
                      <tr key={l.id} className="border-t border-border/40">
                        <td className="px-3 py-2 text-muted-foreground">{l.email}</td>
                        <td className="px-3 py-2">
                          <StatusPill status={l.status} />
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {l.status === "sent"
                            ? l.subject
                            : l.status === "failed"
                              ? l.error
                              : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  span2,
}: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-primary/15 text-primary",
    paused: "bg-yellow-500/15 text-yellow-500",
    completed: "bg-emerald-500/15 text-emerald-500",
    idle: "bg-muted text-muted-foreground",
    pending: "bg-muted text-muted-foreground",
    sent: "bg-emerald-500/15 text-emerald-500",
    failed: "bg-destructive/15 text-destructive",
    skipped: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}
