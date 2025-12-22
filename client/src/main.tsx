import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress Vite HMR WebSocket errors - override console methods
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args: any[]) {
  const message = args[0]?.message || args[0]?.toString() || String(args[0]);
  
  // Suppress WebSocket and HMR errors
  if (message.includes('WebSocket') || message.includes('localhost:undefined') || 
      message.includes('Failed to construct') || message.includes('@vite/client')) {
    return;
  }
  
  originalError.apply(console, args);
};

console.warn = function(...args: any[]) {
  const message = args[0]?.toString() || String(args[0]);
  
  if (message.includes('WebSocket') || message.includes('localhost:undefined')) {
    return;
  }
  
  originalWarn.apply(console, args);
};

// Global error handlers with mobile support
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason?.toString() || '';
  const isWebSocketError = reason.includes('WebSocket') || reason.includes('localhost:undefined');
  const isHMRError = reason.includes('vite') || reason.includes('HMR') || reason.includes('@vite/client');
  
  if (isWebSocketError || isHMRError) {
    event.preventDefault();
    return;
  }
  
  originalError('Unhandled promise rejection:', event.reason);
  event.preventDefault();
}, true);

// Mobile-specific initialization with fallback
function initializeApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error('Root element not found');
      document.body.innerHTML = '<div style="padding: 20px; text-align: center;">Loading error. Please refresh the page.</div>';
      return;
    }
    
    createRoot(rootElement).render(<App />);
    
    // Remove the initial loader once React has mounted
    setTimeout(() => {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loader.remove(), 300);
      }
    }, 100);
  } catch (error) {
    console.error('App initialization failed:', error);
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;">App failed to load. Please refresh the page.</div>';
  }
}

// Register service worker for offline caching (production only)
// Service workers require HTTPS and don't work well with Vite's HMR in development
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available, refresh to update');
            }
          });
        }
      });
      
      // Periodic update check (every 60 minutes)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
    } catch (error) {
      // Silently handle SW registration failures - app works fine without it
      if (import.meta.env.DEV) {
        console.log('Service Worker not available in development mode');
      }
    }
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Unregister any existing service workers in development to prevent caching issues
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

// Initialize app with mobile-friendly delay
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
