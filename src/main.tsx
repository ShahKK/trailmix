import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ensureSeeded } from './db/seed'
import { applyTheme, getStoredTheme } from './lib/theme'

// Apply the saved theme before first paint to avoid a flash.
applyTheme(getStoredTheme())

// Load the starter food library into IndexedDB on first run.
void ensureSeeded()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
