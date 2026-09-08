"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Globe, AlertCircle, Loader2 } from "lucide-react";
import { useAuth, formatFirebaseError } from "../../context/AuthContext";
import styles from "./auth.module.css";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithMicrosoft, user, loading } = useAuth();

  // If the user is already signed in (e.g. after OAuth redirect), go to dashboard
  React.useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isLoggingInEmail, setIsLoggingInEmail] = useState(false);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isLoggingInMicrosoft, setIsLoggingInMicrosoft] = useState(false);

  const isAnyLoading = isLoggingInEmail || isLoggingInGoogle || isLoggingInMicrosoft;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setIsLoggingInEmail(true);
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(formatFirebaseError(err));
    } finally {
      setIsLoggingInEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setIsLoggingInGoogle(true);
      await loginWithGoogle();
      // popup success → navigate; redirect fallback → page unloads before this runs
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      const msg = formatFirebaseError(err);
      if (msg) setError(msg);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError(null);
    try {
      setIsLoggingInMicrosoft(true);
      await loginWithMicrosoft();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Microsoft Auth error:", err);
      const msg = formatFirebaseError(err);
      if (msg) setError(msg);
    } finally {
      setIsLoggingInMicrosoft(false);
    }
  };

  return (
    <div className={styles.authPage}>
      {/* Top Navigation */}
      <header className={styles.authNav}>
        <Link href="/" className={styles.navLogo} aria-label="Typeform Home">
          <div className={styles.logoPillMark}>
            <i />
            <i />
          </div>
          <span>Typeform</span>
        </Link>

        <div className={styles.navRight}>
          <a href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
            Contact us
          </a>
          <button type="button" className={styles.langSelector}>
            <Globe size={14} />
            <span>English</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className={styles.authContent}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Log in</h1>
          <p className={styles.authSubtitle}>
            Build forms, gather responses, and automate your workflows.
          </p>

          {/* Social Sign In (Real Firebase OAuth) */}
          <div className={styles.socialButtons}>
            <button
              type="button"
              className={styles.socialBtn}
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
            >
              {isLoggingInGoogle ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <span className={styles.badgeLastUsed}>Last used</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.socialBtn}
              onClick={handleMicrosoftLogin}
              disabled={isAnyLoading}
            >
              {isLoggingInMicrosoft ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Connecting to Microsoft...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span>Continue with Microsoft</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Login Form */}
          <form className={styles.form} onSubmit={handleEmailSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                className={styles.input}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isAnyLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`${styles.input} ${styles.inputWithToggle}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isAnyLoading}
                />
                <button
                  type="button"
                  className={styles.toggleEyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className={styles.primarySubmitBtn}
            >
              {isLoggingInEmail ? (
                <>
                  <div className={styles.spinner} />
                  <span>Logging in...</span>
                </>
              ) : (
                "Continue with email"
              )}
            </button>
          </form>

          <button
            type="button"
            className={styles.ssoLink}
            onClick={() => setError("SSO is available for Enterprise plans.")}
          >
            Log in with SSO
          </button>

          <div className={styles.authFooter}>
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
