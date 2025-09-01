-- Simple fix: Just drop the problematic policies directly
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "Promotors can upload message responses" ON storage.objects;
DROP POLICY IF EXISTS "Promotors can read their message responses" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all message responses" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete message responses" ON storage.objects;
