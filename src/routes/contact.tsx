import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — LeadMail AI" },
      { name: "description", content: "Questions, feedback, or feature requests? Get in touch with the LeadMail AI team." },
      { property: "og:title", content: "Contact — LeadMail AI" },
      { property: "og:description", content: "Get in touch with the LeadMail AI team." },
    ],
  }),
  component: ContactPage,
});

const Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const subject = encodeURIComponent(`LeadMail AI — message from ${parsed.data.name}`);
    const body = encodeURIComponent(`${parsed.data.message}\n\n— ${parsed.data.name} (${parsed.data.email})`);
    window.location.href = `mailto:hello@leadmail.ai?subject=${subject}&body=${body}`;
    toast.success("Opening your email client…");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground glow-red">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">Questions, feature requests, or partnership ideas — we'd love to hear from you.</p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Your name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={100}
            placeholder="Casey Morgan"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={255}
            placeholder="casey@agency.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Message</label>
          <textarea
            rows={6}
            className={`${inputCls} resize-y`}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            maxLength={1000}
            placeholder="Tell us what you'd love to see in LeadMail AI…"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:glow-red"
        >
          <Send className="h-4 w-4" /> Send message
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
