-- Debug user profile issue

-- 1. Check if your user has a profile
SELECT * FROM public.user_profiles 
WHERE user_id = '4b6151ce-199e-4f7f-96e7-cd433c986d4a';

-- 2. Check all admin users
SELECT user_id, role, display_name 
FROM public.user_profiles 
WHERE role IN ('admin_of_admins', 'admin_staff');

-- 3. Check if there are any profiles at all
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 4. Check your auth user
SELECT id, email, role FROM auth.users 
WHERE id = '4b6151ce-199e-4f7f-96e7-cd433c986d4a';
