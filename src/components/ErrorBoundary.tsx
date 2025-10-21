import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: '#dc2626',
          fontFamily: 'monospace',
          color: 'white'
        }}>
          <div style={{
            maxWidth: '800px',
            width: '100%',
            background: '#1f2937',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginTop: 0,
              marginBottom: '20px',
              color: '#fca5a5'
            }}>
              ❌ Erreur JavaScript Détectée
            </h1>

            <div style={{
              background: '#374151',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              overflow: 'auto'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#fbbf24' }}>
                Message d'erreur :
              </p>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.error?.stack && (
              <div style={{
                background: '#374151',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                overflow: 'auto'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#fbbf24' }}>
                  Stack trace :
                </p>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#d1d5db',
                  fontSize: '12px'
                }}>
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div style={{
              background: '#374151',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#fbbf24' }}>
                💡 Informations utiles :
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#d1d5db' }}>
                <li>L'app a crashé pendant le chargement</li>
                <li>Le problème n'est PAS lié à iOS ou Vercel</li>
                <li>C'est probablement un problème de configuration</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              🔄 Rafraîchir
            </button>

            <button
              onClick={() => window.location.href = '/test.html'}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🧪 Page de Test
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
