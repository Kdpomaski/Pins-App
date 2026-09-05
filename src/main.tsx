import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';

import App from './App';
import { assertNoTelemetry } from '@/lib/privacy';

import './index.css';

assertNoTelemetry();

// Native WebView often reports 0 for env(safe-area-inset-top) until layout settles.
// Keep at least a status-bar-sized inset so titles are not trapped under the island.
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.setProperty(
    '--pins-safe-top',
    'max(env(safe-area-inset-top, 0px), 47px)',
  );
}

createRoot(document.getElementById('root')!).render(<App />);