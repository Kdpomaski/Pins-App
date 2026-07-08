import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useState } from 'react';

import Dashboard from '@/pages/Dashboard';
import BodyMap from '@/pages/BodyMap';
import Calendar from '@/pages/Calendar';
import Inventory from '@/pages/Inventory';
import Calculator from '@/pages/Calculator';

import { BottomNav } from '@/components/BottomNav';
import { InjectionLoggerModal } from '@/components/InjectionLoggerModal';
import { AuthGate } from '@/components/AuthGate';
import { SecurityGate } from '@/components/SecurityGate';
import AuthCallback from '@/pages/AuthCallback';
import { AuthProvider } from '@/lib/auth-context';
import { PinsProvider, usePinsStore } from '@/lib/store';
import { SecurityProvider } from '@/lib/security-context';

function BodyMapRoute({
  handleOpenLogger,
}: {
  handleOpenLogger: (siteId?: string, compoundName?: string) => void;
}) {
  const { data } = usePinsStore();
  const logs = data.logs.map((log) => ({
    id: log.id,
    siteId: log.siteId,
    region: log.siteId.replace(/-/g, ' '),
    compound: log.compound,
    dose: log.dose,
    time: log.timestamp,
  }));

  return (
    <BodyMap
      onLogInjection={(siteId, compoundName) => handleOpenLogger(siteId, compoundName)}
      logs={logs}
    />
  );
}

function ProtectedRouter({
  handleOpenLogger,
}: {
  handleOpenLogger: (siteId?: string, compoundName?: string) => void;
}) {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/body-map">
        <BodyMapRoute handleOpenLogger={handleOpenLogger} />
      </Route>
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

  const handleOpenLogger = (siteId?: string, compoundName?: string) => {
    setModalSiteId(siteId ?? null);
    setModalCompoundName(compoundName ?? null);
    setIsLogModalOpen(true);
  };

  return (
    <div className="bg-background text-foreground min-h-[100dvh] font-sans selection:bg-primary/30">
      <ProtectedRouter handleOpenLogger={handleOpenLogger} />
      <BottomNav onOpenLogModal={() => handleOpenLogger()} />
      <InjectionLoggerModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        defaultSiteId={modalSiteId}
        defaultCompoundName={modalCompoundName}
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route>
        <AuthGate>
          <SecurityProvider>
            <SecurityGate>
              <PinsProvider>
                <AppShell />
              </PinsProvider>
            </SecurityGate>
          </SecurityProvider>
        </AuthGate>
      </Route>
    </Switch>
  );
}

function App() {
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