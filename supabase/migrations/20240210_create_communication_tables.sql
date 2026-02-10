-- Create communication_campaigns table
CREATE TABLE IF NOT EXISTS public.communication_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    target_filter TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create communication_queue table
CREATE TABLE IF NOT EXISTS public.communication_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.communication_campaigns(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    phone TEXT,
    message_body TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_queue ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
DROP POLICY IF EXISTS "Allow authenticated to insert campaigns" ON public.communication_campaigns;
CREATE POLICY "Allow authenticated to insert campaigns" 
ON public.communication_campaigns FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to select campaigns" ON public.communication_campaigns;
CREATE POLICY "Allow authenticated to select campaigns" 
ON public.communication_campaigns FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to update campaigns" ON public.communication_campaigns;
CREATE POLICY "Allow authenticated to update campaigns" 
ON public.communication_campaigns FOR UPDATE 
TO authenticated 
USING (true);

-- Queue Policies
DROP POLICY IF EXISTS "Allow authenticated to insert queue" ON public.communication_queue;
CREATE POLICY "Allow authenticated to insert queue" 
ON public.communication_queue FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to select queue" ON public.communication_queue;
CREATE POLICY "Allow authenticated to select queue" 
ON public.communication_queue FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to update queue" ON public.communication_queue;
CREATE POLICY "Allow authenticated to update queue" 
ON public.communication_queue FOR UPDATE 
TO authenticated 
USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.communication_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_campaign_id ON public.communication_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_queue_status_scheduled ON public.communication_queue(status, scheduled_for);
