import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function SupabaseCheck({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">DSocial Calendar</h1>
          <p className="text-gray-600">Application sociale de gestion d'événements</p>
        </div>

        <Alert className="bg-white border-orange-200">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-lg font-semibold text-gray-900">
            Configuration Supabase Requise
          </AlertTitle>
          <AlertDescription className="mt-3 space-y-4 text-gray-700">
            <p>
              L'application nécessite une connexion à Supabase pour fonctionner.
              Les variables d'environnement ne sont pas configurées.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold mb-2">Sur Vercel, ajoutez ces variables :</p>
              <div className="space-y-2 font-mono text-sm">
                <div className="bg-white p-2 rounded border">
                  <span className="text-blue-600">VITE_SUPABASE_URL</span>
                  <span className="text-gray-400 ml-2">= votre_url_supabase</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <span className="text-blue-600">VITE_SUPABASE_ANON_KEY</span>
                  <span className="text-gray-400 ml-2">= votre_cle_supabase</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold">Étapes à suivre :</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Créez un projet sur{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    supabase.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Allez dans Settings &gt; API de votre projet Supabase</li>
                <li>Copiez l'URL et la clé anon public</li>
                <li>
                  Sur Vercel : Project Settings &gt; Environment Variables
                </li>
                <li>Ajoutez les deux variables ci-dessus</li>
                <li>Redéployez votre application depuis l'onglet Deployments</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <Button asChild variant="default">
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Créer un Projet Supabase
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>

              <Button asChild variant="outline">
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Configurer sur Vercel
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <div className="text-center text-sm text-gray-500">
          <p>Une fois configuré, rafraîchissez cette page</p>
        </div>
      </div>
    </div>
  );
}
