-- SQL Script for ArchionLabs Landing Page Dashboard
-- Run this in your Supabase SQL Editor

-- 1. Ensure columns exist (running individual ALTERs for idempotency)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_project_id TEXT;

-- 2. Ensure Row Level Security is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. Create Unique Index for Deduplication
-- This prevents the same build/viewer project from appearing twice on the dashboard
DROP INDEX IF EXISTS idx_projects_source_dedup;
CREATE UNIQUE INDEX idx_projects_source_dedup
    ON public.projects (user_id, source, source_project_id)
    WHERE source_project_id IS NOT NULL;

-- 4. Set up Policies (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own projects.') THEN
        CREATE POLICY "Users can view their own projects." ON public.projects FOR SELECT USING ( auth.uid() = user_id );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own projects.') THEN
        CREATE POLICY "Users can insert their own projects." ON public.projects FOR INSERT WITH CHECK ( auth.uid() = user_id );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own projects.') THEN
        CREATE POLICY "Users can update their own projects." ON public.projects FOR UPDATE USING ( auth.uid() = user_id );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own projects.') THEN
        CREATE POLICY "Users can delete their own projects." ON public.projects FOR DELETE USING ( auth.uid() = user_id );
    END IF;
END
$$;
