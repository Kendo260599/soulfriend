import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker with cache busting
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister old service workers to force cache refresh
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.active?.scriptURL.includes('sw.js')) {
          await registration.unregister();
          console.log('✅ Old service worker unregistered');
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches cleared');
      }
      
      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw.js?v=2');
      console.log('✅ SW registered: ', registration);
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
