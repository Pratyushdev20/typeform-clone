"use client";

import { ToastProvider } from "../../context/ToastContext";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { Dashboard } from "../../components/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </ProtectedRoute>
  );
}
