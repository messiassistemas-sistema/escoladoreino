-- Arquivo: supabase/migrations/20240210_add_lesson_description.sql
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS description TEXT;
