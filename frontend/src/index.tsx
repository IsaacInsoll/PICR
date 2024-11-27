import React from 'react';
import ReactDOM from 'react-dom/client';
import setupLocatorUI from '@locator/runtime';

import App from './App';

// locator.js init (for improved DX)
if (process.env.NODE_ENV === 'development') {
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
