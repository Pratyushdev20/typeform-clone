"use client";

import { ToastProvider } from "../../context/ToastContext";
import { HelpCenterView } from "../../components/help/HelpCenterView";

export default function HelpPage() {
  return (
    <ToastProvider>
      <HelpCenterView />
    </ToastProvider>
  );
}
