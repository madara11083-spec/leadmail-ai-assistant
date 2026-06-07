import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("lm-theme", next ? "light" : "dark"); } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-surface-elevated"
      aria-label="Toggle theme"
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
