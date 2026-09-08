"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Globe, AlertCircle, Loader2 } from "lucide-react";
import { useAuth, formatFirebaseError } from "../../context/AuthContext";
import styles from "./auth.module.css";

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const { signup, loginWithGoogle, loginWithMicrosoft } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSigningUpEmail, setIsSigningUpEmail] = useState(false);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isLoggingInMicrosoft, setIsLoggingInMicrosoft] = useState(false);

  const isAnyLoading = isSigningUpEmail || isLoggingInGoogle || isLoggingInMicrosoft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service to proceed.");
      return;
    }

    try {
      setIsSigningUpEmail(true);
      await signup(name, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(formatFirebaseError(err));
    } finally {
      setIsSigningUpEmail(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      setIsLoggingInGoogle(true);
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(formatFirebaseError(err));
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleMicrosoftSignup = async () => {
    setError(null);
    try {
      setIsLoggingInMicrosoft(true);
      await loginWithMicrosoft();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Microsoft Auth error:", err);
      setError(formatFirebaseError(err));
    } finally {
      setIsLoggingInMicrosoft(false);
    }
  };

  return (
    <div className={styles.authPage}>
      {/* Top Navigation */}
      <header className={styles.authNav}>
        <div className={styles.navRight}>
          <button type="button" className={styles.langSelector}>
            <Globe size={14} />
            <span>English</span>
          </button>
        </div>

        <div className={styles.navRight}>
          <span className={styles.navText}>Already have an account?</span>
          <Link href="/login" className={styles.navBtnOutline}>
            Log in
          </Link>
        </div>
      </header>

      {/* Main Signup Content */}
      <main className={styles.authContent}>
        <div className={styles.authCard}>
          {/* Centered Typeform Logo */}
          <div className={styles.centerLogo}>
            <div className={styles.logoPillMark}>
              <i />
              <i />
            </div>
            <span>Typeform</span>
          </div>

          <h1 className={styles.authTitleCenter}>
            Get better data with conversational forms, surveys, quizzes and more.
          </h1>

          {/* Social Sign Up (Real Firebase OAuth) */}
          <div className={styles.socialButtons}>
            <button
              type="button"
              className={styles.socialBtn}
              onClick={handleGoogleSignup}
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
                  <span>Sign up with Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.socialBtn}
              onClick={handleMicrosoftSignup}
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
                  <span>Sign up with Microsoft</span>
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

          {/* Signup Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="signup-name" className={styles.label}>
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                className={styles.input}
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={isAnyLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="signup-email" className={styles.label}>
                Email
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`${styles.input} ${styles.inputWithToggle}`}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className={styles.formGroup}>
              <label htmlFor="signup-confirm-password" className={styles.label}>
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`${styles.input} ${styles.inputWithToggle}`}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isAnyLoading}
                />
                <button
                  type="button"
                  className={styles.toggleEyeBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className={styles.termsRow}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={isAnyLoading}
              />
              <span>
                I agree to the Typeform&apos;s <a href="#">Terms of Service</a>,{" "}
                <a href="#">Privacy Policy</a> and{" "}
                <a href="#">Data Processing Agreement</a>.
              </span>
            </label>

            <button
              type="submit"
              disabled={isAnyLoading}
              className={styles.primarySubmitBtn}
            >
              {isSigningUpEmail ? (
                <>
                  <div className={styles.spinner} />
                  <span>Creating account...</span>
                </>
              ) : (
                "Create my free account"
              )}
            </button>
          </form>

          <p className={styles.captchaDisclaimer}>
            This site is protected by reCAPTCHA and the Google{" "}
            <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a> apply.
          </p>
        </div>
      </main>
    </div>
  );
};
