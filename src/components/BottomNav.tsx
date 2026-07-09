import { useEffect, useRef, type ElementType } from "react";
import { Link, useLocation } from "wouter";
import { Map, Calendar, Package, Plus, Calculator, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ onOpenLogModal }: { onOpenLogModal: () => void }) {
  const [location] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", icon: Map, label: "Map" },
    { href: "/calendar", icon: Calendar, label: "Schedule" },
    { href: "/inventory", icon: Package, label: "Inventory" },
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (location === "/calculator") {
      el.scrollTo({ left: el.clientWidth, behavior: "smooth" });
    } else {
      el.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [location]);

  const renderLink = (link: { href: string; icon: ElementType; label: string }) => {
    const isActive = location === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors min-h-[56px]",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <link.icon size={24} className={cn(isActive && "stroke-[2.5px]")} />
        <span className="text-xs font-semibold">{link.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-border shadow-[0_-2px_8px_rgba(75,83,32,0.08)] pb-safe">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-[4.5rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Main nav — swipe right for calculator */}
        <div className="relative min-w-full shrink-0 snap-start flex items-center justify-center px-1">
          <div className="flex items-center justify-between h-full w-full max-w-md">
            <button
              data-testid="button-open-log-modal"
              onClick={onOpenLogModal}
              className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] transition-transform active:scale-95"
              aria-label="Quick log injection"
            >
              <span className="w-12 h-12 bg-primary text-primary-foreground border-2 border-border rounded-full flex items-center justify-center shadow-md shadow-primary/25">
                <Plus size={28} strokeWidth={2.5} />
              </span>
            </button>
            {links.map(renderLink)}
          </div>
          <div
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-muted-foreground/60"
            aria-hidden
          >
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Calculator slide */}
        <div className="min-w-full shrink-0 snap-start flex items-center justify-center px-4">
          <Link
            href="/calculator"
            className={cn(
              "flex flex-col items-center justify-center gap-2 min-h-[56px] min-w-[120px] px-8 py-2 rounded-2xl border-2 transition-colors",
              location === "/calculator"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            <Calculator size={28} className={cn(location === "/calculator" && "stroke-[2.5px]")} />
            <span className="text-sm font-semibold">Calculator</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}