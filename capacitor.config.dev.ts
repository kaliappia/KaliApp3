import type { CapacitorConfig } from '@capacitor/cli';

// Configuration pour le développement avec Live Reload
// IMPORTANT: Remplacer YOUR_LOCAL_IP par votre adresse IP locale
// Pour trouver votre IP:
// - Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
// - Windows: ipconfig
// - Ou dans les paramètres réseau de votre système

const config: CapacitorConfig = {
  appId: 'com.dsocial.calendar',
  appName: 'DSocial Calendar (Dev)',
  webDir: 'web/dist',
  server: {
    // Remplacer par votre IP locale (ex: 192.168.1.100)
    url: 'http://YOUR_LOCAL_IP:5173',
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
      launchShowDuration: 0, // Désactivé en dev pour un rechargement plus rapide
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
