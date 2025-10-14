# Chat Storage Setup Instructions

**DO NOT run the SQL file** - Supabase doesn't allow direct modification of storage tables via SQL.

Instead, use the Supabase Dashboard UI:

## Step 1: Create the Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Bucket name: `chat-attachments`
4. **Public bucket**: ❌ UNCHECKED (private)
5. **File size limit**: 10 MB
6. **Allowed MIME types**: 
   - image/jpeg
   - image/jpg
   - image/png
   - image/gif
   - image/webp
   - application/pdf
7. Click **"Create bucket"**

## Step 2: Set Up RLS Policies

After creating the bucket, click on it, then go to **"Policies"** tab:

### Policy 1: Upload Files
- **Name**: Users can upload chat attachments
- **Policy command**: INSERT
- **Target roles**: authenticated
- **WITH CHECK expression**:
```sql
bucket_id = 'chat-attachments' 
AND auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 2: View Files
- **Name**: Users can view chat attachments they have access to
- **Policy command**: SELECT
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'chat-attachments'
AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  (storage.foldername(name))[2] IN (
    SELECT conversation_id::text 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
)
```

### Policy 3: Delete Files
- **Name**: Users can delete their own chat attachments
- **Policy command**: DELETE
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'chat-attachments'
AND auth.uid()::text = (storage.foldername(name))[1]
```

## Step 3: Test

After setting up:
1. Refresh your chat page
2. Try sending a photo or PDF
3. It should upload successfully and persist!

## File Path Structure

Files are stored as:
```
chat-attachments/
  {userId}/
    {conversationId}/
      {timestamp}-{filename}
```

This organization:
- Keeps files organized by user and conversation
- Allows proper RLS policies
- Makes cleanup easier if needed

