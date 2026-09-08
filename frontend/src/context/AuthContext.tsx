"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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
      return "Sign-in popup was closed before completing.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups for this site.";
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      setLoading(false);
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

  const loginWithGoogle = useCallback(async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const token = await res.user.getIdToken();
    const authData: AuthUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || "Google User",
      photoURL: res.user.photoURL,
      providerId: "google.com",
    };
    setStoredAuth(token, authData);
  }, []);

  const loginWithMicrosoft = useCallback(async () => {
    const res = await signInWithPopup(auth, microsoftProvider);
    const token = await res.user.getIdToken();
    const authData: AuthUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || "Microsoft User",
      photoURL: res.user.photoURL,
      providerId: "microsoft.com",
    };
    setStoredAuth(token, authData);
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
