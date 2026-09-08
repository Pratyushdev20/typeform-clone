"use client";

import { ToastProvider } from "../../context/ToastContext";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { AccountSettingsView } from "../../components/account/AccountSettingsView";

export default function AccountSettingsPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <AccountSettingsView />
      </ToastProvider>
    </ProtectedRoute>
  );
}
