-- Krankenstand and Notfall Request System
-- Step 1: Create request table for krankenstand/notfall requests

CREATE TABLE IF NOT EXISTS public.special_status_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('krankenstand', 'notfall')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  reason text,
  requested_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create active status tracking table
CREATE TABLE IF NOT EXISTS public.active_special_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status_type text NOT NULL CHECK (status_type IN ('krankenstand', 'notfall')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_special_status_requests_user_status 
ON public.special_status_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_special_status_requests_status_created 
ON public.special_status_requests(status, created_at);

CREATE INDEX IF NOT EXISTS idx_active_special_status_user_active 
ON public.active_special_status(user_id, is_active);

-- Step 4: Enable RLS
ALTER TABLE public.special_status_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_special_status ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies

-- Special status requests policies
CREATE POLICY "Users can view their own requests" 
ON public.special_status_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" 
ON public.special_status_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" 
ON public.special_status_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_of_admins', 'admin_staff')
  )
);

CREATE POLICY "Admins can update requests" 
ON public.special_status_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_of_admins', 'admin_staff')
  )
);

-- Active special status policies
CREATE POLICY "Users can view their own status" 
ON public.active_special_status FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own status" 
ON public.active_special_status FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statuses" 
ON public.active_special_status FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_of_admins', 'admin_staff')
  )
);

CREATE POLICY "Admins can manage all statuses" 
ON public.active_special_status FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_of_admins', 'admin_staff')
  )
);

-- Step 6: Create function to auto-apply special status to new day's assignments
CREATE OR REPLACE FUNCTION apply_special_status_to_assignments()
RETURNS void AS $$
BEGIN
  -- Update today's assignments for users with active special status
  UPDATE assignments 
  SET special_status = ass.status_type
  FROM active_special_status ass
  WHERE assignments.date = CURRENT_DATE
    AND ass.is_active = true
    AND ass.user_id IN (
      SELECT ap.user_id 
      FROM assignment_participants ap 
      WHERE ap.assignment_id = assignments.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to handle request approval
CREATE OR REPLACE FUNCTION approve_special_status_request(
  request_id uuid,
  admin_user_id uuid
)
RETURNS void AS $$
DECLARE
  req_record special_status_requests;
BEGIN
  -- Get the request details
  SELECT * INTO req_record 
  FROM special_status_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Update request status
  UPDATE special_status_requests 
  SET status = 'approved', 
      reviewed_by = admin_user_id, 
      reviewed_at = now(),
      updated_at = now()
  WHERE id = request_id;
  
  -- Create or update active status
  INSERT INTO active_special_status (
    user_id, 
    status_type, 
    started_at, 
    is_active
  ) VALUES (
    req_record.user_id, 
    req_record.request_type, 
    now(), 
    true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status_type = EXCLUDED.status_type,
    started_at = EXCLUDED.started_at,
    ended_at = null,
    is_active = true,
    updated_at = now();
  
  -- Apply special status to today's assignments
  UPDATE assignments 
  SET special_status = req_record.request_type,
      updated_at = now()
  WHERE date = CURRENT_DATE
    AND id IN (
      SELECT ap.assignment_id 
      FROM assignment_participants ap 
      WHERE ap.user_id = req_record.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
