-- Complete Krankenstand/Notfall System Implementation
-- Creates all missing tables and functions for the special status request system

-- 1. Create special_status_requests table
CREATE TABLE IF NOT EXISTS public.special_status_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    request_type TEXT NOT NULL CHECK (request_type IN ('krankenstand', 'notfall')),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create active_special_status table
CREATE TABLE IF NOT EXISTS public.active_special_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status_type TEXT NOT NULL CHECK (status_type IN ('krankenstand', 'notfall')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, is_active) -- Only one active status per user
);

-- 3. Create RLS policies for special_status_requests
ALTER TABLE public.special_status_requests ENABLE ROW LEVEL SECURITY;

-- Promotors can create their own requests
CREATE POLICY "special_status_requests_create_own" ON public.special_status_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Promotors can view their own requests
CREATE POLICY "special_status_requests_view_own" ON public.special_status_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view and update all requests
CREATE POLICY "special_status_requests_admin_full" ON public.special_status_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin_of_admins', 'admin_staff')
        )
    );

-- 4. Create RLS policies for active_special_status
ALTER TABLE public.active_special_status ENABLE ROW LEVEL SECURITY;

-- Users can view their own active status
CREATE POLICY "active_special_status_view_own" ON public.active_special_status
    FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own active status
CREATE POLICY "active_special_status_delete_own" ON public.active_special_status
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can view and manage all active statuses
CREATE POLICY "active_special_status_admin_full" ON public.active_special_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin_of_admins', 'admin_staff')
        )
    );

-- 5. Create the approve_special_status_request function
CREATE OR REPLACE FUNCTION approve_special_status_request(
    request_id UUID,
    admin_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_record RECORD;
BEGIN
    -- Get the request details
    SELECT * INTO req_record 
    FROM public.special_status_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
    
    -- Update request status
    UPDATE public.special_status_requests 
    SET 
        status = 'approved',
        reviewed_by = admin_user_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Create/update active special status
    INSERT INTO public.active_special_status (user_id, status_type, is_active)
    VALUES (req_record.user_id, req_record.request_type, true)
    ON CONFLICT (user_id, is_active) 
    DO UPDATE SET 
        status_type = req_record.request_type,
        started_at = NOW(),
        updated_at = NOW();
    
    -- Apply status to today's assignments for this user
    UPDATE public.assignments 
    SET 
        special_status = req_record.request_type,
        updated_at = NOW()
    WHERE id IN (
        SELECT ap.assignment_id 
        FROM public.assignment_participants ap
        JOIN public.assignments a ON ap.assignment_id = a.id
        WHERE ap.user_id = req_record.user_id
        AND DATE(a.start_ts AT TIME ZONE 'Europe/Vienna') = CURRENT_DATE
    );
END;
$$;

-- 6. Create the decline_special_status_request function
CREATE OR REPLACE FUNCTION decline_special_status_request(
    request_id UUID,
    admin_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update request status to declined
    UPDATE public.special_status_requests 
    SET 
        status = 'declined',
        reviewed_by = admin_user_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.special_status_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_special_status TO authenticated;
GRANT EXECUTE ON FUNCTION approve_special_status_request TO authenticated;
GRANT EXECUTE ON FUNCTION decline_special_status_request TO authenticated;
