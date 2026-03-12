import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './contexts/AppContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#3EE892', secondary: 'var(--card)' } },
          error:   { iconTheme: { primary: '#FF5C7A', secondary: 'var(--card)' } },
        }}
      />
    </AppProvider>
  </BrowserRouter>
)
