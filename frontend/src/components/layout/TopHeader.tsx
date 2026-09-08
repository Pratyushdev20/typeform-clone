"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import styles from "./TopHeader.module.css";

interface TopHeaderProps {
  onOpenIntegrations?: () => void;
  onOpenBrandKit?: () => void;
  onOpenHelp?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenIntegrations,
  onOpenBrandKit,
  onOpenHelp,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userName = user?.name || "My Workspace";
  const userEmail = user?.email || "user@example.com";

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(userName, userEmail);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <header className={styles.topHeader}>
      <div className={styles.leftSection}>
        <div className={styles.logoGroup}>
          <div className={styles.typeformLogoPill} title="Workspace Icon" />
          <div className={styles.workspaceAvatar}>{initials[0] || "W"}</div>
          <button
            className={styles.workspaceSelectorBtn}
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            aria-expanded={isWorkspaceMenuOpen}
          >
            <span className={styles.workspaceName}>{userName}&apos;s workspace</span>
            <svg
              className={`${styles.chevron} ${isWorkspaceMenuOpen ? styles.chevronOpen : ""}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isWorkspaceMenuOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>Switch Workspace</div>
              <div className={`${styles.dropdownItem} ${styles.dropdownItemActive}`}>
                <div className={styles.smallAvatar}>{initials[0] || "W"}</div>
                <div>
                  <div className={styles.itemTitle}>{userName}&apos;s workspace</div>
                  <div className={styles.itemSubtitle}>Personal (Owner)</div>
                </div>
                <span className={styles.checkIcon}>✓</span>
              </div>
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownActionItem}
                onClick={() => setIsWorkspaceMenuOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create workspace
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        <button
          className={styles.headerBtn}
          onClick={onOpenIntegrations}
          title="Integrations"
        >
          <svg
            className={styles.btnIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Integrations</span>
        </button>

        <button
          className={styles.headerBtn}
          onClick={onOpenBrandKit}
          title="Brand kit"
        >
          <svg
            className={styles.btnIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>Brand kit</span>
        </button>

        <button
          className={styles.iconOnlyBtn}
          onClick={onOpenHelp}
          title="Help & resources"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        <div className={styles.userAvatarContainer}>
          <button
            className={styles.userAvatar}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title="User Profile"
          >
            {initials}
          </button>
          {isUserMenuOpen && (
            <div className={styles.userDropdown}>
              <div className={styles.userDropdownInfo}>
                <div className={styles.userDropdownName}>{userName}</div>
                <div className={styles.userDropdownEmail}>{userEmail}</div>
              </div>
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItemSimple}
                onClick={() => setIsUserMenuOpen(false)}
              >
                Account settings
              </button>
              <button
                className={styles.dropdownItemSimple}
                onClick={() => setIsUserMenuOpen(false)}
              >
                Billing & plans
              </button>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItemSimple} ${styles.dropdownItemDanger}`}
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
