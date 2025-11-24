import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ForceResetAuthPage() {
  // This runs on the server, bypassing CORS
  
  async function resetAuth() {
    'use server';
    
    const cookieStore = cookies();
    
    // Delete all Supabase cookies
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
        cookieStore.delete(cookie.name);
      }
    }
    
    redirect('/auth/promotors/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white p-8 shadow-lg max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">🚨 Auth Reset Required</h1>
        <p className="mb-4 text-gray-700">
          Your authentication is broken. This will force-reset your session.
        </p>
        <p className="mb-6 text-sm text-gray-500">
          This happens on the server, so it should work even with CORS errors.
        </p>
        <form action={resetAuth}>
          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
          >
            Force Reset & Go to Login
          </button>
        </form>
        <div className="mt-6 rounded-lg bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-800">⚠️ If this doesn't work:</p>
          <ol className="mt-2 list-inside list-decimal text-xs text-yellow-700 space-y-1">
            <li>Check Supabase dashboard for project status warnings</li>
            <li>Verify Authentication → URL Configuration settings</li>
            <li>Check if your project was paused or downgraded</li>
            <li>Look for CORS or origin restrictions in Settings</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

