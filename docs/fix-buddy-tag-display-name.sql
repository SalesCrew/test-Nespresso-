-- Fix buddy tag display name to remove "Promotor &" prefix
-- This updates the assignment_details_with_participants view

DROP VIEW IF EXISTS assignment_details_with_participants CASCADE;

CREATE OR REPLACE VIEW assignment_details_with_participants AS
SELECT 
  a.*,
  -- Get lead participant info
  lead_participant.user_id AS lead_user_id,
  lead_profile.display_name AS lead_display_name,
  -- Get buddy participant info (for buddy tags) - renamed to avoid conflict
  buddy_participant.user_id AS buddy_participant_user_id,
  buddy_profile.display_name AS buddy_participant_display_name,
  -- Computed display name based on assignment type
  CASE 
    WHEN a.status = 'buddy_tag' THEN 
      CASE
        WHEN lead_profile.display_name IS NOT NULL AND (a.buddy_name IS NOT NULL OR buddy_profile.display_name IS NOT NULL) THEN
          CONCAT(lead_profile.display_name, ' & ', COALESCE(a.buddy_name, buddy_profile.display_name, 'Buddy'))
        WHEN lead_profile.display_name IS NOT NULL THEN
          lead_profile.display_name
        WHEN a.buddy_name IS NOT NULL OR buddy_profile.display_name IS NOT NULL THEN
          COALESCE(a.buddy_name, buddy_profile.display_name, 'Buddy')
        ELSE
          NULL
      END
    WHEN a.status = 'assigned' THEN lead_profile.display_name
    ELSE NULL
  END AS display_name,
  -- Count of total participants
  (SELECT COUNT(*) FROM assignment_participants WHERE assignment_id = a.id) AS participant_count,
  -- Array of all participant IDs
  ARRAY(
    SELECT user_id 
    FROM assignment_participants 
    WHERE assignment_id = a.id
    ORDER BY role, created_at
  ) AS participant_ids
FROM 
  assignments a
  LEFT JOIN assignment_participants lead_participant 
    ON a.id = lead_participant.assignment_id AND lead_participant.role = 'lead'
  LEFT JOIN user_profiles lead_profile 
    ON lead_participant.user_id = lead_profile.user_id
  LEFT JOIN assignment_participants buddy_participant 
    ON a.id = buddy_participant.assignment_id AND buddy_participant.role = 'buddy'
  LEFT JOIN user_profiles buddy_profile 
    ON buddy_participant.user_id = buddy_profile.user_id;
