"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "info" | "warning" | "error";
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "info" | "warning" | "error" = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: "12px 18px",
              borderRadius: "8px",
              background:
                toast.type === "error"
                  ? "#dc2626"
                  : toast.type === "warning"
                  ? "#d97706"
                  : toast.type === "info"
                  ? "#2563eb"
                  : "#18181b",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              pointerEvents: "auto",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span>
              {toast.type === "success" && "✓"}
              {toast.type === "info" && "ℹ"}
              {toast.type === "warning" && "⚠"}
              {toast.type === "error" && "✕"}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                marginLeft: "8px",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
