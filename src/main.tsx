import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { EventProvider } from "./contexts/EventContext";
import { OrganizerProvider } from "./contexts/OrganizerContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";
import { SupabaseCheck } from "./components/SupabaseCheck";
import { ErrorBoundary } from "./components/ErrorBoundary";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("L'élément racine #root est introuvable dans le DOM.");
}

// Wrapper pour capturer les erreurs globales
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SupabaseCheck>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AuthProvider>
              <EventProvider>
                <OrganizerProvider>
                  <App />
                </OrganizerProvider>
              </EventProvider>
            </AuthProvider>
          </BrowserRouter>
        </I18nextProvider>
      </SupabaseCheck>
    </ErrorBoundary>
  </React.StrictMode>,
);