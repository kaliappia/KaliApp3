import { isSupabaseConfigured } from '@/lib/supabase';

export function SupabaseCheck({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) {
    return <>{children}</>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 10px 0'
          }}>
            DSocial Calendar
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Application sociale de gestion d'événements
          </p>
        </div>

        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#856404',
            margin: '0 0 15px 0'
          }}>
            ⚠️ Configuration Supabase Requise
          </h2>

          <p style={{ color: '#856404', marginBottom: '15px' }}>
            L'application nécessite une connexion à Supabase pour fonctionner.
            Les variables d'environnement ne sont pas configurées.
          </p>

          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
              Sur Vercel, ajoutez ces variables :
            </p>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              background: 'white',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #dee2e6',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#0066cc' }}>VITE_SUPABASE_URL</span>
              <span style={{ color: '#6c757d' }}> = votre_url_supabase</span>
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              background: 'white',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}>
              <span style={{ color: '#0066cc' }}>VITE_SUPABASE_ANON_KEY</span>
              <span style={{ color: '#6c757d' }}> = votre_cle_supabase</span>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
              Étapes à suivre :
            </p>
            <ol style={{
              paddingLeft: '20px',
              color: '#495057',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <li>Créez un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>supabase.com</a></li>
              <li>Allez dans Settings &gt; API de votre projet Supabase</li>
              <li>Copiez l'URL et la clé anon public</li>
              <li>Sur Vercel : Project Settings &gt; Environment Variables</li>
              <li>Ajoutez les deux variables ci-dessus</li>
              <li>Redéployez votre application depuis l'onglet Deployments</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#667eea',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Créer un Projet Supabase →
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#667eea',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                border: '2px solid #667eea'
              }}
            >
              Configurer sur Vercel →
            </a>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
          margin: 0
        }}>
          Une fois configuré, rafraîchissez cette page
        </p>
      </div>
    </div>
  );
}
