"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PromotorsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/promotors/dashboard");
  }, [router]);

  return null;
} 