# 🔥 Guide Live Reload - Développement iOS en Temps Réel

Ce guide explique comment utiliser le Live Reload avec Capacitor pour développer votre app iOS avec rechargement automatique à chaque modification de code.

## 🎯 Qu'est-ce que le Live Reload ?

Le Live Reload vous permet de :
- ✅ Voir vos modifications de code instantanément sur votre iPhone/iPad
- ✅ Éviter de rebuilder et relancer l'app à chaque changement
- ✅ Gagner énormément de temps pendant le développement
- ✅ Tester sur un vrai appareil iOS en temps réel

## 📋 Prérequis

1. **Mac avec Xcode** installé
2. **iPhone ou iPad** physique (ou simulateur iOS)
3. **Même réseau WiFi** : Votre Mac et votre iPhone doivent être sur le même réseau
4. **Appareil connecté** : Pour la première installation, connectez votre iPhone via USB

## 🚀 Configuration Initiale (Une seule fois)

### Étape 1 : Trouver votre adresse IP locale

Sur votre Mac, ouvrez le Terminal et exécutez :

```bash
# Option 1 : Automatique
npm run ios:dev-setup

# Option 2 : Manuelle
ifconfig | grep "inet " | grep -v 127.0.0.1
# Cherchez une ligne comme : inet 192.168.1.100
```

### Étape 2 : Lancer la configuration

```bash
npm run ios:dev-setup
```

Le script va :
1. Détecter automatiquement votre IP locale
2. Créer un fichier `capacitor.config.dev.local.ts` avec votre IP
3. Afficher les prochaines étapes

**Note :** Si la détection automatique échoue, le script vous demandera de saisir votre IP manuellement.

## 🎬 Workflow de Développement Quotidien

### Option A : Commandes Étape par Étape (Recommandé pour débuter)

#### Terminal 1 : Démarrer le serveur de développement

```bash
npm run dev
```

Vous devriez voir :
```
VITE v6.2.3  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

**Important :** Notez l'URL "Network" - c'est celle que votre iPhone utilisera.

#### Terminal 2 : Synchroniser avec iOS

Dans un nouveau terminal :

```bash
# Synchroniser le projet iOS avec la config de dev
npm run ios:dev-sync

# Ouvrir Xcode
npm run ios:dev-open
```

#### Dans Xcode :

1. Sélectionnez votre iPhone comme destination
2. Cliquez sur ▶️ (Play) pour installer l'app
3. L'app se lance et se connecte à votre serveur de dev !

### Option B : Workflow Simplifié (Pour les habitués)

```bash
# 1. Setup (seulement si votre IP a changé)
npm run ios:dev-setup

# 2. Démarrer le dev server
npm run dev

# 3. Dans un autre terminal (une seule fois)
npm run ios:dev-sync && npm run ios:dev-open

# 4. Dans Xcode, lancer sur votre iPhone
```

## ✨ Utilisation Quotidienne

Une fois configuré, voici le workflow simple :

```bash
# Chaque matin / session de dev :

# 1. Démarrer le serveur
npm run dev

# 2. Lancer l'app sur votre iPhone depuis Xcode
# (Pas besoin de resync si vous n'avez pas changé d'IP)

# 3. Coder ! L'app se recharge automatiquement ✨
```

## 🎨 Exemple de Session de Développement

```bash
# Terminal 1
$ npm run dev
  VITE v6.2.3  ready in 234 ms
  ➜  Network: http://192.168.1.100:5173/

# L'app sur votre iPhone affiche maintenant votre code en direct !
# Modifiez src/pages/HomePage.tsx et sauvegardez...
# 🔄 L'app se recharge automatiquement sur votre iPhone !
```

## 🔧 Dépannage

### L'app affiche "Unable to connect to server"

**Cause :** Votre iPhone ne peut pas atteindre votre serveur de dev.

**Solutions :**

1. **Vérifiez le réseau WiFi :**
   ```bash
   # Sur Mac, vérifiez votre IP actuelle
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

   - Votre Mac et iPhone doivent être sur le **même réseau WiFi**
   - Pas de VPN actif qui bloquerait la connexion
   - Pas de pare-feu bloquant le port 5173

2. **Vérifiez que le serveur tourne :**
   ```bash
   npm run dev
   # Devrait afficher : Network: http://VOTRE_IP:5173/
   ```

3. **Testez depuis votre iPhone :**
   - Ouvrez Safari sur votre iPhone
   - Allez sur `http://VOTRE_IP:5173`
   - Vous devriez voir votre app

4. **Recréez la configuration :**
   ```bash
   rm capacitor.config.dev.local.ts
   npm run ios:dev-setup
   npm run ios:dev-sync
   ```

### Mon IP a changé

Si votre adresse IP locale change (nouveau réseau WiFi, DHCP, etc.) :

```bash
# Relancer la configuration
npm run ios:dev-setup

# Re-synchroniser
npm run ios:dev-sync
```

### Le Live Reload ne fonctionne pas

