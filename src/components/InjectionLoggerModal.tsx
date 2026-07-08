import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { usePinsStore } from "@/lib/store";
import { bodySites, sitesForView } from "@/lib/body-map-data";

type InjectionLoggerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteId?: string | null;
  defaultCompoundName?: string | null;
};

export function InjectionLoggerModal({
  isOpen,
  onClose,
  defaultSiteId,
  defaultCompoundName,
}: InjectionLoggerModalProps) {
  const { data, addLog } = usePinsStore();

  const [siteId,         setSiteId]         = useState(defaultSiteId ?? "");
  const [compound,       setCompound]       = useState("");
  const [customCompound, setCustomCompound] = useState("");
  const [dose,           setDose]           = useState("");
  const [unit,           setUnit]           = useState<"mg" | "mcg">("mcg");
  const [notes,          setNotes]          = useState("");
  const [error,          setError]          = useState("");

  const prefillFromInventoryName = (name: string) => {
    const item = data.inventory.find((i) => i.name === name);
    if (!item) return;
    setCompound(item.name);
    setUnit(item.unit);
    if (item.defaultDose != null) setDose(String(item.defaultDose));
  };

  // Reset & pre-fill each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSiteId(defaultSiteId ?? "");
    setCompound("");
    setCustomCompound("");
    setDose("");
    setNotes("");
    setError("");

    if (defaultCompoundName) {
      prefillFromInventoryName(defaultCompoundName);
    } else if (data.inventory.length === 1) {
      prefillFromInventoryName(data.inventory[0].name);
    }
  }, [isOpen, defaultSiteId, defaultCompoundName, data.inventory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompoundChange = (name: string) => {
    setCompound(name);
    // Always clear dose when switching compounds so stale values never carry over
    setDose("");
    if (name === "Custom") return;
    const item = data.inventory.find((i) => i.name === name);
    if (item) {
      setUnit(item.unit);
      // Pre-fill only if a protocol default exists — user can still override
      if (item.defaultDose != null) setDose(String(item.defaultDose));
    }
  };

  const handleSave = () => {
    if (!siteId) {
      setError("Select an injection site.");
      return;
    }
    const finalCompound = compound === "Custom" ? customCompound.trim() : compound;
    if (!finalCompound || !dose) {
      setError("Compound and dose are required.");
      return;
    }

    const doseNum = Number(dose);
    if (!Number.isFinite(doseNum) || doseNum <= 0) {
      setError("Dose must be a positive number.");
      return;
    }

    const result = addLog({
      siteId,
      compound: finalCompound,
      dose: doseNum,
      unit,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDose("");
    setNotes("");
    setError("");
    onClose();
  };

  const selectedSite = bodySites.find((s) => s.id === siteId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-w-md mx-auto shadow-2xl p-6 pb-safe"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Log Injection</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Site */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Injection Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none appearance-none"
                >
                  <option value="" disabled>Select a site…</option>
                  <optgroup label="Front">
                    {sitesForView("front").map((site) => (
                      <option key={site.id} value={site.id}>{site.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Back">
                    {sitesForView("back").map((site) => (
                      <option key={site.id} value={site.id}>{site.label}</option>
                    ))}
                  </optgroup>
                </select>
                {selectedSite && (
                  <p className="text-xs text-primary mt-1">Targeting {selectedSite.label}</p>
                )}
              </div>

              {/* Compound */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Compound</label>
                <select
                  value={compound}
                  onChange={(e) => handleCompoundChange(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none appearance-none"
                >
                  <option value="" disabled>Select compound…</option>
                  {data.inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                  <option value="Custom">Custom / Other</option>
                </select>

                {compound === "Custom" && (
                  <input
                    type="text"
                    placeholder="Enter compound name"
                    value={customCompound}
                    onChange={(e) => setCustomCompound(e.target.value)}
                    className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none mt-2"
                  />
                )}

                {/* Show the default frequency as a hint if available */}
                {compound && compound !== "Custom" && (() => {
                  const item = data.inventory.find((i) => i.name === compound);
                  return item?.frequency ? (
                    <p className="text-xs text-muted-foreground mt-1">Protocol: {item.frequency}</p>
                  ) : null;
                })()}
              </div>

              {/* Dose */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dose</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0.0"
                    step="any"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="flex-1 bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <div className="flex bg-input/50 border border-border rounded-lg p-1">
                    {(["mcg", "mg"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-4 rounded-md text-sm transition-colors ${
                          unit === u ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How do you feel?"
                  className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none h-20"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              )}

              <button
                onClick={handleSave}
                disabled={!siteId || !dose || !compound || (compound === "Custom" && !customCompound.trim())}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl p-4 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-4"
              >
                <Check size={20} />
                Save Pin
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
