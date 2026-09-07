"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLanding } from "../components/landing/MarketingLanding";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("workspace") === "1") {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleStart = () => {
    router.push("/dashboard");
  };

  return <MarketingLanding onStart={handleStart} />;
}
