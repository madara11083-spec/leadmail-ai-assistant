import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Sheet helpers ----------

function extractSheetId(input: string): string {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : input.trim();
}

async function sheetsFetch(path: string, init?: RequestInit) {
  const gwKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!gwKey || !connKey) throw new Error("Google Sheets connection is not configured.");
  const res = await fetch(`https://connector-gateway.lovable.dev/google_sheets/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${gwKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sheets API ${res.status}: ${t}`);
  }
  return res.json();
}

// ---------- Load leads from sheet ----------

const LoadLeadsInput = z.object({
  sheetUrlOrId: z.string().trim().min(1),
  sheetTab: z.string().trim().min(1).default("Sheet1"),
});

export type SheetLead = {
  rowIndex: number;
  name: string;
  business: string;
  email: string;
  niche: string;
  status: string;
};

export const loadLeadsFromSheet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LoadLeadsInput.parse(data))
  .handler(async ({ data }): Promise<{ leads: SheetLead[]; sheetId: string }> => {
    const sheetId = extractSheetId(data.sheetUrlOrId);
    const range = `${data.sheetTab}!A1:F10000`;
    const json = await sheetsFetch(`/spreadsheets/${sheetId}/values/${range}`);
    const rows: string[][] = json.values ?? [];
    if (rows.length < 2) return { leads: [], sheetId };
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (k: string) => headers.indexOf(k);
    const iName = idx("name");
    const iBus = idx("business");
    const iEmail = idx("email");
    const iNiche = idx("niche");
    const iStatus = idx("status");
    const leads: SheetLead[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const status = (r[iStatus] ?? "").trim();
      const email = (r[iEmail] ?? "").trim();
      if (!email || status.toLowerCase() !== "new") continue;
      leads.push({
        rowIndex: i + 1, // 1-indexed sheet row
        name: (r[iName] ?? "").trim(),
        business: (r[iBus] ?? "").trim(),
        email,
        niche: (r[iNiche] ?? "").trim(),
        status,
      });
    }
    return { leads, sheetId };
  });

// ---------- Create campaign ----------

const CreateCampaignInput = z.object({
  name: z.string().trim().min(1).max(120),
  sheetId: z.string().trim().min(1),
  sheetTab: z.string().trim().min(1),
  businessType: z.string().trim().min(1).max(100),
  service: z.string().trim().min(1).max(200),
  tone: z.number().int().min(1).max(5),
  agencyName: z.string().trim().min(1).max(100),
  fromName: z.string().trim().min(1).max(100),
  dailyLimit: z.number().int().min(1).max(500),
  unsubscribeText: z.string().trim().min(1).max(300),
  leads: z.array(
    z.object({
      rowIndex: z.number().int().min(2),
      name: z.string(),
      business: z.string(),
      email: z.string().email(),
      niche: z.string(),
    }),
  ).min(1).max(2000),
});

export const createBulkCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateCampaignInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: campaign, error } = await context.supabase
      .from("bulk_campaigns")
      .insert({
        user_id: context.userId,
        name: data.name,
        sheet_id: data.sheetId,
        sheet_tab: data.sheetTab,
        business_type: data.businessType,
        service: data.service,
        tone: data.tone,
        agency_name: data.agencyName,
        from_name: data.fromName,
        daily_limit: data.dailyLimit,
        unsubscribe_text: data.unsubscribeText,
        status: "running",
      })
      .select()
      .single();
    if (error || !campaign) throw new Error(error?.message || "Failed to create campaign");

    const rows = data.leads.map((l) => ({
      campaign_id: campaign.id,
      user_id: context.userId,
      row_index: l.rowIndex,
      name: l.name,
      business: l.business,
      email: l.email,
      niche: l.niche,
      status: "pending",
    }));
    const { error: lerr } = await context.supabase.from("campaign_leads").insert(rows);
    if (lerr) throw new Error(lerr.message);

    return { campaignId: campaign.id };
  });

// ---------- Campaign status / listing ----------

export const listBulkCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bulk_campaigns")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CampaignIdInput = z.object({ campaignId: z.string().uuid() });

export const getCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CampaignIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: c } = await context.supabase
      .from("bulk_campaigns")
      .select("*")
      .eq("id", data.campaignId)
      .eq("user_id", context.userId)
      .single();
    const { data: leads } = await context.supabase
      .from("campaign_leads")
      .select("id,email,name,business,status,error,sent_at,subject")
      .eq("campaign_id", data.campaignId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    const counts = { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 };
    for (const l of leads ?? []) {
      counts.total++;
      counts[l.status as keyof typeof counts]++;
    }
    return { campaign: c, leads: leads ?? [], counts };
  });

const StatusChangeInput = z.object({
  campaignId: z.string().uuid(),
  status: z.enum(["running", "paused", "completed"]),
});

export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => StatusChangeInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bulk_campaigns")
      .update({ status: data.status })
      .eq("id", data.campaignId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

