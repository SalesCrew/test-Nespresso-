import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const result = await requireAdmin();
    return NextResponse.json({
      success: true,
      result: result
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
