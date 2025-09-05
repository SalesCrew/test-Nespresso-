import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// WARNING: This endpoint is a MAJOR SECURITY RISK and should NEVER exist in production
// Passwords should NEVER be stored in plain text or be retrievable
// This is only for demonstration purposes as requested

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real system, passwords are hashed and cannot be retrieved
    // This would require storing passwords in plain text which is a major security violation
    
    // For demonstration, we'll return a placeholder or fetch from a hypothetical plain text storage
    // Check if password is stored in user metadata (NOT RECOMMENDED)
    const plainPassword = user.user_metadata?.plain_password;
    
    if (plainPassword) {
      return NextResponse.json({ password: plainPassword });
    }
    
    // Try to fetch from a hypothetical passwords table (NEVER DO THIS IN PRODUCTION)
    const { data: passwordData } = await supabase
      .from('user_passwords') // This table should not exist in a secure system
      .select('password')
      .eq('user_id', user.id)
      .single();
    
    if (passwordData?.password) {
      return NextResponse.json({ password: passwordData.password });
    }
    
    // Return empty if no password found
    return NextResponse.json({ password: '' });
    
  } catch (error) {
    console.error('Error fetching password:', error);
    return NextResponse.json({ error: 'Failed to fetch password' }, { status: 500 });
  }
}
