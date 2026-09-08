"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { MarketingLanding } from "../components/landing/MarketingLanding";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("workspace") === "1") {
        router.push(user ? "/dashboard" : "/login");
      }
    }
  }, [router, user]);

  const handleStart = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  return (
    <MarketingLanding
      onStart={handleStart}
      onLogin={handleLogin}
      onSignup={handleSignup}
    />
  );
}
