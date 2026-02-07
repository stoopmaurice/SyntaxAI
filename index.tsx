
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error("Critical mount error:", err);
    container.innerHTML = `
      <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#070510; color:#f87171; font-family:sans-serif; text-align:center; padding:20px;">
        <h1 style="font-weight:900; letter-spacing:0.1em; color:white;">RUNTIME ERROR</h1>
        <p style="max-width:500px; font-size:13px; opacity:0.7; margin-top:10px;">${err.message}</p>
        <button onclick="location.reload()" style="margin-top:20px; background:#6366f1; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">Retry Connection</button>
      </div>
    `;
  }
}
