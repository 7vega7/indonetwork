import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111130', color: '#e8eaf6', border: '1px solid rgba(0,200,255,0.2)' },
      }} />
    </HashRouter>
  </React.StrictMode>
)
