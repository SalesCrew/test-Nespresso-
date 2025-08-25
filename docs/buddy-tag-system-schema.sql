-- Buddy Tag System Database Migration - STEP 1
-- This migration adds full buddy tag support to the database
-- IMPORTANT: Run this in TWO SEPARATE STEPS due to PostgreSQL enum limitations

-- STEP 1: Add enum value (run this first, then commit)
-- Add 'buddy_tag' status to assignment_status enum
ALTER TYPE assignment_status ADD VALUE IF NOT EXISTS 'buddy_tag';

-- AFTER RUNNING THIS, COMMIT THE TRANSACTION
-- THEN RUN buddy-tag-system-schema-step2.sql