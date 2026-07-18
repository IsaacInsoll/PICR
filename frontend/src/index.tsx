import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './fonts.generated';
import { reloadForNewVersion } from './helpers/chunkReload';

// A preloaded chunk 404'd because a newer frontend build was deployed while this
// client was open. Reload to recover; only suppress Vite's default throw when we
// actually reload, so a cooldown-blocked failure still surfaces to the boundary.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

if (import.meta.env.DEV) {
  const { default: setupLocatorUI } = await import('@locator/runtime');
  setupLocatorUI();
}

const element = document.getElementById('root');
if (element) {
  const root = ReactDOM.createRoot(element);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
