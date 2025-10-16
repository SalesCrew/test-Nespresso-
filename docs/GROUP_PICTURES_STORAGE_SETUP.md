# Group Chat Pictures Storage Setup

## Overview
This guide explains how to set up the Supabase Storage bucket for group chat profile pictures.

## Steps

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `group-chat-pictures`
   - **Public bucket**: ✅ **YES** (checked) - for easier access
   - Click **Create bucket**

### 2. Set Up Storage Policies (Public Bucket)

Since this is a public bucket, you need to set policies:

1. Click on the `group-chat-pictures` bucket
2. Click **Policies** tab
3. Click **New policy**

#### Policy 1: Allow authenticated users to read
- **Policy name**: `Allow authenticated users to read group pictures`
- **Allowed operation**: `SELECT`
- **Policy definition** (copy-paste):
```sql
(bucket_id = 'group-chat-pictures') AND (auth.role() = 'authenticated')
```
- Click **Review** → **Save policy**

#### Policy 2: Allow admins to upload
- **Policy name**: `Allow admins to upload group pictures`
- **Allowed operation**: `INSERT`
- **Policy definition** (copy-paste):
```sql
(bucket_id = 'group-chat-pictures')
AND (
  auth.uid() IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['admin_staff'::text, 'admin_of_admins'::text])
  )
)
```
- Click **Review** → **Save policy**

#### Policy 3: Allow admins to update
- **Policy name**: `Allow admins to update group pictures`
- **Allowed operation**: `UPDATE`
- **Policy definition** (copy-paste):
```sql
(bucket_id = 'group-chat-pictures')
AND (
  auth.uid() IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['admin_staff'::text, 'admin_of_admins'::text])
  )
)
```
- Click **Review** → **Save policy**

#### Policy 4: Allow admins to delete
- **Policy name**: `Allow admins to delete group pictures`
- **Allowed operation**: `DELETE`
- **Policy definition** (copy-paste):
```sql
(bucket_id = 'group-chat-pictures')
AND (
  auth.uid() IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['admin_staff'::text, 'admin_of_admins'::text])
  )
)
```
- Click **Review** → **Save policy**

### 3. Run Database Migration

Run the SQL schema file to add the `profile_picture_url` column to `chat_conversations`:

1. Go to **SQL Editor** in Supabase
2. Copy the contents of `docs/chat-group-pictures-schema.sql`
3. Paste and **Run** the SQL

### 4. Verify Setup

- Check that the bucket exists and is public
- Check that all 4 RLS policies are active
- Check that `chat_conversations` table has the new `profile_picture_url` column

## Done!

Your group chat pictures storage is now ready to use.

