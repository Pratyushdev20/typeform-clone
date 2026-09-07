"use client";

import { ToastProvider } from "../../../context/ToastContext";
import { FormBuilderView } from "../../../components/builder/FormBuilderView";

export default function FormBuilderPage() {
  return (
    <ToastProvider>
      <FormBuilderView />
    </ToastProvider>
  );
}
