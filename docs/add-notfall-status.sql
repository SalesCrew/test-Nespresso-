-- Add 'notfall' to tracking_status enum

-- Add the new value to the existing enum
ALTER TYPE tracking_status ADD VALUE IF NOT EXISTS 'notfall';
