import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/styles/index.css'

import { registerSW } from 'virtual:pwa-register'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).deferredPrompt = e;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

