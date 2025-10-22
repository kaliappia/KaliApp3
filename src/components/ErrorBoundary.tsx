import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuration Error
              </h1>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 font-mono text-sm whitespace-pre-wrap">
                {this.state.error.message}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  For Vercel Deployment:
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Go to your Vercel project dashboard</li>
                  <li>Navigate to: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Settings → Environment Variables</code></li>
                  <li>Add the required environment variables:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">VITE_SUPABASE_URL</code></li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
                    </ul>
                  </li>
                  <li>Make sure to add them for all environments (Production, Preview, Development)</li>
                  <li>Redeploy your application</li>
                </ol>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  For Local Development:
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Copy <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env</code></li>
                  <li>Fill in your Supabase credentials from <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">your Supabase dashboard</a></li>
                  <li>Restart the development server</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need help? Check the <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">README.md</code> file for more details.
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
