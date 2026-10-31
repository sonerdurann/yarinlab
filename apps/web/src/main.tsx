import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/800.css';
import './index.css';
import './theme.css';
import './design/tokens.css';
import './design/game-ui.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Üretimde service worker: oyun çekirdeği çevrim dışı da açılır. Geliştirmede kapalı (Vite HMR ile çakışmasın).
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
