ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS resend_api_key text,
ADD COLUMN IF NOT EXISTS resend_from_email text;

-- Add comment to explain usage
COMMENT ON COLUMN public.system_settings.resend_api_key IS 'API Key for Resend email service integration';
COMMENT ON COLUMN public.system_settings.resend_from_email IS 'Sender email address for Resend (e.g. onboarding@resend.dev or verified domain)';
