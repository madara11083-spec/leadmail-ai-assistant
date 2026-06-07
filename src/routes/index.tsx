import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap, Target, Mail, Copy, Download } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadMail AI — Cold Outreach Emails That Convert" },
      { name: "description", content: "Generate personalized cold outreach emails for realtors, doctors, restaurants, and local businesses in seconds. Built for web agencies." },
      { property: "og:title", content: "LeadMail AI — Cold Outreach Emails That Convert" },
      { property: "og:description", content: "Generate personalized cold outreach emails for local businesses in seconds." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              AI-powered cold outreach for web agencies
            </span>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
              Cold emails that
              <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                actually get replies.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Generate personalized outreach emails for realtors, doctors, restaurants, and local businesses — in seconds. No templates. No fluff.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:glow-red"
              >
                Generate your first email
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/examples"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 font-semibold text-foreground transition-colors hover:bg-surface-elevated"
              >
                View templates
              </Link>
            </div>
          </div>

          {/* Mock preview */}
          <div className="mx-auto mt-16 max-w-3xl animate-fade-up">
            <div className="rounded-2xl border border-border bg-surface p-2 shadow-elegant">
              <div className="rounded-xl bg-background p-6">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Subject: Quick idea for {`{Joe's Pizza}`} in Chicago
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  Hey Joe — noticed your spot on Clark Street is packed every Friday but your online ordering page loads slow on mobile. We help neighborhood restaurants like yours rebuild their site in 10 days flat, usually with a 2–3x bump in online orders. Worth a 15-min chat next week?
                </p>
                <p className="mt-4 text-sm text-muted-foreground">— Casey, Crestview Web</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to land more clients
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Feature
              icon={<Target className="h-5 w-5" />}
              title="Hyper-personalized"
              text="Every email references the prospect's business type, city, and the exact service you're pitching."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Generated in seconds"
              text="Skip the blank page. Get a polished draft, three subject lines, and a clear CTA — instantly."
            />
            <Feature
              icon={<Mail className="h-5 w-5" />}
              title="Built for agencies"
              text="Pitch new websites, redesigns, SEO bundles, or anything else. Adjust tone from casual to corporate."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Three steps. One reply-worthy email.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Describe the prospect", d: "Business type, name, city, and what you want to pitch." },
            { n: "02", t: "Pick your tone", d: "Slide from casual to corporate. We'll match the vibe." },
            { n: "03", t: "Copy, edit, send", d: "Copy to clipboard or download as .txt / .doc. CRM-ready." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-surface p-6">
              <span className="text-sm font-bold text-primary">{s.n}</span>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-8 text-center">
          <div className="flex-1 min-w-[240px] text-left">
            <h3 className="text-2xl font-bold">Ready to fill your pipeline?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Generate your first email — no signup required.</p>
          </div>
          <Link
            to="/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 hover:glow-red"
          >
            Start generating <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 text-center sm:grid-cols-3">
          {[
            { i: <Copy className="h-4 w-4" />, t: "One-click copy" },
            { i: <Download className="h-4 w-4" />, t: ".txt & .doc export" },
            { i: <Sparkles className="h-4 w-4" />, t: "Saved history (local)" },
          ].map((x) => (
            <div key={x.t} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">{x.i}</span> {x.t}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/40 hover:bg-surface-elevated">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
