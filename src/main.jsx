import { createRoot } from 'react-dom/client'
import './index.css'
import '../style.css'
import App from './App.jsx'

// Overwrite window.alert and setup global window.toast
window.toast = {
  success: (msg) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'success' } })),
  error: (msg) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'error' } })),
  warning: (msg) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'warning' } })),
  info: (msg) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'info' } })),
};

window.alert = (message) => {
  if (message === undefined || message === null) return;
  const msgStr = String(message);
  
  // Determine type
  let type = 'info';
  let cleanMsg = msgStr;
  
  if (msgStr.startsWith('❌')) {
    type = 'error';
    cleanMsg = msgStr.replace(/^❌\s*/, '');
  } else if (msgStr.startsWith('✅')) {
    type = 'success';
    cleanMsg = msgStr.replace(/^✅\s*/, '');
  } else if (msgStr.startsWith('⚠️')) {
    type = 'warning';
    cleanMsg = msgStr.replace(/^⚠️\s*/, '');
  } else if (msgStr.toLowerCase().includes('success')) {
    type = 'success';
  } else if (msgStr.toLowerCase().includes('failed') || msgStr.toLowerCase().includes('error')) {
    type = 'error';
  } else if (msgStr.toLowerCase().includes('warning')) {
    type = 'warning';
  }
  
  window.toast[type](cleanMsg);
};

createRoot(document.getElementById('root')).render(
  <App />
)


