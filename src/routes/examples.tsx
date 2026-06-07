import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/examples")({
  head: () => ({
    meta: [
      { title: "Example Cold Emails — LeadMail AI" },
      { name: "description", content: "Real cold outreach email samples for restaurants, realtors, and dental clinics. See the format before you generate your own." },
      { property: "og:title", content: "Example Cold Emails — LeadMail AI" },
      { property: "og:description", content: "Sample cold outreach emails for local businesses." },
    ],
  }),
  component: ExamplesPage,
});

const EXAMPLES = [
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
];

function ExamplesPage() {
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Example emails</h1>
        <p className="mt-3 text-muted-foreground">Real samples generated for three different verticals. Use them as inspiration — or copy and adapt.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {EXAMPLES.map((e) => (
          <article key={e.business} className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/40">
            <span className="self-start rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {e.tag}
            </span>
            <h2 className="mt-3 text-lg font-semibold">{e.business}</h2>
            <p className="text-xs text-muted-foreground">Pitch: {e.service}</p>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
              <p className="mt-1 text-sm font-medium">{e.subject}</p>
              <hr className="my-3 border-border/60" />
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{e.body}</pre>
            </div>

            <button
              onClick={() => copy(`Subject: ${e.subject}\n\n${e.body}`)}
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
