# Market Photos Storage Setup Instructions

**DO NOT run SQL directly** - Supabase doesn't allow direct modification of storage tables via SQL.

Instead, use the Supabase Dashboard UI:

## Step 1: Create the Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Bucket name: `market-photos`
4. **Public bucket**: ✅ CHECKED (public for easier admin access)
5. **File size limit**: 10 MB (10485760 bytes)
6. **Allowed MIME types**: 
   - image/jpeg
   - image/jpg
   - image/png
   - image/webp
7. Click **"Create bucket"**

## Step 2: Set Up RLS Policies

After creating the bucket, click on it, then go to **"Policies"** tab:

### Policy 1: Admins can upload photos
- **Name**: Admins can upload market photos
- **Policy command**: INSERT
- **Target roles**: authenticated
- **WITH CHECK expression**:
```sql
bucket_id = 'market-photos' 
AND EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_id = auth.uid()
  AND role IN ('admin_of_admins', 'admin_staff')
)
```

### Policy 2: Authenticated users can view photos
- **Name**: Authenticated users can view market photos
- **Policy command**: SELECT
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'market-photos'
```

### Policy 3: Admins can delete photos
- **Name**: Admins can delete market photos
- **Policy command**: DELETE
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'market-photos'
AND EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_id = auth.uid()
  AND role IN ('admin_of_admins', 'admin_staff')
)
```

## Step 3: Test

After setting up:
1. Refresh the Märkte page
2. Try uploading a photo in any category
3. It should upload successfully and display!

## File Path Structure

Files are stored as:
```
market-photos/
  {marketId}/
    internal/
      {timestamp}-{filename}
    exterior/
      {timestamp}-{filename}
    interior/
      {timestamp}-{filename}
    products/
      {timestamp}-{filename}
```

This organization:
- Keeps files organized by market and photo type
- Allows proper RLS policies
- Makes cleanup easier when markets are deleted

