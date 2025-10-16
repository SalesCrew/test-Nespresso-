import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Uploads a group chat profile picture to Supabase Storage
 * @param file - The image file to upload
 * @param conversationId - The conversation ID (optional, for updates)
 * @returns The public URL of the uploaded file
 */
export async function uploadGroupPicture(
  file: File,
  conversationId?: string | number
): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image must be smaller than 5MB');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${conversationId || 'new'}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('group-chat-pictures')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading group picture:', error);
    throw error;
  }

  // Get public URL (since bucket is public)
  const { data: urlData } = supabase.storage
    .from('group-chat-pictures')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Deletes an old group picture from storage
 * @param pictureUrl - The URL of the picture to delete
 */
export async function deleteGroupPicture(pictureUrl: string): Promise<void> {
  if (!pictureUrl) return;

  const supabase = createSupabaseBrowserClient();

  try {
    // Extract filename from URL
    const urlParts = pictureUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    await supabase.storage
      .from('group-chat-pictures')
      .remove([fileName]);
  } catch (error) {
    console.error('Error deleting old group picture:', error);
    // Don't throw - deletion failure shouldn't block the upload
  }
}

