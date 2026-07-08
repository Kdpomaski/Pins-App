import { useMemo, useState } from "react";
import { Plus, X, Droplet, Info, ChevronDown, Check, Pencil, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { usePinsStore, InventoryItem } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FREQ_OPTIONS = ["Daily", "2x/day", "Every other day", "3x/week", "2x/week", "Weekly", "Bi-weekly", "Monthly"];

function groupInventoryByCompound(items: InventoryItem[]) {
  const groups = new Map<string, InventoryItem[]>();
  for (const item of items) {
    const list = groups.get(item.name) ?? [];
    list.push(item);
    groups.set(item.name, list);
  }
  return Array.from(groups.entries());
}

function formatReconstitutedDate(iso?: string) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return null;
  }
}

export default function Inventory() {
  const { data, addInventoryItem, deleteInventoryItem } = usePinsStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<InventoryItem | null>(null);

  const compoundGroups = useMemo(
    () => groupInventoryByCompound(data.inventory),
    [data.inventory],
  );

  const pendingScheduleCount = pendingDelete
    ? data.schedule.filter((dose) => dose.compound === pendingDelete.name).length
    : 0;

  const isLastVialOfCompound = pendingDelete
    ? data.inventory.filter((v) => v.name === pendingDelete.name).length === 1
    : false;

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteInventoryItem(pendingDelete.id);
    setPendingDelete(null);
  };

  const handleAddVialToCompound = (template: InventoryItem) => {
    addInventoryItem({
      name: template.name,
      concentration: template.concentration,
      totalVolume: template.totalVolume,
      remainingVolume: template.totalVolume,
      unit: template.unit,
      color: template.color,
      frequency: template.frequency,
      defaultDose: template.defaultDose,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">

        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Plus size={20} />
          </button>
        </header>

        <div className="grid gap-4">
          {data.inventory.length === 0 ? (
            <div className="text-center p-8 bg-card rounded-2xl border border-border mt-4">
              <Droplet size={40} className="mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Your inventory is empty.</p>
              <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-primary font-medium">
                Add your first vial
              </button>
            </div>
          ) : (
            compoundGroups.map(([name, vials]) => (
              <CompoundGroupCard
                key={name}
                vials={vials}
                onAddVial={() => handleAddVialToCompound(vials[0])}
                onDeleteVial={setPendingDelete}
              />
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddInventoryModal onClose={() => setIsAddModalOpen(false)} onAdd={addInventoryItem} />
        )}
      </AnimatePresence>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.name} vial?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes this vial from your inventory
              {isLastVialOfCompound && pendingScheduleCount > 0
                ? ` and deletes ${pendingScheduleCount} scheduled dose${pendingScheduleCount === 1 ? "" : "s"} for this compound.`
                : "."}
              {" "}Past injection logs are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CompoundGroupCard({
  vials,
  onAddVial,
  onDeleteVial,
}: {
  vials: InventoryItem[];
  onAddVial: () => void;
  onDeleteVial: (item: InventoryItem) => void;
}) {
  const [extraVialsExpanded, setExtraVialsExpanded] = useState(false);
  const count = vials.length;
  const [primary, ...extraVials] = vials;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <VialCard
        key={primary.id}
        item={primary}
        showCompoundHeader
        vialIndex={1}
        compoundCount={count}
        onAddVial={onAddVial}
        onDelete={() => onDeleteVial(primary)}
        isLast={count === 1 || !extraVialsExpanded}
        chevronExpandsExtraVials={count > 1}
        extraVialsExpanded={extraVialsExpanded}
        onToggleExtraVials={() => setExtraVialsExpanded((v) => !v)}
      />

      <AnimatePresence initial={false}>
        {extraVialsExpanded &&
          extraVials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <VialCard
                item={item}
                showCompoundHeader={false}
                vialIndex={index + 2}
                compoundCount={count}
                onAddVial={onAddVial}
                onDelete={() => onDeleteVial(item)}
                isLast={index === extraVials.length - 1}
                isAdditionalVial
              />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

function VialCard({
  item,
  showCompoundHeader,
  vialIndex,
  compoundCount,
  onAddVial,
  onDelete,
  isLast,
  isAdditionalVial = false,
  chevronExpandsExtraVials = false,
  extraVialsExpanded = false,
  onToggleExtraVials,
}: {
  item: InventoryItem;
  showCompoundHeader: boolean;
  vialIndex: number;
  compoundCount: number;
  onAddVial: () => void;
  onDelete: () => void;
  isLast: boolean;
  isAdditionalVial?: boolean;
  chevronExpandsExtraVials?: boolean;
  extraVialsExpanded?: boolean;
  onToggleExtraVials?: () => void;
}) {
  const { updateInventory } = usePinsStore();
  const [protocolExpanded, setProtocolExpanded] = useState(false);
  const [editingFreq, setEditingFreq] = useState(false);
  const [editingDose, setEditingDose] = useState(false);
  const [freqDraft, setFreqDraft] = useState(item.frequency ?? "");
  const [doseDraft, setDoseDraft] = useState(item.defaultDose != null ? String(item.defaultDose) : "");

  const percent = Math.max(0, Math.min(100, (item.remainingVolume / item.totalVolume) * 100));
  const isLow = percent < 20;
  const reconstitutedLabel = formatReconstitutedDate(item.reconstitutedAt);

  const saveFreq = () => {
    updateInventory(item.id, { frequency: freqDraft.trim() || undefined });
    setEditingFreq(false);
  };

  const saveDose = () => {
    const val = parseFloat(doseDraft);
    updateInventory(item.id, { defaultDose: isNaN(val) ? undefined : val });
    setEditingDose(false);
  };

  const handleReconstitute = () => {
    updateInventory(item.id, { reconstitutedAt: new Date().toISOString() });
  };

  const handleChevronClick = () => {
    if (chevronExpandsExtraVials && onToggleExtraVials) {
      onToggleExtraVials();
    } else {
      setProtocolExpanded((v) => !v);
    }
  };

  const chevronOpen = chevronExpandsExtraVials ? extraVialsExpanded : protocolExpanded;
  const showReconstituteButton = isAdditionalVial && !item.reconstitutedAt;

  return (
    <div className={`relative ${!isLast ? "border-b border-border" : ""}`}>
      <div className="p-5 relative">
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none"
          style={{ backgroundColor: item.color }}
        />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {showCompoundHeader ? (
              <div
                className="w-4 h-4 rounded-full border-2 border-background shadow-sm shrink-0 mt-1"
                style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }}
              />
            ) : (
              <div className="w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              {showCompoundHeader ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <span className="text-sm font-mono text-muted-foreground bg-background/60 border border-border rounded-full px-2.5 py-0.5">
                    {compoundCount}
                  </span>
                  <button
                    onClick={onAddVial}
                    className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                    aria-label={`Add another ${item.name} vial`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vial {vialIndex}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.concentration} {item.unit}/ml
              </p>
              {isAdditionalVial ? (
                reconstitutedLabel ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reconstituted {reconstitutedLabel}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 font-medium mt-0.5">
                    Not reconstituted yet
                  </p>
                )
              ) : (
                reconstitutedLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reconstituted {reconstitutedLabel}
                  </p>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleChevronClick}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
              aria-label={
                chevronExpandsExtraVials
                  ? extraVialsExpanded
                    ? "Hide additional vials"
                    : `Show ${compoundCount - 1} more vial${compoundCount - 1 === 1 ? "" : "s"}`
                  : "Edit protocol"
              }
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${chevronOpen ? "rotate-180" : ""}`}
              />
            </button>
            <button
              onClick={onDelete}
              className="text-foreground hover:text-destructive transition-colors p-1"
              aria-label="Delete vial"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {showReconstituteButton && (
          <button
            type="button"
            onClick={handleReconstitute}
            className="relative z-10 w-full mb-3 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border-2 border-amber-500/60 bg-amber-50 text-amber-900 font-semibold text-sm hover:bg-amber-100 active:scale-[0.98] transition-all"
          >
            <FlaskConical size={16} />
            Mark as Reconstituted
          </button>
        )}

        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Volume</span>
            <span className={`font-mono ${isLow ? "text-red-600 font-bold" : ""}`}>
              {item.remainingVolume.toFixed(2)} / {item.totalVolume} ml
            </span>
          </div>
          <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-red-500" : ""}`}
              style={{ width: `${percent}%`, backgroundColor: !isLow ? item.color : undefined }}
            />
          </div>
        </div>

        {!protocolExpanded && (item.frequency || item.defaultDose != null) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 relative z-10">
            {item.frequency && (
              <span className="text-xs text-muted-foreground bg-background/60 border border-border rounded-full px-3 py-1">
                {item.frequency}
              </span>
            )}
            {item.defaultDose != null && (
              <span className="text-xs text-muted-foreground bg-background/60 border border-border rounded-full px-3 py-1">
                {item.defaultDose} {item.unit}/dose
              </span>
            )}
          </div>
        )}

        {chevronExpandsExtraVials && !extraVialsExpanded && compoundCount > 1 && (
          <button
            type="button"
            onClick={onToggleExtraVials}
            className="mt-3 text-sm text-primary font-medium relative z-10"
          >
            +{compoundCount - 1} more vial{compoundCount - 1 === 1 ? "" : "s"} — tap arrow to expand
          </button>
        )}

        {chevronExpandsExtraVials && (
          <button
            type="button"
            onClick={() => setProtocolExpanded((v) => !v)}
            className="mt-3 text-sm text-muted-foreground hover:text-primary font-medium relative z-10"
          >
            {protocolExpanded ? "Hide protocol" : "Edit protocol"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {protocolExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-5 py-4 space-y-4 bg-background/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protocol</p>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm text-muted-foreground">Frequency</label>
                  {!editingFreq && (
                    <button onClick={() => setEditingFreq(true)} className="text-primary/70 hover:text-primary">
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
                {editingFreq ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      type="text"
                      value={freqDraft}
                      onChange={(e) => setFreqDraft(e.target.value)}
                      placeholder="e.g. 2x/week"
                      className="w-full bg-input/50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && saveFreq()}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {FREQ_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => { setFreqDraft(f); updateInventory(item.id, { frequency: f }); setEditingFreq(false); }}
                          className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-primary hover:text-primary transition-colors"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <button onClick={saveFreq} className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Check size={12} /> Save
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-foreground font-medium">
                    {item.frequency ?? <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm text-muted-foreground">Default Dose</label>
                  {!editingDose && (
                    <button onClick={() => setEditingDose(true)} className="text-primary/70 hover:text-primary">
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
                {editingDose ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="number"
                      step="any"
                      value={doseDraft}
                      onChange={(e) => setDoseDraft(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-input/50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && saveDose()}
                    />
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                    <button onClick={saveDose} className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Check size={12} /> Save
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-foreground font-medium">
                    {item.defaultDose != null
                      ? `${item.defaultDose} ${item.unit}`
                      : <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddInventoryModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: Omit<InventoryItem, "id" | "updatedAt">) => { ok: true } | { ok: false; error: string };
}) {
  const { data } = usePinsStore();
  const [name, setName] = useState("");
  const [concentration, setConcentration] = useState("");
  const [totalVolume, setTotalVolume] = useState("");
  const [unit, setUnit] = useState<"mg" | "mcg">("mg");
  const [color, setColor] = useState("#3b82f6");
  const [frequency, setFrequency] = useState("");
  const [defaultDose, setDefaultDose] = useState("");
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [error, setError] = useState("");

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  const handleSave = () => {
    if (!name || !concentration || !totalVolume) {
      setError("Compound name, concentration, and volume are required.");
      return;
    }

    const conc = Number(concentration);
    const vol = Number(totalVolume);
    if (!Number.isFinite(conc) || conc <= 0 || !Number.isFinite(vol) || vol <= 0) {
      setError("Concentration and volume must be positive numbers.");
      return;
    }

    const doseVal = defaultDose ? Number(defaultDose) : undefined;
    if (defaultDose && (!Number.isFinite(doseVal!) || doseVal! <= 0)) {
      setError("Default dose must be a positive number.");
      return;
    }

    const trimmedName = name.trim();
    const isNewCompound = !data.inventory.some(
      (v) => v.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    const result = onAdd({
      name: trimmedName,
      concentration: conc,
      totalVolume: vol,
      remainingVolume: vol,
      unit,
      color,
      frequency: frequency.trim() || undefined,
      defaultDose: doseVal,
      reconstitutedAt: isNewCompound ? new Date().toISOString() : undefined,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-w-md mx-auto shadow-2xl p-6 pb-safe h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-card z-10 pt-2 pb-4">
          <h2 className="text-xl font-semibold">Add Vial</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground bg-secondary/50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Compound Name</label>
            <input
              type="text"
              placeholder="e.g. BPC-157"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Concentration <Info size={12} />
              </label>
              <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                <input
                  type="number" placeholder="0.0" step="any"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  className="w-full bg-input/50 p-3 text-foreground outline-none min-w-0"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "mg" | "mcg")}
                  className="bg-secondary px-2 text-sm text-muted-foreground border-l border-border outline-none"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Volume (ml)</label>
              <input
                type="number" placeholder="e.g. 2" step="any"
                value={totalVolume}
                onChange={(e) => setTotalVolume(e.target.value)}
                className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-3">
            New compounds are marked reconstituted when added. Extra vials (via <span className="font-semibold text-foreground">+</span>) stay unreconstituted until you tap <span className="font-semibold text-foreground">Mark as Reconstituted</span>.
          </p>

          <div className="space-y-4 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protocol (optional)</p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Frequency</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Daily, 2x/week…"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  onFocus={() => setShowFreqPicker(true)}
                  onBlur={() => setTimeout(() => setShowFreqPicker(false), 150)}
                  className="w-full bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <AnimatePresence>
                  {showFreqPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 p-2 flex flex-wrap gap-1.5"
                    >
                      {FREQ_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onMouseDown={() => setFrequency(f)}
                          className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-primary hover:text-primary transition-colors"
                        >
                          {f}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Default Dose per Injection
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number" placeholder="0.0" step="any"
                  value={defaultDose}
                  onChange={(e) => setDefaultDose(e.target.value)}
                  className="flex-1 bg-input/50 border border-border rounded-lg p-3 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <span className="text-sm text-muted-foreground font-medium">{unit}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marker Color</label>
            <div className="flex flex-wrap gap-3 p-2 bg-input/30 rounded-xl border border-border">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={!name || !concentration || !totalVolume}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-xl p-4 mt-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Add to Inventory
          </button>
        </div>
      </motion.div>
    </>
  );
}