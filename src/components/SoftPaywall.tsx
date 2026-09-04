/**
 * Soft paywall modal — Pro upgrade prompts only.
 * Never blocks basic dose log or site rotation.
 * Shown only when VITE_PAYWALL_ENABLED=true.
 * Placeholder copy; Botfluencer may replace.
 */

import { useState } from 'react';
import { Crown, ExternalLink, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEntitlements, type SoftPaywallReason } from '@/lib/billing/entitlement-context';
import {
  BUNDLE_COPY,
  CONTEXT_COPY,
  PAYWALL_COPY,
  PRO_BULLETS,
} from '@/lib/billing/copy';
import { isFoundingLifetimeEnabled } from '@/lib/billing/feature-flags';
import { openResearchCatalog } from '@/lib/billing/catalog-link';

function reasonCopy(reason: SoftPaywallReason) {
  switch (reason) {
    case 'after_first_log':
      return CONTEXT_COPY.afterFirstLog;
    case 'second_protocol':
      return CONTEXT_COPY.secondProtocol;
    case 'export_locked':
      return CONTEXT_COPY.exportLocked;
    case 'generic_pro':
      return CONTEXT_COPY.genericPro;
    default:
      return null;
  }
}

export function SoftPaywall() {
  const {
    paywallOpen,
    paywallReason,
    closePaywall,
    purchaseAnnual,
    purchaseMonthly,
    purchaseLifetime,
    purchaseFounding,
    restore,
    paywallEnabled,
  } = useEntitlements();

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const showFounding = isFoundingLifetimeEnabled();
  const contextual = reasonCopy(paywallReason);

  if (!paywallEnabled) return null;

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(key);
    setMessage(null);
    try {
      const result = await fn();
      if (!result.ok) {
        setMessage(result.error ?? 'Something went wrong.');
      }
    } finally {
      setBusy(null);
    }
  };

  const headline =
    contextual && paywallReason !== 'hero' && paywallReason !== 'manual'
      ? contextual.title
      : showFounding
        ? BUNDLE_COPY.headline
        : PAYWALL_COPY.headline;

  const subhead =
    contextual && paywallReason !== 'hero' && paywallReason !== 'manual'
      ? contextual.body
      : showFounding
        ? BUNDLE_COPY.subhead
        : PAYWALL_COPY.subhead;

  const bullets = showFounding ? BUNDLE_COPY.bullets : PRO_BULLETS;

  return (
    <Dialog open={paywallOpen} onOpenChange={(open) => !open && closePaywall()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden sm:rounded-2xl">
        <div className="relative bg-gradient-to-b from-primary/15 to-background px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={closePaywall}
            className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <DialogHeader className="space-y-2 text-left pr-8">
            <div className="flex items-center gap-2 text-primary">
              <Crown size={20} />
              {showFounding && (
                <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-primary/15 px-2 py-0.5">
                  {BUNDLE_COPY.badge}
                </span>
              )}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {headline}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {subhead}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-4 space-y-4">
          <ul className="space-y-1.5 text-sm">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-primary shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">{PAYWALL_COPY.reassure}</p>

          <div className="space-y-2">
            {showFounding && (
              <Button
                className="w-full h-11 font-semibold"
                disabled={!!busy}
                onClick={() => void run('founding', purchaseFounding)}
              >
                {busy === 'founding' ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  BUNDLE_COPY.cta
                )}
              </Button>
            )}

            <Button
              className="w-full h-11 font-semibold"
              variant={showFounding ? 'outline' : 'default'}
              disabled={!!busy}
              onClick={() => void run('annual', purchaseAnnual)}
            >
              {busy === 'annual' ? (
                <Loader2 className="animate-spin" size={18} />
              ) : showFounding ? (
                BUNDLE_COPY.pushAnnual
              ) : (
                PAYWALL_COPY.ctaPrimary
              )}
            </Button>
            {!showFounding && (
              <p className="text-center text-[11px] text-muted-foreground">
                {PAYWALL_COPY.ctaPrimarySub}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-10 text-sm"
                disabled={!!busy}
                onClick={() => void run('monthly', purchaseMonthly)}
              >
                {busy === 'monthly' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  PAYWALL_COPY.ctaMonthly
                )}
              </Button>
              <Button
                variant="outline"
                className="h-10 text-sm"
                disabled={!!busy}
                onClick={() => void run('lifetime', purchaseLifetime)}
              >
                {busy === 'lifetime' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  PAYWALL_COPY.ctaLifetime
                )}
              </Button>
            </div>
          </div>

          {message && (
            <p className="text-xs text-destructive text-center" role="alert">
              {message}
            </p>
          )}

          <div className="flex flex-col gap-2 items-center pt-1">
            <button
              type="button"
              className="text-sm text-primary font-medium underline-offset-2 hover:underline disabled:opacity-50"
              disabled={!!busy}
              onClick={() => void run('restore', restore)}
            >
              {PAYWALL_COPY.restore}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={closePaywall}
            >
              {contextual?.dismiss ?? PAYWALL_COPY.continueFree}
            </button>
          </div>

          <button
            type="button"
            onClick={() => openResearchCatalog('paywall')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl px-3 py-2.5"
          >
            <ExternalLink size={14} />
            <span>
              <span className="font-medium text-foreground">{PAYWALL_COPY.browseCatalog}</span>
              <span className="block sm:inline sm:before:content-['_·_']">
                {PAYWALL_COPY.browseCatalogHint}
              </span>
            </span>
          </button>

          <p className="text-[10px] leading-relaxed text-muted-foreground/90 pt-1">
            {PAYWALL_COPY.legalRow}
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground/80 pb-1">
            {PAYWALL_COPY.disclaimer}
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground/80">
            {PAYWALL_COPY.noInAppSales}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
