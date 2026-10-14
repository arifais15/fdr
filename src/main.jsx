import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ─── Global fix: prevent mouse wheel from accidentally changing number inputs ─
const preventWheelOnNumberInputs = (e) => {
  if (document.activeElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
};
document.addEventListener('wheel', preventWheelOnNumberInputs, { passive: true });
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
