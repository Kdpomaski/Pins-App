import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Android hardware/gesture back:
 * - pop browser/wouter history when possible
 * - App.exitApp() at root (no history)
 */
export function useAndroidBackButton() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let handle: { remove: () => Promise<void> } | undefined;

    void CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack || window.history.length > 1) {
        window.history.back();
        return;
      }
      void CapApp.exitApp();
    }).then((h) => {
      handle = h;
    });

    return () => {
      void handle?.remove();
    };
  }, []);
}
