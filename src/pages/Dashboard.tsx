import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { Flame, Syringe, Droplets, Droplet, Calculator, Shield } from "lucide-react";
import { Link } from "wouter";
import { usePinsStore } from "@/lib/store";
import { SecurityBadge, SecuritySettings } from "@/components/SecuritySettings";

// ── Brand logo matching the uploaded Pins identity ────────────────────────────
function PinsLogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 46" fill="none" aria-hidden="true">
      {/* Hexagon shell */}
      <polygon
        points="20,2 36.8,11.5 36.8,34.5 20,44 3.2,34.5 3.2,11.5"
        fill="black"
        stroke="#E85D04"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* P letter — vertical bar */}
      <rect x="12" y="11" width="3.5" height="23" rx="0.4" fill="white" />
      {/* P bowl fill */}
      <path d="M 15.5,11 C 15.5,11 28,11 28,18.5 C 28,26 15.5,26 15.5,26 Z" fill="white" />
      {/* P bowl cutout (black background matches hexagon) */}
      <path d="M 16.5,13.5 C 16.5,13.5 25,13.5 25,18.5 C 25,23.5 16.5,23.5 16.5,23.5 Z" fill="black" />
      {/* Needle / syringe stem extending from base of P */}
      <path d="M 13,32 L 16.5,32 L 14.75,42 Z" fill="white" />
      {/* Needle tip dot */}
      <circle cx="14.75" cy="43" r="1.4" fill="#E85D04" />
    </svg>
  );
}

function PinsHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <PinsLogoIcon size={38} />
      <div className="leading-none">
        <div className="flex items-baseline gap-[1px]">
          <span className="text-[22px] font-black text-foreground tracking-tight leading-none">P</span>
          <span className="text-[22px] font-black tracking-tight leading-none" style={{ color: "#E85D04" }}>i</span>
          <span className="text-[22px] font-black text-foreground tracking-tight leading-none">n</span>
          <span className="text-[22px] font-black text-foreground tracking-tight leading-none">s</span>
        </div>
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">
          visual protocol tracker
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data } = usePinsStore();
  const [securityOpen, setSecurityOpen] = useState(false);

  const todayStr   = format(new Date(), "EEEE");
  const todayIndex = new Date().getDay();

  const calculateStreak = () => {
    const uniqueDays = new Set(data.logs.map((l) => format(new Date(l.timestamp), "yyyy-MM-dd")));
    let streak = 0;
    let d = new Date();
    while (uniqueDays.has(format(d, "yyyy-MM-dd"))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    if (streak === 0) {
      d = new Date();
      d.setDate(d.getDate() - 1);
      while (uniqueDays.has(format(d, "yyyy-MM-dd"))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
    }
    return streak;
  };

  const streak      = calculateStreak();
  const todaysDoses = data.schedule.filter((s) => s.active && s.days.includes(todayIndex));
  const todaysLogs  = data.logs.filter(
    (l) => format(new Date(l.timestamp), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );
  const recentLogs   = data.logs.slice(0, 5);
  const lowInventory = data.inventory.filter((i) => i.remainingVolume / i.totalVolume < 0.2);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-8">

        {/* Header — Pins brand logo */}
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <PinsHeader />
            <SecurityBadge />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSecurityOpen(true)}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Security settings"
            >
              <Shield size={18} />
            </button>
            <Link
              href="/calculator"
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Dose calculator"
            >
              <Calculator size={18} />
            </Link>
          </div>
        </header>

        <SecuritySettings open={securityOpen} onClose={() => setSecurityOpen(false)} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm font-medium uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-4xl font-bold font-mono">
              {streak} <span className="text-sm font-sans text-muted-foreground font-normal">days</span>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Syringe size={16} className="text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider">Today</span>
            </div>
            <div className="text-4xl font-bold font-mono">
              {todaysLogs.length} <span className="text-sm font-sans text-muted-foreground font-normal">pins</span>
            </div>
          </div>
        </div>

        {/* Today's Protocol */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-semibold">Today's Protocol</h2>
            <span className="text-sm text-muted-foreground">{todayStr}</span>
          </div>

          {todaysDoses.length === 0 ? (
            <div className="bg-card/50 border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              No doses scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todaysDoses.map((dose) => {
                const isLogged    = todaysLogs.some((l) => l.compound === dose.compound);
                const compoundData = data.inventory.find((i) => i.name === dose.compound);
                return (
                  <div key={dose.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border relative">
                        <div className="absolute inset-0 rounded-full opacity-20 blur-md"
                          style={{ backgroundColor: compoundData?.color ?? "var(--color-primary)" }} />
                        <Droplet size={20} style={{ color: compoundData?.color ?? "var(--color-primary)" }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {dose.compound}
                          {isLogged && (
                            <span className="text-[10px] bg-green-100 text-green-700 border border-border px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Done
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {dose.dose} {dose.unit} at {dose.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Low Inventory Warning */}
        {lowInventory.length > 0 && (
          <section>
            <div className="bg-red-50 border border-border rounded-xl p-4 flex gap-3 items-start">
              <Droplets className="text-red-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-red-700">Low Inventory</h3>
                <p className="text-sm text-red-600/80 mt-1">
                  {lowInventory.map((i) => i.name).join(", ")} running low.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Recent Injections */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Injections</h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No injections logged yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const compoundData = data.inventory.find((i) => i.name === log.compound);
                const hoursAgo = differenceInHours(new Date(), new Date(log.timestamp));
                const timeStr  = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
                // Build human-readable site label from ID (replace all hyphens)
                const siteLabel = log.siteId.replace(/-/g, " ");

                return (
                  <div key={log.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: compoundData?.color ?? "var(--color-primary)",
                        boxShadow: `0 0 8px ${(compoundData?.color ?? "#fff")}80`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-foreground">{log.compound}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{timeStr}</span>
                      </div>
                      <div className="flex justify-between items-baseline text-sm text-muted-foreground">
                        <span className="capitalize truncate">{siteLabel}</span>
                        <span className="ml-2 flex-shrink-0">{log.dose} {log.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
