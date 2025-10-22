# 🔐 Configuration Supabase pour DSocial Calendar

## 📋 Vue d'Ensemble

Ce guide t'aide à configurer Supabase correctement pour que l'authentification et la base de données fonctionnent.

## ⚙️ 1. Désactiver l'Email Confirmation (Recommandé pour le dev)

Par défaut, Supabase demande aux utilisateurs de confirmer leur email avant de pouvoir se connecter. Pour le développement, tu peux le désactiver:

### Dans le Dashboard Supabase:

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. **Authentication** → **Providers** → **Email**
4. Trouve **"Confirm email"**
5. **Désactive** cette option
6. Clique **Save**

✅ Maintenant les utilisateurs peuvent s'inscrire et se connecter immédiatement!

### Si tu gardes l'Email Confirmation activée:

- L'utilisateur reçoit un email après inscription
- Il doit cliquer sur le lien de confirmation
- Puis il peut se connecter

L'app gère les deux cas automatiquement!

## 🗄️ 2. Créer les Tables

### Table `profiles`

```sql
-- Créer la table profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  email TEXT,
  calendar_visibility TEXT DEFAULT 'public' CHECK (calendar_visibility IN ('public', 'private')),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_email_idx ON profiles(email);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table `events`

```sql
-- Créer la table events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_name TEXT,
  organizer_avatar TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends')),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX events_organizer_id_idx ON events(organizer_id);
CREATE INDEX events_start_date_idx ON events(start_date);
CREATE INDEX events_visibility_idx ON events(visibility);

-- Trigger pour updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table `organizers`

```sql
-- Créer la table organizers
CREATE TABLE organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  followers INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX organizers_name_idx ON organizers(name);
```

### Table `event_attendees`

```sql
-- Créer la table event_attendees (participants aux événements)
CREATE TABLE event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Index
CREATE INDEX event_attendees_event_id_idx ON event_attendees(event_id);
CREATE INDEX event_attendees_user_id_idx ON event_attendees(user_id);
```

## 🔒 3. Configurer les Row Level Security (RLS)

### Activer RLS sur toutes les tables

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
```

### Policies pour `profiles`

```sql
-- Tout le monde peut lire les profils publics
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Policies pour `events`

```sql
-- Tout le monde peut lire les événements publics
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (visibility = 'public' OR organizer_id = auth.uid());

-- Les utilisateurs authentifiés peuvent créer des événements
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Les organisateurs peuvent modifier leurs événements
CREATE POLICY "Organizers can update their own events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Les organisateurs peuvent supprimer leurs événements
CREATE POLICY "Organizers can delete their own events"
  ON events FOR DELETE
  USING (organizer_id = auth.uid());
```

### Policies pour `organizers`

```sql
-- Tout le monde peut lire les organisateurs
CREATE POLICY "Organizers are viewable by everyone"
  ON organizers FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent créer des organisateurs (pour l'admin)
CREATE POLICY "Authenticated users can manage organizers"
  ON organizers FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Policies pour `event_attendees`

```sql
-- Tout le monde peut voir qui participe aux événements publics
CREATE POLICY "Event attendees are viewable for public events"
  ON event_attendees FOR SELECT
  USING (true);

-- Les utilisateurs peuvent s'ajouter à un événement
CREATE POLICY "Users can add themselves to events"
  ON event_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leur statut
CREATE POLICY "Users can update their own attendance"
  ON event_attendees FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent se retirer d'un événement
CREATE POLICY "Users can remove themselves from events"
  ON event_attendees FOR DELETE
  USING (auth.uid() = user_id);
```

## 🔗 4. Configurer les Variables d'Environnement sur Vercel

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet **KaliApp3**
3. **Settings** → **Environment Variables**
4. Ajoute ces 2 variables:

```
VITE_SUPABASE_URL=https://[ton-projet].supabase.co
VITE_SUPABASE_ANON_KEY=[ta-clé-anon]
```

### Où trouver ces valeurs?

Sur Supabase:
1. **Settings** → **API**
2. **Project URL** → copie dans `VITE_SUPABASE_URL`
3. **Project API keys** → **anon public** → copie dans `VITE_SUPABASE_ANON_KEY`

5. **Redéploie** sur Vercel après avoir ajouté les variables

## ✅ 5. Tester l'Authentification

### Test de Sign Up:

1. Va sur ton URL Vercel: `https://[ton-app].vercel.app/signup`
2. Crée un compte avec:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`

### Si email confirmation est **désactivée**:
✅ Tu es connecté immédiatement et redirigé vers l'app

### Si email confirmation est **activée**:
📧 Tu vois un message "Check Your Email"
→ Vérifie ton email
→ Clique sur le lien de confirmation
→ Retourne sur /login et connecte-toi

## 🐛 Debug en Cas de Problème

### Erreur: "Failed to create profile"

**Cause:** La table `profiles` n'existe pas ou les policies RLS bloquent

**Solution:**
1. Vérifie que la table existe: SQL Editor → `SELECT * FROM profiles;`
2. Vérifie les policies RLS sont créées
3. Regarde les logs dans Supabase Dashboard → Logs

### Erreur: "Username already taken"

**Cause:** Le username existe déjà dans la base

**Solution:**
1. Utilise un username différent
2. Ou supprime l'ancien: `DELETE FROM profiles WHERE username = 'testuser';`

### Erreur: "Email not confirmed"

**Cause:** Email confirmation est activée et l'email n'a pas été confirmé

**Solution:**
1. Vérifie ton email (inbox + spam)
2. Ou désactive email confirmation (voir étape 1)

### L'app ne charge pas après login

**Cause:** Problème de chargement du profil

**Solution:**
1. Ouvre la console navigateur (F12)
2. Regarde les erreurs dans la console
3. Vérifie que le profil existe: SQL Editor → `SELECT * FROM profiles WHERE id = '[user-id]';`

## 📊 Vérifier que Tout Fonctionne

### Dans Supabase Dashboard:

1. **Authentication** → **Users** → Tu devrais voir ton utilisateur
2. **Table Editor** → **profiles** → Tu devrais voir ton profil
3. **Table Editor** → **events** → Crée un événement dans l'app, vérifie qu'il apparaît

### Dans l'App:

1. **Sign Up** → Créer un compte → ✅ Succès
2. **Login** → Se connecter → ✅ Redirigé vers /
3. **Create Event** → Créer un événement → ✅ Apparaît dans Calendar
4. **Sign Out** → Se déconnecter → ✅ Redirigé vers /login

## 🎯 Résumé

✅ **Email confirmation** désactivée (recommandé pour dev)
✅ **Tables** créées (profiles, events, organizers, event_attendees)
✅ **RLS policies** configurées
✅ **Variables d'environnement** ajoutées sur Vercel
✅ **Redéploiement** Vercel effectué

**L'app devrait maintenant fonctionner avec Supabase! 🚀**

## 💡 Prochaines Étapes

- Ajoute des données de test dans Supabase
- Crée plusieurs comptes pour tester
- Partage des événements entre utilisateurs
- Configure un domaine personnalisé sur Vercel

---

Des questions? Vérifie les logs dans:
- **Navigateur:** F12 → Console
- **Supabase:** Dashboard → Logs
- **Vercel:** Dashboard → Deployments → Function Logs
