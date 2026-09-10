import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useCallback, useMemo, useState } from 'react';
import { useAndroidBackButton } from '@/hooks/use-android-back-button';

import Dashboard from '@/pages/Dashboard';
import BodyMap from '@/pages/BodyMap';
import Calendar from '@/pages/Calendar';
import Inventory from '@/pages/Inventory';
import Calculator from '@/pages/Calculator';

import { BottomNav } from '@/components/BottomNav';
import { EditShotPrompt } from '@/components/EditShotPrompt';
import { InjectionLoggerModal } from '@/components/InjectionLoggerModal';
import { AuthGate } from '@/components/AuthGate';
import { SecurityGate } from '@/components/SecurityGate';
import AuthCallback from '@/pages/AuthCallback';
import { AuthProvider } from '@/lib/auth-context';
import { PinsProvider, usePinsStore, type InjectionLog } from '@/lib/store';
import { SecurityProvider } from '@/lib/security-context';
import { EntitlementProvider, useEntitlements } from '@/lib/billing/entitlement-context';
import { SoftPaywall } from '@/components/SoftPaywall';
import { filterMapHistoryLogs } from '@/lib/billing/products';
import { isPaywallEnabled } from '@/lib/billing/feature-flags';
import { ShotActionsProvider, useShotActions } from '@/lib/shot-actions';

function BodyMapRoute() {
  const { data } = usePinsStore();
  const { isPro } = useEntitlements();
  const { requestNewLog, requestEditLog } = useShotActions();
  const mapped = data.logs
    .filter((log) => !log.deletedAt)
    .map((log) => ({
      id: log.id,
      siteId: log.siteId,
      region: log.siteId.replace(/-/g, ' '),
      compound: log.compound,
      dose: log.dose,
      time: log.timestamp,
    }));
  // Full map history is Free (Kevin 2026-09-05) — filter is a no-op.
  const logs = filterMapHistoryLogs(mapped, {
    isPro,
    enforce: isPaywallEnabled(),
  });

  return (
    <BodyMap
      onLogInjection={(siteId, compoundName) => requestNewLog(siteId, compoundName)}
      onExistingShot={(logId) => {
        const log = data.logs.find((entry) => entry.id === logId);
        if (log) requestEditLog(log);
      }}
      logs={logs}
    />
  );
}

function ProtectedRouter() {
  return (
    <Switch>
      <Route path="/">
        <BodyMapRoute />
      </Route>
      <Route path="/body-map">
        <BodyMapRoute />
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/calculator" component={Calculator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalSiteId, setModalSiteId] = useState<string | null>(null);
  const [modalCompoundName, setModalCompoundName] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<InjectionLog | null>(null);
  const [promptLog, setPromptLog] = useState<InjectionLog | null>(null);

  const closeLogger = () => {
    setIsLogModalOpen(false);
    setEditLog(null);
    setModalSiteId(null);
    setModalCompoundName(null);
  };

  const requestNewLog = useCallback((siteId?: string, compoundName?: string) => {
    setPromptLog(null);
    setEditLog(null);
    setModalSiteId(siteId ?? null);
    setModalCompoundName(compoundName ?? null);
    setIsLogModalOpen(true);
  }, []);

  const requestEditLog = useCallback((log: InjectionLog) => {
    setPromptLog(log);
  }, []);

  const openEditor = (log: InjectionLog) => {
    setPromptLog(null);
    setEditLog(log);
    setModalSiteId(log.siteId);
    setModalCompoundName(log.compound);
    setIsLogModalOpen(true);
  };

  const shotActions = useMemo(
    () => ({ requestNewLog, requestEditLog }),
    [requestNewLog, requestEditLog],
  );

  return (
    <ShotActionsProvider value={shotActions}>
      <div className="bg-background text-foreground min-h-[100dvh] font-sans selection:bg-primary/30">
        <ProtectedRouter />
        <BottomNav onOpenLogModal={() => requestNewLog()} />
        <EditShotPrompt
          log={promptLog}
          onClose={() => setPromptLog(null)}
          onEdit={openEditor}
          onLogNew={(log) => requestNewLog(log.siteId, log.compound)}
        />
        <InjectionLoggerModal
          isOpen={isLogModalOpen}
          onClose={closeLogger}
          defaultSiteId={modalSiteId}
          defaultCompoundName={modalCompoundName}
          editLog={editLog}
        />
        <SoftPaywall />
      </div>
    </ShotActionsProvider>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route>
        <AuthGate>
          <EntitlementProvider>
            <SecurityProvider>
              <SecurityGate>
                <PinsProvider>
                  <AppShell />
                </PinsProvider>
              </SecurityGate>
            </SecurityProvider>
          </EntitlementProvider>
        </AuthGate>
      </Route>
    </Switch>
  );
}

function App() {
  useAndroidBackButton();

  return (
    <TooltipProvider>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRoutes />
        </WouterRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
