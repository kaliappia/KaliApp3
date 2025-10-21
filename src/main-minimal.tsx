import ReactDOM from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 40px; font-family: sans-serif;"><h1>❌ Root element not found</h1></div>';
  throw new Error("Root element not found");
}

// Version ultra-minimale pour tester
ReactDOM.createRoot(rootElement).render(
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'sans-serif',
    padding: '20px'
  }}>
    <div style={{
      background: 'white',
      padding: '40px',
      borderRadius: '20px',
      maxWidth: '600px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>✅ React Fonctionne !</h1>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Si tu vois ce message, React charge correctement.
      </p>
      <div style={{
        background: '#f3f4f6',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'left',
        marginBottom: '20px'
      }}>
        <p style={{ margin: '5px 0', fontFamily: 'monospace', fontSize: '13px' }}>
          ✓ HTML chargé<br/>
          ✓ JavaScript chargé<br/>
          ✓ React initialisé<br/>
          ✓ Render réussi
        </p>
      </div>
      <a
        href="/setup.html"
        style={{
          display: 'inline-block',
          background: '#667eea',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
      >
        → Configuration Supabase
      </a>
    </div>
  </div>
);
