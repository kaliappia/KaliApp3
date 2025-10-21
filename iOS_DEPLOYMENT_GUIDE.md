# Guide de Déploiement iOS - DSocial Calendar

Ce guide explique comment déployer l'application DSocial Calendar sur iOS avec Xcode.

## 📋 Prérequis

- macOS avec Xcode installé (version 14 ou supérieure)
- Compte Apple Developer (pour le déploiement sur App Store)
- CocoaPods installé (`sudo gem install cocoapods`)
- iPhone ou iPad pour les tests (optionnel mais recommandé)

## 🚀 Étapes de Déploiement

### 1. Ouvrir le Projet dans Xcode

```bash
# Depuis le répertoire racine du projet
cd ios/App
open App.xcworkspace
```

**Important:** Ouvrez toujours `.xcworkspace` et NON `.xcodeproj` !

### 2. Installer les Dépendances CocoaPods

Si ce n'est pas déjà fait, installez les dépendances natives :

```bash
cd ios/App
pod install
```

### 3. Configuration du Projet dans Xcode

#### A. Sélectionner l'équipe de développement
1. Dans Xcode, sélectionnez le projet "App" dans le navigateur
2. Allez dans l'onglet "Signing & Capabilities"
3. Sélectionnez votre équipe de développement ("Team")
4. Xcode générera automatiquement les profils de provisionnement

#### B. Vérifier le Bundle Identifier
- Bundle ID actuel : `com.dsocial.calendar`
- Changez-le si nécessaire pour correspondre à votre compte développeur

#### C. Configuration de la Version
- Version : 1.0.0 (à mettre à jour selon vos besoins)
- Build : 1 (incrémentez pour chaque soumission)

### 4. Build et Test sur Simulateur

1. Sélectionnez un simulateur iOS (iPhone 14, iPhone 15, etc.)
2. Cliquez sur le bouton "Play" (▶️) ou appuyez sur `Cmd + R`
3. L'application devrait se lancer dans le simulateur

### 5. Test sur Appareil Réel

1. Connectez votre iPhone/iPad via USB
2. Sélectionnez votre appareil dans la liste des destinations
3. Cliquez sur "Play" pour installer et lancer l'app

**Note:** La première fois, vous devrez faire confiance au certificat de développement dans Réglages > Général > Gestion des appareils sur votre iPhone.

### 6. Préparation pour l'App Store

#### A. Configuration des Assets

Les assets suivants doivent être personnalisés :

1. **Icône d'application** : `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Remplacez `AppIcon-512@2x.png` par votre icône (1024x1024px)

2. **Splash Screens** : `ios/App/App/Assets.xcassets/Splash.imageset/`
   - Remplacez les fichiers splash par vos images de lancement

#### B. Archive pour App Store

1. Dans Xcode, sélectionnez "Any iOS Device (arm64)"
2. Menu : Product > Archive
3. Une fois l'archive créée, cliquez sur "Distribute App"
4. Choisissez "App Store Connect"
5. Suivez les étapes de l'assistant

### 7. Soumission sur App Store Connect

1. Allez sur [App Store Connect](https://appstoreconnect.apple.com)
2. Créez une nouvelle app avec le même Bundle ID
3. Remplissez les métadonnées (description, captures d'écran, etc.)
4. Sélectionnez le build uploadé depuis Xcode
5. Soumettez pour révision

## 🔧 Optimisations Appliquées

### Optimisations UI iOS
- ✅ Safe areas pour iPhone avec encoche
- ✅ Support du mode sombre/clair automatique
- ✅ Status bar configurée
- ✅ Viewport optimisé pour iOS
- ✅ Désactivation des effets de tap iOS par défaut
- ✅ Smooth scrolling activé

### Permissions Configurées
- 📷 Caméra (pour photos de profil et événements)
- 🖼️ Bibliothèque photos
- 📍 Localisation (événements à proximité)
- 📅 Calendrier (synchronisation événements)
- 🔔 Rappels
- 👥 Contacts (invitations)

### Plugins Capacitor Installés
- `@capacitor/app` - Gestion app lifecycle
- `@capacitor/haptics` - Retour haptique
- `@capacitor/keyboard` - Gestion clavier
- `@capacitor/status-bar` - Personnalisation status bar

## 🔄 Workflow de Développement

### Faire des Modifications

1. **Modifier le code web** :
   ```bash
   npm run dev  # Pour le développement local
   ```

2. **Builder et synchroniser avec iOS** :
   ```bash
   npm run build
   npx cap sync ios
   ```

3. **Ouvrir dans Xcode** :
   ```bash
   npx cap open ios
   ```

### Live Reload sur Appareil

Pour activer le live reload pendant le développement :

1. Démarrez le serveur de dev :
   ```bash
   npm run dev
   ```

2. Modifiez `capacitor.config.ts` temporairement :
   ```typescript
   server: {
     url: 'http://VOTRE_IP_LOCAL:5173',
     cleartext: true
   }
   ```

3. Rebuilder et tester sur appareil

**N'oubliez pas de supprimer la config `server.url` avant de déployer en production !**

## 📱 Tests Recommandés

- [ ] Test de connexion/inscription
- [ ] Test de création d'événement
- [ ] Test du calendrier
- [ ] Test des notifications
- [ ] Test en mode avion (fonctionnalités offline)
- [ ] Test sur différents iPhone (mini, standard, Pro Max)
- [ ] Test en mode sombre et clair
- [ ] Test de rotation d'écran
- [ ] Test de l'accessibilité (VoiceOver)

## 🐛 Dépannage

### Erreur "Code Signing"
- Vérifiez que vous avez sélectionné votre équipe dans Xcode
- Assurez-vous d'avoir un compte Apple Developer actif

### Erreur "Pod Install"
```bash
cd ios/App
pod repo update
pod install
```

### Build Failed
```bash
# Nettoyer le build
cd ios/App
xcodebuild clean
# Ou dans Xcode : Product > Clean Build Folder (Shift + Cmd + K)
```

### L'app crash au lancement
- Vérifiez les logs dans Xcode (View > Debug Area > Show Debug Area)
- Assurez-vous que Supabase est correctement configuré

## 📞 Support

- [Documentation Capacitor iOS](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Ionic Forum](https://forum.ionicframework.com/)

## ✅ Checklist Finale Avant Soumission

- [ ] Toutes les icônes sont personnalisées
- [ ] Les splash screens sont configurés
- [ ] Les permissions sont justifiées dans Info.plist
- [ ] L'app fonctionne sur simulateur et appareil réel
- [ ] Pas de données de test en dur
- [ ] Les clés API Supabase sont correctes
- [ ] Version et Build number sont à jour
- [ ] Screenshots App Store préparés
- [ ] Description et métadonnées rédigées
- [ ] Politique de confidentialité créée
- [ ] Tests d'accessibilité effectués

---

**Bon déploiement ! 🚀**
