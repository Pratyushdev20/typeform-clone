"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import { auth, googleProvider, microsoftProvider } from "../lib/firebase";
import { setStoredAuth, clearStoredAuth } from "../lib/api";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isLoading: boolean; // Alias for backward compatibility
  redirectPending: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, photoURL?: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  sendPasswordReset: (email?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function formatFirebaseError(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const code = error.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/cancelled-popup-request":
      // Happens when a second popup is opened before the first resolves — not an error
      return "";
    case "auth/popup-blocked":
      // Should not normally surface to the user since we auto-fall back to redirect,
      // but keep a friendly message as a safety net.
      return "Pop-up was blocked. Redirecting you to sign in\u2026";
    case "auth/redirect-cancelled-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/operation-not-allowed":
      return "This sign-in provider is not enabled in the Firebase Console.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email using a different sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication. Please add localhost to Authorized Domains in Firebase Console.";
    case "auth/requires-recent-login":
      return "This action requires recent authentication. Please log out and log back in.";
    default:
      if (error.message && typeof error.message === "string") {
        if (error.message.includes("configuration-not-found") || error.message.includes("OPERATION_NOT_ALLOWED")) {
          return "This authentication provider is not configured in Firebase Console. Please enable it in Authentication -> Sign-in method.";
        }
        return error.message.replace(/^Firebase:\s*/, "");
      }
      return "Authentication failed. Please try again.";
  }
}

/** Store token + authData for a Firebase user credential result. */
async function storeUserCredential(
  fbUser: FirebaseUser,
  providerId: string,
  setUser: (u: AuthUser) => void
) {
  const token = await fbUser.getIdToken();
  const authData: AuthUser = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
    photoURL: fbUser.photoURL,
    providerId,
  };
  setUser(authData);
  setStoredAuth(token, authData);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  // True while we're waiting for a redirect result to come back after page reload
  const [redirectPending, setRedirectPending] = useState(false);

  useEffect(() => {
    let settled = false;

    // 1. Subscribe to auth state changes (handles email/password + existing sessions)
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const providerId = fbUser.providerData?.[0]?.providerId || "password";
        const authData: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          photoURL: fbUser.photoURL,
          providerId,
        };
        setUser(authData);
        try {
          const token = await fbUser.getIdToken();
          setStoredAuth(token, authData);
        } catch (e) {
          console.warn("Could not get ID token:", e);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        clearStoredAuth();
      }

      // 2. After auth state settles, check for a pending redirect result (once only)
      if (!settled) {
        settled = true;
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            // We came back from a redirect-based OAuth flow
            const providerId =
              result.user.providerData?.[0]?.providerId ||
              (result.providerId ?? "unknown");
            await storeUserCredential(result.user, providerId, setUser);
            setFirebaseUser(result.user);
          }
        } catch (e: any) {
          // Redirect errors that are non-critical (e.g. no pending redirect)
          if (e?.code !== "auth/no-current-user") {
            console.warn("getRedirectResult error:", e);
          }
        } finally {
          setRedirectPending(false);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) {
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });
      const authData: AuthUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name.trim(),
        photoURL: userCredential.user.photoURL,
        providerId: "password",
      };
      setUser(authData);
      const token = await userCredential.user.getIdToken();
      setStoredAuth(token, authData);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const token = await userCredential.user.getIdToken();
    const authData: AuthUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "User",
      photoURL: userCredential.user.photoURL,
      providerId: userCredential.user.providerData?.[0]?.providerId || "password",
    };
    setStoredAuth(token, authData);
  }, []);

  /**
   * Attempt popup sign-in; if the browser blocks the popup, silently fall back
   * to redirect sign-in. The redirect flow reloads the page and the result is
   * captured by getRedirectResult() inside the useEffect above.
   *
   * When signInWithRedirect is called the page will navigate away, so the
   * returned Promise never actually resolves in this session — the caller's
   * finally{} block will still run (loading state cleared) before the page
   * unloads, which is the correct UX.
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await storeUserCredential(res.user, "google.com", setUser);
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        // Popup blocked → silently redirect instead
        setRedirectPending(true);
        await signInWithRedirect(auth, googleProvider);
        // After redirect the page unloads; code below never runs
        return;
      }
      // auth/cancelled-popup-request is benign — ignore it silently
      if (err?.code === "auth/cancelled-popup-request") return;
      throw err;
    }
  }, []);

  const loginWithMicrosoft = useCallback(async () => {
    try {
      const res = await signInWithPopup(auth, microsoftProvider);
      await storeUserCredential(res.user, "microsoft.com", setUser);
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        setRedirectPending(true);
        await signInWithRedirect(auth, microsoftProvider);
        return;
      }
      if (err?.code === "auth/cancelled-popup-request") return;
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    clearStoredAuth();
  }, []);

  const updateUserProfile = useCallback(async (name: string, photoURL?: string) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updateProfile(auth.currentUser, {
      displayName: name.trim(),
      ...(photoURL !== undefined ? { photoURL } : {}),
    });
    setUser((prev) =>
      prev
        ? {
            ...prev,
            displayName: name.trim(),
            ...(photoURL !== undefined ? { photoURL } : {}),
          }
        : null
    );
  }, []);

  const updateUserPassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updatePassword(auth.currentUser, newPassword);
  }, []);

  const sendPasswordReset = useCallback(async (email?: string) => {
    const targetEmail = email || auth.currentUser?.email;
    if (!targetEmail) throw new Error("No email provided");
    await sendPasswordResetEmail(auth, targetEmail);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await deleteUser(auth.currentUser);
    setUser(null);
    setFirebaseUser(null);
    clearStoredAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isLoading: loading,
        redirectPending,
        signup,
        login,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        updateUserProfile,
        updateUserPassword,
        sendPasswordReset,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
