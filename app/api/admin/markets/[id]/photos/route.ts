import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// DELETE - Remove photo from market
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient();
    const service = createSupabaseServiceClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await server.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const marketId = params.id;
    const body = await req.json();
    const { photo_type, photo_index } = body;

    if (!photo_type || photo_index === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current photos array
    const photoField = `photos_${photo_type}`;
    const { data: currentMarket, error: fetchError } = await service
      .from('markets')
      .select(photoField)
      .eq('id', marketId)
      .single();

    if (fetchError || !currentMarket) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    const currentPhotos = (currentMarket as any)[photoField] || [];
    
    if (photo_index < 0 || photo_index >= currentPhotos.length) {
      return NextResponse.json({ error: 'Invalid photo index' }, { status: 400 });
    }

    // Get photo URL to delete from storage
    const photoToDelete = currentPhotos[photo_index];
    
    // Remove photo from array
    const updatedPhotos = currentPhotos.filter((_: any, idx: number) => idx !== photo_index);

    // Update market's photos array
    const { error: updateError } = await service
      .from('markets')
      .update({ [photoField]: updatedPhotos })
      .eq('id', marketId);

    if (updateError) {
      console.error('Error updating market photos:', updateError);
      return NextResponse.json({ error: 'Failed to update photos' }, { status: 500 });
    }

    // Try to delete file from storage (extract path from URL)
    if (photoToDelete?.url) {
      try {
        const urlObj = new URL(photoToDelete.url);
        const pathMatch = urlObj.pathname.match(/market-photos\/(.+)/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          await service.storage
            .from('market-photos')
            .remove([filePath]);
        }
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue even if storage delete fails
      }
    }

    return NextResponse.json({ 
      success: true,
      photos: updatedPhotos
    });
  } catch (error) {
    console.error('Unexpected error in photo delete:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

