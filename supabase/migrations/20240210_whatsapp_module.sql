-- Create communication_campaigns table
CREATE TABLE IF NOT EXISTS public.communication_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL, -- 'all', 'class', etc.
    target_filter VARCHAR(255), -- specific class ID or other filter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'cancelled'))
);

-- Create communication_queue table
CREATE TABLE IF NOT EXISTS public.communication_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.communication_campaigns(id) ON DELETE CASCADE,
    student_id UUID, -- Optional link to student if you have a students table, otherwise store name
    student_name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'processing', 'sent', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    attempt_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_status_scheduled ON public.communication_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_queue_campaign_id ON public.communication_queue(campaign_id);

-- Enable RLS
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_queue ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on your actual roles, assuming authenticated admins can do everything)
CREATE POLICY "Admins can manage campaigns" ON public.communication_campaigns
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can manage queue" ON public.communication_queue
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
