import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-4 w-4" />
          </span>
          <div>
            <p className="font-bold">LeadMail <span className="text-primary">AI</span></p>
            <p className="text-xs text-muted-foreground">Cold outreach, warm replies.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/generate" className="hover:text-foreground">Generate</Link>
          <Link to="/examples" className="hover:text-foreground">Examples</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} LeadMail AI</p>
      </div>
    </footer>
  );
}
