import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Email Templates — LeadMail AI" },
      { name: "description", content: "Ready-to-use cold outreach email templates for restaurants, realtors, dentists, law firms, gyms, and more. Copy, edit, and send." },
      { property: "og:title", content: "Email Templates — LeadMail AI" },
      { property: "og:description", content: "Cold outreach email templates for local businesses." },
    ],
  }),
  component: TemplatesPage,
});

const TEMPLATES = [
  {
    tag: "Restaurant",
    business: "Tony's Pizza — Chicago, IL",
    service: "Website redesign + online ordering",
    subject: "Quick idea for Tony's Pizza online orders",
    body: `Hey Tony,

Stopped by your menu page after a friend in Lincoln Park recommended Tony's. The food looks incredible — but the online ordering page takes about 6 seconds to load on mobile, and the menu PDF won't open on iPhone.

We rebuild restaurant sites in 10 days flat with fast mobile ordering and live menu updates. Most owners we work with see a 2–3x bump in online orders within the first month.

Worth a quick 15-min call next Tuesday to walk through what we'd change?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Realtor",
    business: "Maya Patel Realty — Los Angeles, CA",
    service: "New website + local SEO",
    subject: "LA buyers searching for you — but finding Zillow",
    body: `Hi Maya,

Saw your listings in Silver Lake — beautiful staging. Quick observation: when I searched "Silver Lake realtor" on Google, your site didn't appear in the first three pages. Zillow and Redfin are eating the traffic that should be yours.

We build agent sites that rank for neighborhood + agent searches, with IDX listings baked in. Our last LA client booked 4 new buyer consults in month one.

Open to a 15-minute demo this week?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Dental Clinic",
    business: "Bright Smile Dental — Austin, TX",
    service: "New website + booking widget",
    subject: "Austin patients trying to book Bright Smile after hours",
    body: `Hi Dr. Reyes,

Came across Bright Smile through a Google Maps search for Austin family dentists. Your reviews are stellar — but your site doesn't let new patients book online. Most clinics losing this say it's their #1 missed-revenue leak.

We build dental sites with embedded booking, insurance verification, and a patient portal — usually live in two weeks. Practices we work with see 30–40% of new bookings come in outside office hours.

Free 15-min strategy call this Thursday or Friday?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Law Firm",
    business: "Goldman & Associates — New York, NY",
    service: "Website redesign + intake automation",
    subject: "NYC clients choosing faster-responding firms",
    body: `Hi Mr. Goldman,

I was researching personal injury firms in Manhattan and found Goldman & Associates. Your track record is impressive — but your contact form takes 3 clicks to reach and there's no live chat for urgent inquiries.

We specialize in law firm websites with instant intake forms, live chat, and automated appointment scheduling. Our last NYC firm client cut their lead response time from hours to under 2 minutes and saw consults double in 60 days.

Worth a brief call to discuss what we'd change?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Gym / Fitness",
    business: "IronPulse CrossFit — Miami, FL",
    service: "New website + membership portal",
    subject: "Miami athletes trying to join IronPulse online",
    body: `Hey Coach Diaz,

Found IronPulse while searching for CrossFit gyms near Brickell. Your community looks incredible — but your site still requires people to call or visit to check class schedules or start a trial.

We build fitness studio sites with real-time class booking, membership sign-ups, and progress tracking portals. Studios we work with typically see 40–50% of new members join online outside staffed hours.

Can we jump on a quick 15-min call this week?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Coffee Shop",
    business: "Roasted Roots — Portland, OR",
    service: "Website + loyalty app integration",
    subject: "Portland coffee lovers can't find Roasted Roots online",
    body: `Hey there,

Walked past your shop on Alberta last week — the roasting setup is stunning. But when I searched "specialty coffee Portland" later, Roasted Roots didn't show up on the first page. That's a lot of foot traffic and online orders going to the chains instead.

We build local coffee shop sites with built-in loyalty programs, mobile pre-ordering, and local SEO that actually ranks. Our last Portland client saw a 3x increase in online orders within 6 weeks.

Interested in a free 15-minute audit of your current setup?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Auto Repair",
    business: "Desert Valley Auto — Phoenix, AZ",
    service: "Website + online booking system",
    subject: "Phoenix drivers need Desert Valley but can't book online",
    body: `Hi there,

Found Desert Valley Auto while looking for trusted mechanics in the Ahwatukee area. Your reviews are solid — but there's no way for customers to book service appointments or get quotes from your site. Most drivers now expect to schedule everything online.

We build auto shop sites with instant online booking, service reminders, and quote requests. Shops we partner with typically fill 25–30% more bays per week just from online bookings.

Worth a quick call to see what we'd build for you?

— [Your Name]
[Your Agency]`,
  },
  {
    tag: "Salon / Spa",
    business: "Luxe Beauty Bar — Seattle, WA",
    service: "Website redesign + online booking",
    subject: "Seattle clients want to book Luxe at midnight",
    body: `Hi there,

Came across Luxe Beauty Bar on Instagram — your work is gorgeous. But when I tried to book a balayage appointment, I had to call during business hours and leave a voicemail. That's bookings walking straight to competitors with online scheduling.

We build salon sites with real-time online booking, automatic confirmations, and integrated Instagram galleries. Salons we work with see 35–45% more appointments booked outside of business hours.

Free 15-min demo this week?

— [Your Name]
[Your Agency]`,
  },
];

function TemplatesPage() {
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Email templates</h1>
        <p className="mt-3 text-muted-foreground">Ready-to-use cold outreach templates for 8 different business verticals. Copy, customize, and send.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <article key={t.business} className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/40">
            <span className="self-start rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {t.tag}
            </span>
            <h2 className="mt-3 text-lg font-semibold">{t.business}</h2>
            <p className="text-xs text-muted-foreground">Pitch: {t.service}</p>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
              <p className="mt-1 text-sm font-medium">{t.subject}</p>
              <hr className="my-3 border-border/60" />
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{t.body}</pre>
            </div>

            <button
              onClick={() => copy(`Subject: ${t.subject}\n\n${t.body}`)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-elevated"
            >
              <Copy className="h-4 w-4" /> Copy email
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
