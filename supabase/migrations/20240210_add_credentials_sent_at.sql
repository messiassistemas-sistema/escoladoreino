-- Add credentials_sent_at timestamp
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMP WITH TIME ZONE;

-- Drop function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS public.get_user_id_by_email(text);

-- Helper function to find auth user by email (needed for password resets)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE email = $1;
$$ LANGUAGE sql SECURITY DEFINER;
