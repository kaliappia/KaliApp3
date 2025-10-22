-- ============================================
-- DSocial Calendar - Initial Database Schema
-- ============================================
-- Copy-paste ce fichier ENTIER dans Supabase SQL Editor et exécute-le
-- Cela va créer toutes les tables et policies en une seule fois

-- ============================================
-- 1. CRÉER LES TABLES
-- ============================================

-- Table profiles
CREATE TABLE IF NOT EXISTS profiles (
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

-- Table events
CREATE TABLE IF NOT EXISTS events (
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

-- Table organizers
CREATE TABLE IF NOT EXISTS organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  followers INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table event_attendees
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- 2. CRÉER LES INDEX
-- ============================================

-- Index pour profiles
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Index pour events
CREATE INDEX IF NOT EXISTS events_organizer_id_idx ON events(organizer_id);
CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(start_date);
CREATE INDEX IF NOT EXISTS events_visibility_idx ON events(visibility);

-- Index pour organizers
CREATE INDEX IF NOT EXISTS organizers_name_idx ON organizers(name);

-- Index pour event_attendees
CREATE INDEX IF NOT EXISTS event_attendees_event_id_idx ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS event_attendees_user_id_idx ON event_attendees(user_id);

-- ============================================
-- 3. CRÉER LA FONCTION updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CRÉER LES TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ACTIVER ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. POLICIES POUR profiles
-- ============================================

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

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

-- ============================================
-- 7. POLICIES POUR events
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Organizers can update their own events" ON events;
DROP POLICY IF EXISTS "Organizers can delete their own events" ON events;

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

-- ============================================
-- 8. POLICIES POUR organizers
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Organizers are viewable by everyone" ON organizers;
DROP POLICY IF EXISTS "Authenticated users can manage organizers" ON organizers;

-- Tout le monde peut lire les organisateurs
CREATE POLICY "Organizers are viewable by everyone"
  ON organizers FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent créer/modifier des organisateurs
CREATE POLICY "Authenticated users can manage organizers"
  ON organizers FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 9. POLICIES POUR event_attendees
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Event attendees are viewable for public events" ON event_attendees;
DROP POLICY IF EXISTS "Users can add themselves to events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own attendance" ON event_attendees;
DROP POLICY IF EXISTS "Users can remove themselves from events" ON event_attendees;

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

-- ============================================
-- ✅ MIGRATION TERMINÉE!
-- ============================================
-- Toutes les tables, index, triggers et policies sont créés
