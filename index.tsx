
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Zorg ervoor dat de app alleen mount als het root element bestaat
const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("FATAL: Could not find root element to mount to");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("SyntaxAI successfully initialized.");
  } catch (error: any) {
    console.error("Fout bij het laden van de applicatie:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #070510; color: #f87171; font-family: sans-serif; flex-direction: column; padding: 20px; text-align: center;">
        <h1 style="color: white; font-weight: 900;">MOUNT ERROR</h1>
        <p style="opacity: 0.7; font-family: monospace;">${error.message}</p>
      </div>
    `;
  }
};

// Start de app
mountApp();
