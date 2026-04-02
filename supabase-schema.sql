-- ============================================
-- OMMI - Schema Base de Données Supabase
-- ============================================

-- Table des profils utilisateurs
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
    email TEXT NOT NULL,
    credits INTEGER DEFAULT 50,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des générations (historique)
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image-to-video', 'home-staging', 'video-maker')),
    input_url TEXT NOT NULL,
    output_url TEXT,
    credits_used INTEGER NOT NULL,
    settings JSONB,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies pour generations
CREATE POLICY "Users can view own generations"
    ON generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
    ON generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET CONFIGURATION
-- ============================================

-- Créer le bucket "uploads" via l'interface Supabase
-- Puis exécuter ces policies :

-- Policy pour upload
CREATE POLICY "Users can upload files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy pour lecture
CREATE POLICY "Users can read own files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy pour suppression
CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Insérer des plans par défaut si nécessaire
-- (Les crédits seront gérés via l'application)

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour déduire des crédits
CREATE OR REPLACE FUNCTION deduct_credits(user_uuid UUID, amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    SELECT credits INTO current_credits
    FROM profiles
    WHERE user_id = user_uuid
    FOR UPDATE;
    
    IF current_credits >= amount THEN
        UPDATE profiles
        SET credits = credits - amount
        WHERE user_id = user_uuid;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des crédits (lors d'un upgrade)
CREATE OR REPLACE FUNCTION add_credits(user_uuid UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET credits = credits + amount
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES
-- ============================================

-- 1. Exécuter ce script dans l'éditeur SQL de Supabase
-- 2. Créer le bucket "uploads" manuellement
-- 3. Configurer les policies de storage
-- 4. Tester avec un utilisateur de test