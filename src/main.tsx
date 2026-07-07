import { createRoot } from 'react-dom/client';

import App from './App';
import { assertNoTelemetry } from '@/lib/privacy';

import './index.css';

assertNoTelemetry();

createRoot(document.getElementById('root')!).render(<App />);