import type { ElementType } from "react";
import { Link, useLocation } from "wouter";
import { Map, Calendar, Package, Plus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ onOpenLogModal }: { onOpenLogModal: () => void }) {
  const [location] = useLocation();

  const links: { href: string; icon: ElementType; label: string }[] = [
    { href: "/", icon: Map, label: "Map" },
    { href: "/calendar", icon: Calendar, label: "Schedule" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/calculator", icon: Calculator, label: "Recon" },
  ];

  const renderLink = (link: { href: string; icon: ElementType; label: string }) => {
    const isActive = location === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors min-h-[56px] min-w-0",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <link.icon size={22} className={cn(isActive && "stroke-[2.5px]")} />
        <span className="text-[10px] font-semibold truncate max-w-full px-0.5">{link.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-border shadow-[0_-2px_8px_rgba(75,83,32,0.08)] pb-safe"
      style={{ paddingBottom: 'var(--pins-safe-bottom, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-between h-[4.5rem] w-full max-w-md mx-auto px-1">
        <button
          data-testid="button-open-log-modal"
          onClick={onOpenLogModal}
          className="flex flex-col items-center justify-center gap-0.5 min-h-[56px] w-14 shrink-0 transition-transform active:scale-95"
          aria-label="Quick log injection"
        >
          <span className="w-11 h-11 bg-primary text-primary-foreground border-2 border-border rounded-full flex items-center justify-center shadow-md shadow-primary/25">
            <Plus size={26} strokeWidth={2.5} />
          </span>
        </button>
        {links.map(renderLink)}
      </div>
    </nav>
  );
}
