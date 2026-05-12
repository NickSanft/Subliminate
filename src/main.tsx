import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { setupMonitor } from './stores/monitor.store';
import { setupPersistence } from './stores/persistence.store';
import './styles/app.css';

// GitHub Pages SPA fallback: 404.html stashes the requested path in
// sessionStorage before redirecting back to `/`. Replay it here so
// React Router lands the user where they intended.
const stashedPath = sessionStorage.getItem('subliminate.redirect');
if (stashedPath) {
  sessionStorage.removeItem('subliminate.redirect');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  // The stash includes the project base segment; strip it before
  // pushing onto history so React Router (already configured with the
  // same basename) doesn't double-prefix.
  const target = base && stashedPath.startsWith(base) ? stashedPath.slice(base.length) : stashedPath;
  history.replaceState(null, '', base + (target || '/'));
}

setupMonitor();
setupPersistence();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
