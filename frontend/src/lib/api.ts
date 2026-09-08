const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const AUTH_TOKEN_KEY = "typeform_token";
export const AUTH_USER_KEY = "typeform_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuth(token: string, user: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function fetcher(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "An error occurred while fetching data";
    try {
      const error = await res.json();
      errorDetail = error.detail || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }

    if (res.status === 401 && typeof window !== "undefined") {
      // Don't clear on login/signup requests
      if (!url.startsWith("/auth/login") && !url.startsWith("/auth/signup")) {
        clearStoredAuth();
      }
    }

    throw new Error(errorDetail);
  }

  return res.json();
}
