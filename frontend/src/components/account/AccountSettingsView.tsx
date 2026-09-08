"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, formatFirebaseError } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetcher } from "../../lib/api";
import styles from "./AccountSettingsView.module.css";

type SettingsTab = "profile" | "security" | "preferences" | "data";

export const AccountSettingsView: React.FC = () => {
  const router = useRouter();
  const { user, firebaseUser, updateUserProfile, updateUserPassword, sendPasswordReset, logout, deleteAccount } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Danger Zone Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("typeform_language") || "en-US";
      const savedTz = localStorage.getItem("typeform_timezone") || "UTC";
      const savedNotifs = localStorage.getItem("typeform_email_notifs");
      setLanguage(savedLang);
      setTimezone(savedTz);
      if (savedNotifs !== null) {
        setEmailNotifications(savedNotifs === "true");
      }
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast("Display name cannot be empty", "error");
      return;
    }

    try {
      setSavingProfile(true);
      await updateUserProfile(displayName.trim());
      showToast("Profile information updated successfully!", "success");
    } catch (err: any) {
      showToast(formatFirebaseError(err), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setSavingPassword(true);
      await updateUserPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!", "success");
    } catch (err: any) {
      showToast(formatFirebaseError(err), "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      setResetEmailSent(true);
      showToast(`Password reset link sent to ${user.email}`, "success");
    } catch (err: any) {
      showToast(formatFirebaseError(err), "error");
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLanguage(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("typeform_language", val);
    }
    showToast("Language preference saved", "success");
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTimezone(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("typeform_timezone", val);
    }
    showToast("Timezone preference saved", "success");
  };

  const handleToggleNotifications = (type: "email" | "product" | "digest") => {
    if (type === "email") {
      const next = !emailNotifications;
      setEmailNotifications(next);
      if (typeof window !== "undefined") localStorage.setItem("typeform_email_notifs", String(next));
      showToast("Notification preferences updated", "success");
    } else if (type === "product") {
      setProductUpdates(!productUpdates);
      showToast("Product update preferences updated", "success");
    } else {
      setWeeklyDigest(!weeklyDigest);
      showToast("Weekly digest preferences updated", "success");
    }
  };

  const handleExportData = async () => {
    try {
      const forms = await fetcher("/forms/");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forms, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `typeform_data_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Account data exported successfully!", "success");
    } catch (err) {
      showToast("Failed to export data. Please try again.", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText.trim() !== "DELETE") {
      showToast("Please type DELETE to confirm", "error");
      return;
    }

    try {
      setDeleting(true);
      await deleteAccount();
      showToast("Account has been removed.", "success");
      router.push("/");
    } catch (err: any) {
      showToast(formatFirebaseError(err), "error");
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const provider = user?.providerId || "password";
  const isEmailUser = provider === "password" || provider === "email";
  const isGoogleUser = provider === "google.com";
  const isMicrosoftUser = provider === "microsoft.com";

  const initials = user?.displayName
    ? user.displayName.substring(0, 2).toUpperCase()
    : user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "US";

  return (
    <div className={styles.accountContainer}>
      {/* Top Header */}
      <header className={styles.accountHeader}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to workspace</span>
          </Link>
          <div className={styles.brandLogo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
            </svg>
            <span>Typeform</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userPill}>
            <div className={styles.avatarSmall}>{initials}</div>
            <span>{user?.displayName || user?.email || "User"}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className={styles.mainLayout}>
        {/* Left Sidebar Navigation */}
        <aside className={styles.tabsSidebar}>
          <div className={styles.sidebarTitle}>Settings</div>
          <button
            className={`${styles.tabButton} ${activeTab === "profile" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className={styles.tabIcon}>👤</span>
            <span>Profile & Account</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "security" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <span className={styles.tabIcon}>🔒</span>
            <span>Login & Security</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "preferences" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            <span className={styles.tabIcon}>⚙️</span>
            <span>Preferences</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "data" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("data")}
          >
            <span className={styles.tabIcon}>🛡️</span>
            <span>Data & Privacy</span>
          </button>
        </aside>

        {/* Right Content Area */}
        <section className={styles.contentArea}>
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <>
              <div className={styles.sectionHeading}>
                <h1 className={styles.title}>Profile & Account</h1>
                <p className={styles.subtitle}>Manage your personal information and workspace details.</p>
              </div>

              <div className={styles.card}>
                <div className={styles.avatarRow}>
                  <div className={styles.avatarLarge}>{initials}</div>
                  <div className={styles.avatarDetails}>
                    <div className={styles.avatarName}>{user?.displayName || "Typeform User"}</div>
                    <div className={styles.avatarEmail}>{user?.email}</div>
                  </div>
                </div>

                <div className={styles.cardDivider} />

                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                    <span className={styles.inputHelp}>This name will appear on forms and shared workspaces.</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={user?.email || ""}
                      disabled
                    />
                    <span className={styles.inputHelp}>
                      Email address is managed by your authentication provider.
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>User ID (UID)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={user?.uid || ""}
                      disabled
                      style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
                    />
                  </div>

                  <button type="submit" className={styles.btnPrimary} disabled={savingProfile}>
                    {savingProfile ? "Saving changes..." : "Save changes"}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === "security" && (
            <>
              <div className={styles.sectionHeading}>
                <h1 className={styles.title}>Login & Security</h1>
                <p className={styles.subtitle}>Manage your login methods and security settings.</p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Authentication Method</h2>
                  <p className={styles.cardDesc}>Your primary sign-in provider.</p>
                </div>

                {isGoogleUser && (
                  <div className={styles.providerBadge}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Connected with Google OAuth</span>
                    <span className={styles.badgeSuccess}>Active</span>
                  </div>
                )}

                {isMicrosoftUser && (
                  <div className={styles.providerBadge}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <rect fill="#F25022" x="1" y="1" width="10" height="10" />
                      <rect fill="#7FBA00" x="13" y="1" width="10" height="10" />
                      <rect fill="#00A4EF" x="1" y="1" width="10" height="10" />
                      <rect fill="#FFB900" x="13" y="13" width="10" height="10" />
                    </svg>
                    <span>Connected with Microsoft OAuth</span>
                    <span className={styles.badgeSuccess}>Active</span>
                  </div>
                )}

                {isEmailUser && (
                  <div className={styles.providerBadge}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>Email & Password Account ({user?.email})</span>
                    <span className={styles.badgeSuccess}>Verified</span>
                  </div>
                )}
              </div>

              {/* Password update for email users */}
              {isEmailUser && (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Change Password</h2>
                    <p className={styles.cardDesc}>Enter a new password for your account.</p>
                  </div>

                  <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm New Password</label>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button type="submit" className={styles.btnPrimary} disabled={savingPassword}>
                        {savingPassword ? "Updating password..." : "Update password"}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={handleSendResetEmail}
                      >
                        {resetEmailSent ? "Reset email sent ✓" : "Send reset email"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === "preferences" && (
            <>
              <div className={styles.sectionHeading}>
                <h1 className={styles.title}>Preferences & Language</h1>
                <p className={styles.subtitle}>Customize your language, region, and communication preferences.</p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Language & Localization</h2>
                  <p className={styles.cardDesc}>Choose how Typeform displays dates, numbers, and UI labels.</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Display Language</label>
                  <select className={styles.selectInput} value={language} onChange={handleLanguageChange}>
                    <option value="en-US">English (United States)</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="fr-FR">Français</option>
                    <option value="de-DE">Deutsch</option>
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="it-IT">Italiano</option>
                    <option value="ja-JP">日本語 (Japanese)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Timezone</label>
                  <select className={styles.selectInput} value={timezone} onChange={handleTimezoneChange}>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London (GMT+1)</option>
                    <option value="Europe/Madrid">Barcelona / Madrid (GMT+2)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Email Notifications</h2>
                  <p className={styles.cardDesc}>Control emails you receive from Typeform.</p>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>New form response notifications</span>
                    <span className={styles.toggleDesc}>Receive an instant email whenever a respondent completes a form.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={() => handleToggleNotifications("email")}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>Product updates and release notes</span>
                    <span className={styles.toggleDesc}>Stay informed about new features and workflow enhancements.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={productUpdates}
                      onChange={() => handleToggleNotifications("product")}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>Weekly response summary digest</span>
                    <span className={styles.toggleDesc}>Weekly statistical breakdown of all active surveys.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={weeklyDigest}
                      onChange={() => handleToggleNotifications("digest")}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: DATA & PRIVACY */}
          {activeTab === "data" && (
            <>
              <div className={styles.sectionHeading}>
                <h1 className={styles.title}>Data & Privacy</h1>
                <p className={styles.subtitle}>Export your workspace data or manage account deletion.</p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Export Workspace Data</h2>
                  <p className={styles.cardDesc}>
                    Download a comprehensive JSON package containing all your forms, questions, and responses.
                  </p>
                </div>
                <button type="button" className={styles.btnSecondary} onClick={handleExportData}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Export JSON archive</span>
                </button>
              </div>

              <div className={styles.dangerCard}>
                <div className={styles.dangerHeader}>
                  <h2 className={styles.dangerTitle}>Danger Zone</h2>
                  <p className={styles.dangerDesc}>
                    Irreversible actions that affect your workspace and account authentication.
                  </p>
                </div>
                <div className={styles.cardDivider} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#991b1b", fontSize: "0.875rem" }}>Delete account</div>
                    <div style={{ color: "#7f1d1d", fontSize: "0.8125rem" }}>Permanently delete your profile and sign out.</div>
                  </div>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete your account?</h3>
            <p className={styles.modalDesc}>
              This action cannot be undone. To confirm deletion, please type <strong>DELETE</strong> in the field below.
            </p>
            <input
              type="text"
              className={styles.formInput}
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmDeleteText("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleDeleteAccount}
                disabled={confirmDeleteText.trim() !== "DELETE" || deleting}
              >
                {deleting ? "Deleting..." : "Permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
