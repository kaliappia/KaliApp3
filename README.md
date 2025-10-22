# 📱 DSocial Calendar

Application sociale de gestion d'événements - Version Web + iOS

## 📂 Structure du Projet

```
KaliApp3/
├── web/                    ← 🌐 Code Web (React + Vite)
│   ├── src/               ← Composants React, pages, contexts
│   ├── public/            ← Assets statiques
│   ├── dist/              ← Build de production (généré)
│   ├── package.json       ← Dépendances web
│   ├── vite.config.ts     ← Configuration Vite
│   └── ...
│
├── ios/                    ← 📱 Code iOS (Capacitor + Xcode)
│   └── App/               ← Projet Xcode
│
├── scripts/                ← 🔧 Scripts utilitaires
│   └── setup-dev-server.sh
│
├── package.json            ← Scripts globaux (racine)
├── capacitor.config.ts     ← Configuration Capacitor (pointe vers web/dist)
├── vercel.json             ← Configuration Vercel (build depuis web/)
└── README.md               ← Ce fichier
```

## 🎯 Pourquoi Cette Structure ?

**Séparation claire des environnements:**
- ✅ Tester sur **Vercel** sans toucher au code iOS
- ✅ Tester sur **Xcode** sans toucher au code web
- ✅ Développement indépendant de chaque plateforme
- ✅ Évite les conflits entre web et mobile

## 🚀 Commandes Principales

### Développement Web (Vercel)

```bash
# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

### Développement iOS (Xcode)

```bash
# Build web + sync iOS + ouvrir Xcode
npm run ios:deploy

# Sync uniquement (après modification)
npm run ios:sync

# Ouvrir Xcode
npm run ios:open
```

### Live Reload iOS (optionnel)

```bash
# Configuration automatique
npm run ios:dev
# Puis suivre les instructions
```

## 📖 Workflow Recommandé

### 1. Tester sur Web (Vercel)

```bash
cd web
npm run dev
# Teste sur http://localhost:5173
```

Une fois satisfait:
```bash
npm run build
git add .
git commit -m "Update web app"
git push
# Vercel déploie automatiquement
```

### 2. Tester sur iOS (Xcode)

```bash
# Depuis la racine
npm run ios:deploy
# Xcode s'ouvre automatiquement
# Build & Run dans le simulateur iOS
```

## 🌐 Déploiement Vercel

**Configuration automatique:**
- Build: `cd web && npm run build`
- Output: `web/dist`
- Framework: Vite

**Variables d'environnement requises:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 Build iOS pour App Store

1. Ouvrir Xcode: `npm run ios:open`
2. Sélectionner "Any iOS Device"
3. Product → Archive
4. Distribute App → App Store Connect

Voir `iOS_DEPLOYMENT_GUIDE.md` pour les détails complets.

## 🔧 Scripts Disponibles

### Scripts Racine (package.json)

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur web (port 5173) |
| `npm run build` | Build web de production |
| `npm run preview` | Preview du build web |
| `npm run ios:deploy` | Build + Sync + Ouvrir Xcode |
| `npm run ios:sync` | Sync web/dist vers iOS |
| `npm run ios:open` | Ouvrir Xcode |

### Scripts Web (web/package.json)

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur dev avec HMR |
| `npm run build` | Build production |
| `npm run preview` | Preview du build |
| `npm run lint` | Linter ESLint |

## 🧪 Pages de Test

Après le build, les pages suivantes sont disponibles:

- `/` - Application principale
- `/test.html` - Test HTML pur (Vercel OK)
- `/diagnostic.html` - Diagnostic JavaScript
- `/setup.html` - Instructions Supabase

## 📦 Technologies

**Web:**
- React 18
- TypeScript
- Vite 6
- TailwindCSS
- Supabase
- i18next (internationalisation)

**iOS:**
- Capacitor 7
- Swift/Objective-C
- Xcode

## 🔄 Migration depuis l'Ancienne Structure

**Avant:**
```
KaliApp3/
├── src/
├── public/
├── dist/
└── ios/
```

**Après:**
```
KaliApp3/
├── web/              ← Tout le code web ici
│   ├── src/
│   ├── public/
│   └── dist/
└── ios/              ← Code iOS inchangé
```

## ⚠️ Important

- **Ne jamais modifier** `web/dist/` manuellement (généré automatiquement)
- **Toujours build** avant de sync iOS: `npm run build && npm run ios:sync`
- **Variables d'environnement** requises pour Supabase (voir `web/src/lib/supabase.ts`)

## 📚 Documentation Complète

- `iOS_DEPLOYMENT_GUIDE.md` - Guide déploiement App Store
- `LIVE_RELOAD_GUIDE.md` - Développement avec Live Reload
- `IPAD_TESTING_GUIDE.md` - Tests sur iPad sans Mac
- `TESTING_GUIDE.md` - Guide diagnostic écran blanc

## 🆘 Support

En cas de problème:

1. **Web ne build pas:** `cd web && rm -rf node_modules && npm install`
2. **iOS ne sync pas:** Vérifier `capacitor.config.ts` → `webDir: 'web/dist'`
3. **Écran blanc:** Voir `TESTING_GUIDE.md`
4. **Erreurs TypeScript:** Non-bloquantes, Vite build quand même

## 📄 Licence

Propriétaire - Tous droits réservés
