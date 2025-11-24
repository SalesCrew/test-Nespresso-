import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    },
    deployment: {
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
    }
  };

  // Try to connect to Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    diagnostics.supabase = {
      healthCheckStatus: response.status,
      healthCheckOk: response.ok,
      canReachSupabase: true,
    };
  } catch (error: any) {
    diagnostics.supabase = {
      canReachSupabase: false,
      error: error.message,
    };
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

