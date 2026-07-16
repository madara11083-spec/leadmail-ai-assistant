import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Cron-driven worker: processes up to N pending leads per tick, respecting each
// campaign's daily_limit. Uses the shared builder Gmail + Sheets connections.

const GATEWAY = "https://connector-gateway.lovable.dev";
const MAX_LEADS_PER_TICK = 5;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateEmailFor(params: {
  name: string;
  business: string;
  niche: string;
  businessType: string;
  service: string;
  tone: number;
  agencyName: string;
  fromName: string;
  unsubscribeText: string;
  apiKey: string;
}): Promise<{ subject: string; body: string }> {
  const toneLabels = [
    "Very casual and friendly",
    "Casual and warm",
    "Friendly but professional",
    "Professional",
    "Formal and corporate",
  ];
  const system = `You are an expert cold-outreach copywriter. Return JSON only. Rules:
- Under 130 words in the body
- Personal opener that references the prospect's business/niche naturally
- One specific value proposition tied to the service being pitched
- One clear CTA for a free 15-minute consultation
- End with the signature: "— ${params.fromName}\\n${params.agencyName}"
- Tone: ${toneLabels[params.tone - 1] ?? toneLabels[2]}
- No emojis, no markdown, no bullets
- Subject under 60 chars, curiosity-driven`;
  const user = `Prospect:
- Name: ${params.name || "there"}
- Business: ${params.business}
- Niche: ${params.niche || params.businessType}
- Service to pitch: ${params.service}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "deliver_email",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "deliver_email" } },
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("AI returned no tool call");
  const args = JSON.parse(call.function.arguments);
  const body = `${args.body}\n\n---\n${params.unsubscribeText}`;
  return { subject: args.subject, body };
}

async function sendGmail(to: string, subject: string, body: string, apiKey: string, connKey: string) {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  const res = await fetch(`${GATEWAY}/google_mail/gmail/v1/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: b64url(raw) }),
  });
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`);
}

async function markSheetRow(
  sheetId: string,
  sheetTab: string,
  rowIndex: number,
  apiKey: string,
  connKey: string,
) {
  // Assumes Status is column E and Email_Sent_Date is column F
  const range = `${sheetTab}!E${rowIndex}:F${rowIndex}`;
  const nowIso = new Date().toISOString();
  const res = await fetch(
    `${GATEWAY}/google_sheets/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Connection-Api-Key": connKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [["Sent", nowIso]] }),
    },
  );
  if (!res.ok) throw new Error(`Sheets update ${res.status}: ${await res.text()}`);
}

export const Route = createFileRoute("/api/public/hooks/campaign-tick")({
  server: {
    handlers: {
      POST: async () => {
        const gwKey = process.env.LOVABLE_API_KEY;
        const gmailKey = process.env.GOOGLE_MAIL_API_KEY;
        const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
        const supaUrl = process.env.SUPABASE_URL;
        const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!gwKey || !gmailKey || !sheetsKey || !supaUrl || !supaKey) {
          return Response.json(
            { ok: false, error: "Missing environment configuration" },
            { status: 500 },
          );
        }

        const db = createClient(supaUrl, supaKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: campaigns } = await db
          .from("bulk_campaigns")
          .select("*")
          .eq("status", "running");

        const processed: Array<Record<string, unknown>> = [];

        for (const c of campaigns ?? []) {
          // Reset today's counter on a new day
          let sentToday = c.sent_today ?? 0;
          if (c.last_run_date !== todayUTC()) {
            sentToday = 0;
          }
          if (sentToday >= c.daily_limit) continue;

          const budget = Math.min(MAX_LEADS_PER_TICK, c.daily_limit - sentToday);
          const { data: leads } = await db
            .from("campaign_leads")
            .select("*")
            .eq("campaign_id", c.id)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(budget);

          if (!leads || leads.length === 0) {
            // Nothing pending — mark completed
            await db
              .from("bulk_campaigns")
              .update({ status: "completed", sent_today: sentToday, last_run_date: todayUTC() })
              .eq("id", c.id);
            continue;
          }

          for (const lead of leads) {
            try {
              const { subject, body } = await generateEmailFor({
                name: lead.name,
                business: lead.business,
                niche: lead.niche,
                businessType: c.business_type,
                service: c.service,
                tone: c.tone,
                agencyName: c.agency_name,
                fromName: c.from_name,
                unsubscribeText: c.unsubscribe_text,
                apiKey: gwKey,
              });
              await sendGmail(lead.email, subject, body, gwKey, gmailKey);
              try {
                await markSheetRow(c.sheet_id, c.sheet_tab, lead.row_index, gwKey, sheetsKey);
              } catch (sheetErr) {
                console.error("sheet update failed", sheetErr);
              }
              await db
                .from("campaign_leads")
                .update({
                  status: "sent",
                  subject,
                  body,
                  sent_at: new Date().toISOString(),
                  error: null,
                })
                .eq("id", lead.id);
              sentToday++;
              processed.push({ campaign: c.id, lead: lead.email, ok: true });
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              await db
                .from("campaign_leads")
                .update({ status: "failed", error: msg })
                .eq("id", lead.id);
              processed.push({ campaign: c.id, lead: lead.email, ok: false, error: msg });
            }
          }

          await db
            .from("bulk_campaigns")
            .update({
              sent_today: sentToday,
              last_run_date: todayUTC(),
              last_error: null,
            })
            .eq("id", c.id);

          if (sentToday >= c.daily_limit) {
            // hit daily cap, keep as running so tomorrow resumes
          }
        }

        return Response.json({ ok: true, processed });
      },
    },
  },
});
