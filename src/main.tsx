import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';

import App from './App';
import { assertNoTelemetry } from '@/lib/privacy';

import './index.css';

assertNoTelemetry();

// Native WebView often reports 0 for env(safe-area-inset-*) until layout settles.
// Keep minimum insets so chrome is not trapped under status / gesture bars.
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.setProperty(
    '--pins-safe-top',
    'max(env(safe-area-inset-top, 0px), 47px)',
  );
  // Android gesture / 3-button nav: keep BottomNav above the system bar ("too low" fix).
  const minBottom = Capacitor.getPlatform() === 'android' ? '24px' : '0px';
  document.documentElement.style.setProperty(
    '--pins-safe-bottom',
    `max(env(safe-area-inset-bottom, 0px), ${minBottom})`,
  );
}

createRoot(document.getElementById('root')!).render(<App />);