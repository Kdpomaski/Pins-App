import type { ElementType } from "react";
import { Link, useLocation } from "wouter";
import { Map, Calendar, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ onOpenLogModal }: { onOpenLogModal: () => void }) {
  const [location] = useLocation();

  const links = [
    { href: "/", icon: Map, label: "Map" },
    { href: "/calendar", icon: Calendar, label: "Schedule" },
    { href: "/inventory", icon: Package, label: "Inventory" },
  ];

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
      <div className="flex items-center justify-between h-[4.5rem] max-w-md mx-auto w-full px-1">
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
    </nav>
  );
}