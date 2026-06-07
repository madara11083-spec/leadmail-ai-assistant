
## LeadMail AI — Build Plan

A sleek, dark-themed marketing/utility app for web agencies to generate cold outreach emails to local businesses, with real AI generation, editable preview, and downloads.

### Defaults I'm choosing
- **AI**: Lovable Cloud + Lovable AI Gateway (`google/gemini-3-flash-preview`) — high quality, no API key setup.
- **Auth**: Skipped. Generated emails persist to `localStorage` (history list on the Generate page).
- **Bonus**: Tone slider + light/dark toggle + CRM placeholder buttons. No login.

### Design system
- Background `#0D0D0D`, surfaces slightly lighter, red accent (`oklch` red ~ `#E11D2E`), white text, muted grey secondary.
- Font: Inter (display + body) loaded via `<link>` in `__root.tsx`.
- Rounded-xl corners, soft shadows with red glow on primary CTAs, subtle Framer Motion fade/slide on section mount and button hover.
- Tokens defined in `src/styles.css` under `@theme` + `:root` / `.dark` (default `.dark` applied to `<html>`; toggle removes it for light mode).
- Mobile-first responsive; sticky top nav with logo + links.

### Routes (TanStack Start, file-based)
```
src/routes/
  __root.tsx         shared nav + footer + theme provider + Inter <link>
  index.tsx          / Home — hero, value props, CTA → /generate
  generate.tsx       /generate — form + AI output + history
  examples.tsx       /examples — 3 pre-made templates
  about.tsx          /about — agency-facing pitch
  contact.tsx        /contact — simple validated form (mailto submit)
```
Each route gets unique `head()` meta (title, description, og:*).

### Components
- `components/layout/Navbar.tsx`, `Footer.tsx`, `ThemeToggle.tsx`
- `components/generate/LeadForm.tsx` — fields: business type (Select: Realtor, Doctor/Clinic, Restaurant, Retail, Law Firm, Other+freeform), business name, location, service to pitch (Select + custom), tone slider (1–5: Casual → Corporate).
- `components/generate/EmailPreview.tsx` — editable subject + body textareas, Copy, Download .txt, Download .doc, "Send to CRM" placeholder dropdown (HubSpot/Salesforce/Pipedrive — toast "Coming soon").
- `components/generate/HistoryList.tsx` — last 10 saved emails from localStorage.
- `components/examples/ExampleCard.tsx` — pizza/Chicago, realtor/LA, dental/Austin.

### Server function — AI email generation
`src/lib/email.functions.ts`:
- `generateEmail` (`createServerFn` POST) with Zod validation on `{ businessType, businessName, location, service, tone }`.
- Calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `google/gemini-3-flash-preview`, structured tool-calling to return `{ subjectLines: string[3], body: string }`.
- Handles 429 (rate limit) and 402 (credits) with user-friendly toast errors.

### Generation prompt logic
- System prompt enforces: friendly-professional tone scaled by slider, 3 short punchy subject lines, personalized opener referencing business type + location, clear value prop tied to chosen service, single CTA for free consultation/demo, signature placeholder `[Your Name] — [Your Agency]`.

### Examples page
Three hardcoded sample emails rendered as cards with Copy button — pizza/Chicago, realtor/LA, dental/Austin.

### Technical details
- Enable Lovable Cloud (required for AI Gateway + `LOVABLE_API_KEY`).
- `framer-motion` for transitions (already common; install if missing).
- Theme toggle: small hook persisting to `localStorage`, toggles `.dark` on `<html>`. Default dark.
- Validation: Zod on client (react-hook-form) and server.
- SEO: per-route `head()`, single H1 per page, semantic HTML, alt text.

### Out of scope (v1)
User accounts, real CRM integration, actual email sending, payment.

### Acceptance
- All 5 routes render with unique meta and consistent dark UI.
- Form generates a real AI email; subject + body editable; Copy / .txt / .doc work.
- Examples page shows 3 templates. About + Contact present. Mobile-responsive. Light/dark toggle works.
