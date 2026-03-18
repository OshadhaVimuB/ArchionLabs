-- SQL Script for ArchionLabs Landing Page Dashboard
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Additional metadata fields for the modules can be added here
    modules_enabled JSONB DEFAULT '{"build": true, "sim": false, "viewer": true}'::jsonb
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects."
    ON public.projects FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own projects."
    ON public.projects FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own projects."
    ON public.projects FOR UPDATE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own projects."
    ON public.projects FOR DELETE
    USING ( auth.uid() = user_id );
