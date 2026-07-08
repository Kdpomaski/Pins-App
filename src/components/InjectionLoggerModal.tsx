import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, MapPin, Clock } from "lucide-react";
import { usePinsStore } from "@/lib/store";
import { bodySites, siteLabel } from "@/lib/body-map-data";
import type { InventoryItem } from "@/lib/store";

type InjectionLoggerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteId?: string | null;
  defaultCompoundName?: string | null;
};

function compoundsByUsage(
  inventory: InventoryItem[],
  logs: { compound: string }[],
): InventoryItem[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.compound, (counts.get(log.compound) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const unique = inventory.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });

  return unique.sort((a, b) => {
    const diff = (counts.get(b.name) ?? 0) - (counts.get(a.name) ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

export function InjectionLoggerModal({
  isOpen,
  onClose,
  defaultSiteId,
  defaultCompoundName,
}: InjectionLoggerModalProps) {
  const { data, addLog } = usePinsStore();

  const compoundOptions = useMemo(
    () => compoundsByUsage(data.inventory, data.logs),
    [data.inventory, data.logs],
  );

  const [siteId, setSiteId] = useState(defaultSiteId ?? "");
  const [compound, setCompound] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState<"mg" | "mcg">("mcg");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const quickMode = Boolean(defaultSiteId);
  const selectedSite = bodySites.find((s) => s.id === siteId);

  const lastInjectionLabel = useMemo(() => {
    if (!siteId) return null;
    const relevant = data.logs.filter((log) => {
      if (log.siteId !== siteId) return false;
      if (compound) return log.compound === compound;
      return true;
    });
    if (relevant.length === 0) return null;
    const latest = relevant.reduce((a, b) =>
      new Date(b.timestamp).getTime() > new Date(a.timestamp).getTime() ? b : a,
    );
    return format(new Date(latest.timestamp), "MMM d, yyyy");
  }, [siteId, compound, data.logs]);

  const applyCompound = (name: string) => {
    setCompound(name);
    const item = data.inventory.find((i) => i.name === name);
    if (item) {
      setUnit(item.unit);
      setDose(item.defaultDose != null ? String(item.defaultDose) : "");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSiteId(defaultSiteId ?? "");
    setNotes("");
    setError("");

    if (defaultCompoundName) {
      applyCompound(defaultCompoundName);
    } else if (compoundOptions.length === 1) {
      applyCompound(compoundOptions[0].name);
    } else if (compoundOptions.length > 0) {
      applyCompound(compoundOptions[0].name);
    } else {
      setCompound("");
      setDose("");
      setUnit("mcg");
    }
  }, [isOpen, defaultSiteId, defaultCompoundName, compoundOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompoundChange = (name: string) => {
    applyCompound(name);
  };

  const handleSave = () => {
    if (!siteId) {
      setError("Tap a location on the body map first.");
      return;
    }
    if (!compound || !dose) {
      setError("Select a compound and enter a dose.");
      return;
    }

    const doseNum = Number(dose);
    if (!Number.isFinite(doseNum) || doseNum <= 0) {
      setError("Dose must be a positive number.");
      return;
    }

    const result = addLog({
      siteId,
      compound,
      dose: doseNum,
      unit,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClose();
  };

  const canSave = Boolean(siteId && compound && dose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border rounded-t-3xl max-w-md mx-auto shadow-2xl px-5 pt-5 pb-safe"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="min-w-0 flex-1 pr-3">
                {quickMode && selectedSite ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Log injection
                    </p>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mt-1">
                      <MapPin size={22} className="text-primary shrink-0" />
                      <span className="truncate">{selectedSite.label}</span>
                    </h2>
                    <p className="text-base text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Clock size={16} className="shrink-0" />
                      {lastInjectionLabel
                        ? `Last injection: ${lastInjectionLabel}`
                        : "No prior injections here"}
                    </p>
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-foreground">Quick Log</h2>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-3 text-foreground bg-secondary/60 rounded-full shrink-0"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {!quickMode && (
              <div className="mb-5">
                <label className="text-sm font-semibold text-muted-foreground block mb-2">
                  Injection site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
                >
                  <option value="" disabled>
                    Tap body map or select site…
                  </option>
                  {bodySites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.label}
                    </option>
                  ))}
                </select>
                {!siteId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Tip: tap a spot on the body map for fastest logging.
                  </p>
                )}
              </div>
            )}

            {compoundOptions.length === 0 ? (
              <div className="mb-5 rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-base text-muted-foreground">
                  Add compounds in Inventory first.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    Compound
                  </label>
                  <select
                    value={compound}
                    onChange={(e) => handleCompoundChange(e.target.value)}
                    className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg font-medium text-foreground focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
                  >
                    {compoundOptions.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    Dose
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      className="flex-1 bg-input/50 border-2 border-border rounded-xl p-4 text-2xl font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-w-0"
                    />
                    <span className="text-lg font-bold text-muted-foreground shrink-0 w-12 text-center">
                      {unit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-2">
                    Notes <span className="font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How do you feel?"
                    className="w-full bg-input/50 border-2 border-border rounded-xl p-4 text-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-base text-destructive font-medium mb-4" role="alert">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={!canSave || compoundOptions.length === 0}
              className="w-full bg-primary text-primary-foreground font-bold text-xl rounded-2xl py-5 flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-[0.98] mb-2"
            >
              <Check size={26} strokeWidth={3} />
              Save
            </button>

            {quickMode && selectedSite && (
              <p className="text-center text-xs text-muted-foreground pb-2">
                Logging to {siteLabel(selectedSite.id)}
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}