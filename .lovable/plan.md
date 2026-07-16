# Bulk Campaign Feature Plan

## 1. Authentication (prerequisite)
- Add Supabase email/password + Google sign-in via Lovable Cloud managed auth.
- Add `/auth` route (sign-in/sign-up) and integration-managed `_authenticated` gate.
- Wrap Navbar with a session-aware account menu (Sign in / Sign out).
- The existing single-lead generator stays public. Bulk Campaign will live under `/_authenticated/bulk`.

## 2. Google App User Connectors
Two connectors, per-user OAuth (each user connects their own account):
- `google_mail` — scopes: `gmail.send`, `userinfo.email`, `userinfo.profile`.
- `google_sheets` — scopes: `spreadsheets`, `userinfo.email`, `userinfo.profile`.

Wire the standard flow from the knowledge card:
- `src/integrations/lovable/appUserConnector.ts` (server) + `appUserConnectorClient.ts` (browser popup).
- Encrypted per-user key storage: `app_user_connections` table + AES-GCM helper reading `APP_USER_CONNECTION_KEY_SECRET`.
- Server fns: `startConnect`, `saveAppUserConnection`, `disconnectConnection`, `getConnectionStatus`.

## 3. Data model (Lovable Cloud migration)
```
app_user_connections     — encrypted per-user connector keys (per knowledge card)
bulk_campaigns           — id, user_id, sheet_id, sheet_tab, daily_limit,
                           status (queued|running|paused|completed|failed),
                           total_leads, sent_count, failed_count,
                           next_send_at, last_error, agency_name, tone,
                           business_type, service, created_at, updated_at
campaign_leads           — id, campaign_id, user_id, row_index, name, business,
                           email, niche, subject, body, status
                           (pending|sent|failed|skipped), error, sent_at
```
All tables: RLS `user_id = auth.uid()`; GRANT authenticated + service_role.

## 4. UI — `/_authenticated/bulk`
- **Connections panel**: Gmail + Google Sheets connect buttons, status pills, disconnect.
- **New campaign form**: paste Google Sheet URL/ID + tab name (default `Sheet1`), agency name, tone slider, business type & service (used by the same prompt as single-lead), daily send limit (default 40).
- **"Load Leads"** button → server fn reads sheet via `google_sheets` connector, filters `Status = "New"`, returns rows.
- **Preview table** with checkboxes (all selected by default), plus a "Generate previews" step showing subject+body for each selected lead (uses existing `generateEmail` logic, extended to accept `{name, business}`).
- **Start Campaign** button → creates `bulk_campaigns` + `campaign_leads` rows, sets `status=running`, `next_send_at=now()`.
- **Live progress dashboard** (polls every 5s via TanStack Query): Total | Sent | Failed | Remaining, current lead, ETA, pause/resume/stop.

## 5. Background runner (server-driven)
Cron endpoint: `POST /api/public/hooks/campaign-tick` (authenticated with anon apikey header).
Scheduled every minute via pg_cron.

Per tick:
1. Load all campaigns with `status='running'` AND `next_send_at <= now()`.
2. For each, pick the next `pending` lead:
   - Regenerate today's send count; if `>= daily_limit`, mark campaign `completed` (daily cap).
   - Load user's encrypted Gmail key, decrypt, send via Gmail API `users/me/messages/send` (append unsubscribe line to body).
   - On success: mark lead `sent`, `sent_count++`, update sheet row `Status=Sent, Email_Sent_Date=today` via Sheets API.
   - On failure: mark lead `failed`, `failed_count++`, update sheet `Status=Failed`, continue.
   - Set `next_send_at = now() + random(60..90) seconds`.
3. If no `pending` leads remain → `status=completed`.

Because pg_cron only fires every 60s, the 60–90s randomized gap is naturally enforced by `next_send_at`. Each tick processes at most one send per campaign, so multiple campaigns interleave safely.

## 6. Email generation reuse
- Extract prompt builder from `src/lib/email.functions.ts` into `src/lib/email-prompt.ts` (pure).
- New `generateEmailForLead` server fn takes `{name, business, businessType, service, tone, agencyName, niche}` and returns `{subject, body}`. Body auto-appends: `\n\nTo unsubscribe, reply "unsubscribe".`
- The single-lead page keeps working unchanged.

## 7. Files to add/change
```
src/routes/auth.tsx                              (sign-in/up)
src/routes/_authenticated/route.tsx              (managed gate — integration owns)
src/routes/_authenticated/bulk.tsx               (Bulk Campaign UI)
src/routes/api/public/hooks/campaign-tick.ts     (cron worker)
src/components/layout/Navbar.tsx                 (session-aware)
src/integrations/lovable/appUserConnector.ts
src/integrations/lovable/appUserConnectorClient.ts
src/server/connectionKeyCrypto.server.ts
src/server/appUserConnections.server.ts
src/lib/connectors.functions.ts                  (start/save/disconnect/status)
src/lib/sheets.functions.ts                      (loadLeads, updateLeadStatus)
src/lib/campaigns.functions.ts                   (create/list/get/pause/resume/cancel)
src/lib/email-prompt.ts                          (shared prompt builder)
src/lib/email.functions.ts                       (extend — add generateEmailForLead)
supabase migrations                              (tables + RLS + GRANTs)
```

## 8. Secrets & connectors
- Call `ai_gateway--create` (LOVABLE_API_KEY already present, per env).
- Call `connector_app_user--connect_client` for `google_mail` and `google_sheets`.
- Generate `APP_USER_CONNECTION_KEY_SECRET` via `secrets--generate_secret`.
- Register pg_cron job pointing at `/api/public/hooks/campaign-tick`.

## Technical notes
- Sheet ID parser accepts both raw ID and full `docs.google.com/spreadsheets/d/{id}/...` URLs.
- Gmail send builds RFC 2822 MIME manually, base64url-encoded, POST to `users/me/messages/send`.
- Sheet updates use `values/{tab}!F{rowIndex}:F` PUT with `valueInputOption=USER_ENTERED` (and similar for Status column). The row index is stored on `campaign_leads` at load time.
- All Google API calls go through `callAsAppUser` server-side; no browser calls.
- The cron worker is idempotent per lead (skips leads whose row was already `sent`/`failed`).
- Single-lead generator on `/generate` is left untouched.

## Out of scope
- Reply/bounce tracking, warm-up throttling, template library, drip sequences, opens tracking, attachments.
