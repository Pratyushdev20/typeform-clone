"use client";

import { ToastProvider } from "../../../../context/ToastContext";
import { ProtectedRoute } from "../../../../components/auth/ProtectedRoute";
import { FormBuilderView } from "../../../../components/builder/FormBuilderView";

export default function FormBuilderEditPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <FormBuilderView />
      </ToastProvider>
    </ProtectedRoute>
  );
}
