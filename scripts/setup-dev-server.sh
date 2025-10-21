#!/bin/bash

# Script pour configurer le Live Reload avec Capacitor
# Ce script détecte automatiquement votre IP locale et configure Capacitor

set -e

echo "🔍 Détection de l'adresse IP locale..."
LOCAL_IP=$(node scripts/get-local-ip.js)

if [ "$LOCAL_IP" = "127.0.0.1" ]; then
  echo "⚠️  Impossible de détecter l'IP locale automatiquement."
  echo "📝 Veuillez entrer votre adresse IP locale manuellement:"
  echo "   (Vous pouvez la trouver avec: ifconfig | grep 'inet ' | grep -v 127.0.0.1)"
  read -p "Votre IP locale: " LOCAL_IP
fi

echo "✅ IP locale détectée: $LOCAL_IP"

# Créer le fichier de configuration avec l'IP
cat > capacitor.config.dev.local.ts << EOF
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dsocial.calendar',
  appName: 'DSocial Calendar (Dev)',
  webDir: 'dist',
  server: {
    url: 'http://${LOCAL_IP}:5173',
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    allowsLinkPreview: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#ffffff",
      showSpinner: false,
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
EOF

echo "📝 Configuration de développement créée avec l'IP: $LOCAL_IP"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Démarrer le serveur de dev: npm run dev"
echo "   2. Dans un autre terminal: npm run ios:dev-sync"
echo "   3. Ouvrir dans Xcode: npm run ios:open"
echo "   4. Lancer l'app sur votre iPhone (connecté au même réseau WiFi)"
echo ""
echo "💡 L'app se rechargera automatiquement à chaque modification !"
