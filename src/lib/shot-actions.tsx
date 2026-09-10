import { createContext, useContext, type ReactNode } from "react";
import type { InjectionLog } from "@/lib/store";

export type ShotActions = {
  requestNewLog: (siteId?: string, compoundName?: string) => void;
  requestEditLog: (log: InjectionLog) => void;
};

const ShotActionsContext = createContext<ShotActions | null>(null);

export function ShotActionsProvider({
  value,
  children,
}: {
  value: ShotActions;
  children: ReactNode;
}) {
  return <ShotActionsContext.Provider value={value}>{children}</ShotActionsContext.Provider>;
}

export function useShotActions(): ShotActions {
  const ctx = useContext(ShotActionsContext);
  if (!ctx) throw new Error("useShotActions must be used within ShotActionsProvider");
  return ctx;
}
