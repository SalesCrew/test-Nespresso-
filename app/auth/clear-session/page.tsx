"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ClearSessionPage() {
  const [status, setStatus] = useState("Clearing session...");
  const router = useRouter();

  useEffect(() => {
    const clearEverything = async () => {
      try {
        // 1. Clear Supabase session
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut({ scope: 'local' });
        
        // 2. Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // 3. Clear localStorage
        localStorage.clear();
        
        // 4. Clear sessionStorage
        sessionStorage.clear();
        
        setStatus("✅ Session cleared! Redirecting to login...");
        
        // Wait 2 seconds then redirect
        setTimeout(() => {
          router.push("/auth/promotors/login");
        }, 2000);
      } catch (error) {
        console.error("Error clearing session:", error);
        setStatus("❌ Error clearing session. Redirecting anyway...");
        setTimeout(() => {
          router.push("/auth/promotors/login");
        }, 2000);
      }
    };

    clearEverything();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Clearing Session</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

