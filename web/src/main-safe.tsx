import ReactDOM from "react-dom/client";

// Version ultra-sécurisée qui NE CRASH JAMAIS
try {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    // Si pas de root, afficher message directement dans body
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #dc2626;
        color: white;
        font-family: sans-serif;
        padding: 20px;
      ">
        <div style="background: #1f2937; padding: 40px; border-radius: 20px; max-width: 600px;">
          <h1 style="color: #fca5a5; margin: 0 0 20px 0;">❌ Erreur: Root Element Introuvable</h1>
          <p>L'élément #root n'existe pas dans le DOM.</p>
          <p style="margin-top: 20px; font-family: monospace; color: #d1d5db;">
            ${document.body.innerHTML.substring(0, 200)}
          </p>
        </div>
      </div>
    `;
  } else {
    // Root existe, essayer de render React
    try {
      const root = ReactDOM.createRoot(rootElement);

      root.render(
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
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h1 style={{ color: '#10b981', marginBottom: '20px', fontSize: '32px' }}>
              ✅ Version Safe Fonctionne !
            </h1>

            <div style={{
              background: '#f3f4f6',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: '14px', color: '#374151' }}>
                ✓ HTML chargé<br/>
                ✓ JavaScript chargé et exécuté<br/>
                ✓ React initialisé avec succès<br/>
                ✓ ReactDOM.createRoot OK<br/>
                ✓ Render réussi sans erreur<br/>
                ✓ Tous les styles appliqués
              </p>
            </div>

            <div style={{
              background: '#dbeafe',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#1e40af'
            }}>
              <strong>💡 Cette version :</strong>
              <ul style={{ textAlign: 'left', margin: '10px 0', paddingLeft: '20px' }}>
                <li>Ne crash jamais (try-catch sur tout)</li>
                <li>Pas de providers (Auth, Event, Organizer)</li>
                <li>Pas de router</li>
                <li>Pas de Supabase</li>
                <li>Juste React pur</li>
              </ul>
            </div>

            <div style={{
              background: '#1f2937',
              color: '#d1d5db',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '12px',
              textAlign: 'left'
            }}>
              <div>User Agent: {navigator.userAgent.substring(0, 80)}...</div>
              <div>URL: {window.location.href}</div>
              <div>Screen: {window.screen.width}x{window.screen.height}</div>
              <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
              <div>iOS: {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Yes' : 'No'}</div>
            </div>

            <div>
              <a
                href="/diagnostic.html"
                style={{
                  display: 'inline-block',
                  background: '#667eea',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  margin: '5px'
                }}
              >
                🔍 Page Diagnostic
              </a>

              <a
                href="/setup.html"
                style={{
                  display: 'inline-block',
                  background: '#10b981',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  margin: '5px'
                }}
              >
                ⚙️ Configuration
              </a>

              <a
                href="/test.html"
                style={{
                  display: 'inline-block',
                  background: '#f59e0b',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  margin: '5px'
                }}
              >
                🧪 Test HTML
              </a>
            </div>
          </div>
        </div>
      );
    } catch (renderError: any) {
      // Si le render React crash, afficher l'erreur
      document.body.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dc2626;
          color: white;
          font-family: sans-serif;
          padding: 20px;
        ">
          <div style="background: #1f2937; padding: 40px; border-radius: 20px; max-width: 800px;">
            <h1 style="color: #fca5a5; margin: 0 0 20px 0;">❌ Erreur React Render</h1>
            <div style="background: #374151; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-family: monospace; color: #fbbf24;">
                ${renderError.message || String(renderError)}
              </p>
            </div>
            <pre style="
              background: #374151;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              overflow: auto;
              white-space: pre-wrap;
              word-break: break-word;
              font-size: 12px;
              color: #d1d5db;
            ">${renderError.stack || 'No stack trace'}</pre>
            <button
              onclick="window.location.href='/diagnostic.html'"
              style="
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin: 5px;
              "
            >
              🔍 Page Diagnostic
            </button>
            <button
              onclick="window.location.reload()"
              style="
                background: #10b981;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin: 5px;
              "
            >
              🔄 Rafraîchir
            </button>
          </div>
        </div>
      `;
    }
  }
} catch (criticalError: any) {
  // Si TOUT crash, afficher message brut
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #7f1d1d;
      color: white;
      font-family: sans-serif;
      padding: 20px;
    ">
      <div style="background: #1f2937; padding: 40px; border-radius: 20px; max-width: 800px;">
        <h1 style="color: #fca5a5; margin: 0 0 20px 0;">❌ Erreur Critique</h1>
        <p style="color: #fbbf24; margin-bottom: 20px;">
          Une erreur critique est survenue AVANT même que React ne puisse se charger.
        </p>
        <div style="background: #374151; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; font-family: monospace; color: #fca5a5; word-break: break-word;">
            ${criticalError?.message || String(criticalError) || 'Unknown error'}
          </p>
        </div>
        <pre style="
          background: #374151;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          overflow: auto;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 12px;
          color: #d1d5db;
        ">${criticalError?.stack || 'No stack trace available'}</pre>
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; color: #1e40af;">
          <strong>Debug info:</strong><br/>
          URL: ${window.location.href}<br/>
          User Agent: ${navigator.userAgent}<br/>
          Time: ${new Date().toISOString()}
        </div>
        <button
          onclick="window.location.href='/diagnostic.html'"
          style="
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          "
        >
          🔍 Aller à la Page Diagnostic
        </button>
      </div>
    </div>
  `;
}
