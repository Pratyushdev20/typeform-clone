"use client";

import { ToastProvider } from "../../../../context/ToastContext";
import { FormBuilderView } from "../../../../components/builder/FormBuilderView";

export default function FormBuilderEditPage() {
  return (
    <ToastProvider>
      <FormBuilderView />
    </ToastProvider>
  );
}
