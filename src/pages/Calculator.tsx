import { useState } from "react";
import { Calculator as CalcIcon, FlaskConical, Syringe } from "lucide-react";

export default function Calculator() {
  const [vialQuantity, setVialQuantity] = useState("5");
  const [vialUnit, setVialUnit] = useState<"mg" | "mcg">("mg");
  
  const [bacWater, setBacWater] = useState("2");
  
  const [desiredDose, setDesiredDose] = useState("250");
  const [desiredUnit, setDesiredUnit] = useState<"mg" | "mcg">("mcg");

  const [syringeSize, setSyringeSize] = useState("100"); // 100 IU = 1ml (U-100)

  // Calculate
  const calculate = () => {
    const qty = Number(vialQuantity) || 0;
    const water = Number(bacWater) || 0;
    const dose = Number(desiredDose) || 0;

    if (!qty || !water || !dose) return null;

    // Convert everything to mcg for internal calc to avoid decimals
    const totalMcg = vialUnit === "mg" ? qty * 1000 : qty;
    const doseMcg = desiredUnit === "mg" ? dose * 1000 : dose;
    
    const mcgPerMl = totalMcg / water; // concentration
    const injectionVolumeMl = doseMcg / mcgPerMl;
    
    // U-100 syringe: 1ml = 100 IU ("units" on syringe)
    // U-40 syringe: 1ml = 40 IU
    const unitsPerMl = Number(syringeSize);
    const syringeUnits = injectionVolumeMl * unitsPerMl;

    const totalDoses = totalMcg / doseMcg;

    return {
      concentration: `${(mcgPerMl > 1000 ? mcgPerMl/1000 : mcgPerMl).toFixed(2)} ${mcgPerMl > 1000 ? 'mg' : 'mcg'}/ml`,
      volumeMl: injectionVolumeMl.toFixed(3),
      units: syringeUnits.toFixed(1),
      doses: Math.floor(totalDoses)
    };
  };

  const result = calculate();

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-8">
        
        <header className="flex items-center gap-2 mb-6">
          <CalcIcon className="text-primary" size={24} />
          <h1 className="text-2xl font-bold tracking-tight">Recon Calculator</h1>
        </header>

        <div className="space-y-6">
          
          {/* Step 1 */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-lg">
              <FlaskConical size={18} className="text-muted-foreground" />
              1. The Vial
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Compound Amount</label>
                <div className="flex border border-border rounded-lg overflow-hidden bg-input/30">
                  <input
                    type="number"
                    value={vialQuantity}
                    onChange={(e) => setVialQuantity(e.target.value)}
                    className="w-full bg-transparent p-3 text-foreground outline-none"
                    placeholder="e.g. 5"
                  />
                  <select 
                    value={vialUnit}
                    onChange={(e) => setVialUnit(e.target.value as "mg"|"mcg")}
                    className="bg-secondary px-2 text-sm text-muted-foreground border-l border-border outline-none"
                  >
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">BAC Water added</label>
                <div className="flex border border-border rounded-lg overflow-hidden bg-input/30">
                  <input
                    type="number"
                    value={bacWater}
                    onChange={(e) => setBacWater(e.target.value)}
                    className="w-full bg-transparent p-3 text-foreground outline-none"
                    placeholder="e.g. 2"
                  />
                  <div className="flex items-center px-3 bg-secondary text-sm text-muted-foreground border-l border-border">
                    ml
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-lg">
              <Syringe size={18} className="text-muted-foreground" />
              2. The Dose
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Desired Dose</label>
                <div className="flex border border-border rounded-lg overflow-hidden bg-input/30">
                  <input
                    type="number"
                    value={desiredDose}
                    onChange={(e) => setDesiredDose(e.target.value)}
                    className="w-full bg-transparent p-3 text-foreground outline-none"
                    placeholder="e.g. 250"
                  />
                  <select 
                    value={desiredUnit}
                    onChange={(e) => setDesiredUnit(e.target.value as "mg"|"mcg")}
                    className="bg-secondary px-2 text-sm text-muted-foreground border-l border-border outline-none"
                  >
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Syringe Type</label>
                <select 
                  value={syringeSize}
                  onChange={(e) => setSyringeSize(e.target.value)}
                  className="w-full bg-input/30 border border-border rounded-lg p-3.5 text-foreground outline-none"
                >
                  <option value="100">U-100 (1ml=100U)</option>
                  <option value="40">U-40 (1ml=40U)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 bg-primary/10 border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-lg font-semibold text-primary mb-6">Draw this amount</h2>
              
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="text-5xl font-mono font-bold text-foreground">
                    {result.units}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Syringe Units / Ticks</div>
                </div>
                <div className="text-right text-muted-foreground">
                  = <span className="font-mono text-foreground">{result.volumeMl}</span> ml
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Concentration</div>
                  <div className="font-medium mt-0.5">{result.concentration}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Total Yield</div>
                  <div className="font-medium mt-0.5">{result.doses} doses</div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
