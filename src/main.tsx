import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/firecrawl-tokens.css';
import './styles/app.css';
import App from './App';

const isProd = Boolean((import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD);

if (isProd && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore service worker registration errors
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
