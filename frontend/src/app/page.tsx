"use client";

import { ToastProvider } from "../context/ToastContext";
import { Dashboard } from "../components/dashboard/Dashboard";

export default function HomePage() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
