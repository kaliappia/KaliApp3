# DSocial Calendar

Application sociale de gestion d'événements construite avec React, TypeScript, Vite, et Capacitor pour iOS.

## 🚀 Technologies

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 6
- **UI:** Tailwind CSS + Shadcn/ui
- **Backend:** Supabase
- **Mobile:** Capacitor (iOS)
- **i18n:** Support multilingue (EN, FR, ES, DE, IT, JA)

## 📱 Développement iOS

Cette application est optimisée pour iOS avec deux workflows de développement :

### Option 1 : Live Reload (Développement Rapide)

Développez avec rechargement automatique sur votre iPhone réel !

```bash
# Configuration initiale (une seule fois)
npm run ios:dev-setup

# Démarrer le serveur de dev
npm run dev

# Dans un autre terminal : synchroniser avec iOS
npm run ios:dev-sync
npm run ios:dev-open

# Lancer depuis Xcode sur votre iPhone
# ✨ L'app se recharge automatiquement à chaque modification !
```

📖 **Guide complet :** [LIVE_RELOAD_GUIDE.md](./LIVE_RELOAD_GUIDE.md)

### Option 2 : Build Production

Pour tester la version finale ou déployer sur l'App Store :

```bash
# Build et synchronisation
npm run ios:build

# Ouvrir dans Xcode
npm run ios:open

# Ou tout en une commande
npm run ios:deploy
```

📖 **Guide de déploiement :** [iOS_DEPLOYMENT_GUIDE.md](./iOS_DEPLOYMENT_GUIDE.md)

## 📦 Scripts NPM Disponibles

### Développement Web
```bash
npm run dev          # Serveur de dev Vite (avec --host pour réseau local)
npm run build        # Build de production
npm run preview      # Preview du build
npm run lint         # Linter ESLint
```

### iOS - Production
```bash
npm run ios:build    # Build webapp + sync avec iOS
npm run ios:open     # Ouvrir le projet dans Xcode
npm run ios:sync     # Synchroniser les changements avec iOS
npm run ios:deploy   # Build + sync + ouvrir Xcode (workflow complet)
```

### iOS - Développement avec Live Reload
```bash
npm run ios:dev-setup   # Configuration du Live Reload (détecte votre IP locale)
npm run ios:dev-sync    # Sync avec la config de dev
npm run ios:dev-open    # Ouvrir dans Xcode
npm run ios:dev         # Workflow complet de setup
```

### Supabase
```bash
npm run types:supabase  # Générer les types TypeScript depuis Supabase
```

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement web
npm run dev
```

## 📱 Configuration iOS

Le projet iOS est déjà configuré dans le dossier `ios/`. Pour l'utiliser :

1. **Prérequis :**
   - macOS avec Xcode installé
   - CocoaPods : `sudo gem install cocoapods`

2. **Installer les dépendances natives :**
   ```bash
   cd ios/App
   pod install
   ```

3. **Ouvrir dans Xcode :**
   ```bash
   npm run ios:open
   # Ou manuellement : open ios/App/App.xcworkspace
   ```

4. **Configuration Xcode :**
   - Sélectionner votre équipe de développement (Signing & Capabilities)
   - Choisir votre iPhone/Simulateur
   - Cliquer sur Play ▶️

## 🎨 Fonctionnalités

- ✅ Création et gestion d'événements
- ✅ Calendrier interactif
- ✅ Profils utilisateurs et organisateurs
- ✅ Feed d'activités
- ✅ Recherche d'événements
- ✅ Support multilingue
- ✅ Authentification Supabase
- ✅ Optimisations iOS (safe areas, status bar, etc.)

## 📄 Optimisations iOS Implémentées

- 🔄 Safe areas pour appareils avec encoche
- 🎨 Support du mode sombre/clair automatique
- 📱 Viewport optimisé pour iOS
- ⚡ Smooth scrolling WebKit
- 🔌 Plugins Capacitor (App, Haptics, Keyboard, Status Bar)
- 🔐 Permissions configurées (Caméra, Photos, Location, Calendrier, etc.)

## 📚 Documentation

- [Guide de Déploiement iOS](./iOS_DEPLOYMENT_GUIDE.md) - Instructions complètes pour déployer sur l'App Store
- [Guide Live Reload](./LIVE_RELOAD_GUIDE.md) - Développement iOS avec rechargement automatique

## 🏗️ Structure du Projet

```
.
├── src/
│   ├── components/      # Composants React réutilisables
│   ├── contexts/        # Context providers (Auth, Event, Organizer)
│   ├── pages/           # Pages de l'application
│   ├── lib/             # Utilitaires et configuration
│   ├── hooks/           # Custom hooks
│   └── i18n/            # Fichiers de traduction
├── ios/                 # Projet iOS Capacitor
├── public/              # Assets statiques
└── scripts/             # Scripts utilitaires (setup iOS, etc.)
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase
```

### Capacitor

La configuration Capacitor se trouve dans :
- **Production :** `capacitor.config.ts`
- **Développement (Live Reload) :** `capacitor.config.dev.local.ts` (auto-généré)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT.

## 🆘 Support

Pour toute question ou problème :
- Consultez les guides dans ce repository
- Ouvrez une issue sur GitHub
- Documentation Capacitor : https://capacitorjs.com/docs

---

Développé avec ❤️ et [Claude Code](https://claude.com/claude-code)
