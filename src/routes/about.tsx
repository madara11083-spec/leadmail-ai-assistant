import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Target, Clock, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — LeadMail AI" },
      { name: "description", content: "LeadMail AI helps web agencies write cold outreach that lands meetings. Built by people who hate generic templates." },
      { property: "og:title", content: "About — LeadMail AI" },
      { property: "og:description", content: "Built for web agencies tired of generic cold email templates." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
        Cold email shouldn't feel cold.
      </h1>
      <p className="mt-6 text-lg text-muted-foreground">
        LeadMail AI was built for the small web agency owner who spends three hours on a Sunday writing 12 emails — and gets one reply. We wanted a tool that drafts the email the way you would, if you had unlimited time and patience.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          { i: <Target className="h-5 w-5" />, t: "Personalized by default", d: "Every email references the prospect's industry, city, and the exact problem you solve." },
          { i: <Clock className="h-5 w-5" />, t: "Built for speed", d: "From blank screen to send-ready in under 30 seconds. No prompt engineering required." },
          { i: <Heart className="h-5 w-5" />, t: "Made for humans", d: "Friendly, direct, and never spammy. The kind of email you'd actually want to receive." },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-border bg-surface p-6">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{x.i}</div>
            <h2 className="mt-4 text-lg font-semibold">{x.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-surface p-8">
        <h2 className="text-2xl font-bold">Who it's for</h2>
        <p className="mt-3 text-muted-foreground">
          Freelance web designers, two-person agencies, and growing studios who pitch realtors, doctors, restaurants, law firms, and local retail. If you're tired of "Hi {`{First Name}`}, I came across your business and…" — you're in the right place.
        </p>
      </section>

      <div className="mt-12 text-center">
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground hover:opacity-90 hover:glow-red"
        >
          Generate your first email <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
