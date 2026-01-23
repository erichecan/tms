import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.tsx'

console.log('%c TMS V2 Loaded: Build 2026-01-22 17:15 ', 'background: #222; color: #bada55; font-size: 16px; padding: 4px; border-radius: 4px;');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
