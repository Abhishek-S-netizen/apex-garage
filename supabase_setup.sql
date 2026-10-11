-- ══════════════════════════════════════════════════════════════════
-- APEX GARAGE — 1-CLICK SUPABASE SETUP SCRIPT
-- Copy and paste this into your Supabase Dashboard -> SQL Editor -> Run
-- ══════════════════════════════════════════════════════════════════

-- 1. Create the unified vault table for your garage fleet and state
CREATE TABLE IF NOT EXISTS public.apex_vault (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security so your app can read/write without complex login rules
ALTER TABLE public.apex_vault DISABLE ROW LEVEL SECURITY;

-- 2. Create the public storage bucket for vehicle photography
INSERT INTO storage.buckets (id, name, public)
VALUES ('garage-photos', 'garage-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public uploads and viewing for garage photos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access Garage Photos'
    ) THEN
        CREATE POLICY "Public Access Garage Photos"
        ON storage.objects FOR ALL
        USING (bucket_id = 'garage-photos')
        WITH CHECK (bucket_id = 'garage-photos');
    END IF;
END $$;
