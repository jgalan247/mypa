import React from 'react'
import ReactDOM from 'react-dom/client'
import FocusFlow from './FocusFlow.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FocusFlow />
  </React.StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/mypa/sw.js').catch(() => {
      // SW registration failed — app still works, just no offline support
    })
  })
}