1. **Vérifiez que le serveur dev tourne :**
   ```bash
   # Vous devriez avoir un terminal avec Vite qui tourne
   npm run dev
   ```

2. **Vérifiez la configuration :**
   ```bash
   cat capacitor.config.dev.local.ts
   # Devrait contenir : url: 'http://VOTRE_IP:5173'
   ```

3. **Forcez un rechargement :**
   - Dans Xcode, arrêtez l'app (Stop ⏹️)
   - Relancez (Play ▶️)

### Erreurs de CORS

Si vous voyez des erreurs CORS dans la console :

Le serveur Vite est déjà configuré avec `--host` pour accepter les connexions réseau. Si le problème persiste :

```bash
# Vérifiez vite.config.ts
# Devrait contenir server.host: true
```

## 🏭 Production : N'oubliez pas de désactiver !

**IMPORTANT :** Le Live Reload est UNIQUEMENT pour le développement.

Avant de déployer en production ou de faire un build pour l'App Store :

```bash
# Utilisez la config de production normale
npm run ios:build
npm run ios:deploy
```

La configuration de production (`capacitor.config.ts`) ne contient PAS de `server.url`, donc l'app utilisera les fichiers locaux buildés.

## 📊 Comparaison des Workflows

| Workflow | Temps par modification | Cas d'usage |
|----------|----------------------|-------------|
| **Sans Live Reload** | ~2-3 minutes | Builds finaux |
| **Avec Live Reload** | ~2-5 secondes | Développement actif |
| **Simulateur iOS** | ~30-60 secondes | Tests rapides |
| **Webapp (navigateur)** | Instantané | UI/logique web |

## 🎯 Recommandations

### Pour le développement UI
✅ Utilisez Live Reload sur iPhone réel
- Taille d'écran exacte
- Performances réelles
- Gestes tactiles authentiques

### Pour les tests de fonctionnalités
✅ Utilisez le simulateur Xcode
- Plus rapide pour tester différents appareils
- Pas besoin de réseau

### Pour le debugging rapide
✅ Utilisez le navigateur (localhost:5173)
- React DevTools
- Console JavaScript
- Inspection d'éléments

## 🔐 Sécurité

Le serveur de dev (`http://VOTRE_IP:5173`) est accessible à tous les appareils sur votre réseau local.

**Bonnes pratiques :**
- ✅ Utilisez uniquement sur des réseaux de confiance (maison, bureau)
- ⚠️ Évitez les WiFi publics (café, aéroport)
- 🔒 Utilisez un VPN ou réseau privé pour plus de sécurité
- 🚫 Ne commitez JAMAIS `capacitor.config.dev.local.ts` (il est dans .gitignore)

## 💡 Astuces Pro

### 1. Alias pour aller plus vite

Ajoutez à votre `~/.zshrc` ou `~/.bashrc` :

```bash
alias devios='npm run dev'
alias syncios='npm run ios:dev-sync && npm run ios:dev-open'
```

Usage :
```bash
devios      # Terminal 1
syncios     # Terminal 2 (une seule fois)
```

### 2. Utiliser plusieurs appareils

Vous pouvez tester sur plusieurs iPhones/iPads simultanément !
- Installez l'app sur chaque appareil depuis Xcode
- Tous se connecteront au même serveur de dev
- Tous se rechargeront automatiquement

### 3. Inspecteur Safari pour débugger

1. Sur iPhone : Réglages > Safari > Avancé > Inspecteur Web (activé)
2. Sur Mac : Safari > Develop > [Votre iPhone] > DSocial Calendar (Dev)
3. Vous avez maintenant la console Safari pour débugger !

### 4. Network Tab pour les API

Utilisez l'inspecteur Safari pour :
- Voir les requêtes Supabase
- Débugger les erreurs API
- Monitorer les performances réseau

## 📚 Ressources Supplémentaires

- [Documentation Capacitor Live Reload](https://capacitorjs.com/docs/guides/live-reload)
- [Vite Configuration](https://vitejs.dev/config/)
- [Debugging iOS Web Apps](https://webkit.org/web-inspector/)

## ✅ Checklist de Setup

Avant votre première session de développement :

- [ ] Serveur de dev accessible : `npm run dev` affiche Network URL
- [ ] Configuration créée : `capacitor.config.dev.local.ts` existe
- [ ] iPhone sur le même WiFi que le Mac
- [ ] App installée sur iPhone depuis Xcode
- [ ] App se lance et affiche le contenu
- [ ] Modification de code déclenche un reload
- [ ] Inspecteur Safari activé (optionnel mais utile)

## 🎉 C'est Parti !

Vous êtes maintenant prêt à développer votre app iOS avec Live Reload !

```bash
# Let's go! 🚀
npm run dev
```

Bon développement ! 💪

---

**Astuce finale :** Gardez ce guide ouvert dans un onglet - vous le consulterez souvent au début. Rapidement, le workflow deviendra une seconde nature !
