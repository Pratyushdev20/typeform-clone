"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Form } from "../../types";
import { fetcher } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { TopHeader } from "../layout/TopHeader";
import { ResponseBanner } from "../layout/ResponseBanner";
import { WorkspaceNav, NavTab } from "../layout/WorkspaceNav";
import { Sidebar } from "./Sidebar";
import { WorkspaceHeader, SortOption, ViewMode } from "./WorkspaceHeader";
import { SuggestionCards, SuggestionItem } from "./SuggestionCards";
import { FormsList } from "./FormsList";
import { FormsGrid } from "./FormsGrid";
import { CreateFormModal } from "./CreateFormModal";
import { RenameModal } from "./RenameModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ComingSoonModal } from "./ComingSoonModal";
import { ContactsView } from "./ContactsView";
import { InsightsView } from "./InsightsView";
import styles from "./Dashboard.module.css";

export const Dashboard: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeTab, setActiveTab] = useState<NavTab>("forms");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renameTargetForm, setRenameTargetForm] = useState<Form | null>(null);
  const [deleteTargetForm, setDeleteTargetForm] = useState<Form | null>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  // Load forms directly from backend API
  const loadForms = useCallback(async () => {
    try {
      const data = await fetcher("/forms/");
      if (Array.isArray(data)) {
        setForms(data);
      } else {
        setForms([]);
      }
    } catch (err) {
      console.error("Failed to load forms from backend", err);
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear legacy local storage form cache if present
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("typeform_forms");
      } catch {}
    }
    loadForms();
  }, [loadForms]);

  // Filtered and Sorted forms
  const displayedForms = useMemo(() => {
    let result = [...forms];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          (f.description && f.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return (
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
        );
      }
      if (sortBy === "date_asc") {
        return (
          new Date(a.updated_at || a.created_at).getTime() -
          new Date(b.updated_at || b.created_at).getTime()
        );
      }
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title_desc") {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === "responses_desc") {
        return (b.response_count || 0) - (a.response_count || 0);
      }
      return 0;
    });

    return result;
  }, [forms, searchQuery, sortBy]);

  // Response totals
  const totalResponses = useMemo(() => {
    return forms.reduce((sum, f) => sum + (f.response_count || 0), 0);
  }, [forms]);

  // Create Form Handler
  const handleCreateForm = async (title: string, description?: string) => {
    try {
      const newForm = await fetcher("/forms/", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || "",
        }),
      });
      setForms((prev) => [newForm, ...prev.filter((f) => f.id !== newForm.id)]);
      setIsCreateModalOpen(false);
      showToast(`Form "${title}" created!`, "success");
      if (newForm.id) {
        router.push(`/forms/${newForm.id}`);
      }
    } catch (error: any) {
      console.error("Failed to create form on backend:", error);
      showToast(error.message || "Failed to create form on backend", "error");
    }
  };

  // Duplicate Form Handler
  const handleDuplicate = async (form: Form) => {
    const copyTitle = `${form.title} (Copy)`;

    try {
      let duplicated: Form;
      try {
        duplicated = await fetcher(`/forms/${form.id}/duplicate`, {
          method: "POST",
        });
      } catch {
        duplicated = await fetcher("/forms/", {
          method: "POST",
          body: JSON.stringify({
            title: copyTitle,
            description: form.description,
            thank_you_title: form.thank_you_title,
            thank_you_message: form.thank_you_message,
          }),
        });
      }
      setForms((prev) => [duplicated, ...prev.filter((f) => f.id !== duplicated.id)]);
      showToast(`Duplicated "${form.title}" as "${copyTitle}"`, "success");
    } catch (error: any) {
      console.error("Failed to duplicate form on backend:", error);
      showToast(error.message || "Failed to duplicate form on backend", "error");
    }
  };

  // Rename Form Handler
  const handleRename = async (
    formId: number,
    newTitle: string,
    newDescription?: string
  ) => {
    const now = new Date().toISOString();
    try {
      await fetcher(`/forms/${formId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
        }),
      });
    } catch (err) {
      console.warn("Backend update failed, applying locally", err);
    }

    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              title: newTitle,
              description: newDescription !== undefined ? newDescription : f.description,
              updated_at: now,
            }
          : f
      )
    );

    showToast(`Form renamed to "${newTitle}"`, "success");
  };

  // Delete Form Handler
  const handleDeleteConfirm = async (formId: number) => {
    const target = forms.find((f) => f.id === formId);
    try {
      await fetcher(`/forms/${formId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Backend delete failed, removing locally", err);
    }

    setForms((prev) => prev.filter((f) => f.id !== formId));
    showToast(`"${target?.title || "Form"}" deleted`, "info");
  };

  // Copy respondent link
  const handleCopyLink = (form: Form) => {
    const shareUrl = `${window.location.origin}/to/${form.slug || form.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Respondent link copied to clipboard!", "success");
    } else {
      showToast(`Link: ${shareUrl}`, "info");
    }
  };

  // Suggestion card click
  const handleUseSuggestion = (suggestion: SuggestionItem) => {
    handleCreateForm(suggestion.defaultFormTitle, suggestion.description);
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. Top Header */}
      <TopHeader
        onOpenIntegrations={() => setComingSoonFeature("App Integrations")}
        onOpenBrandKit={() => setComingSoonFeature("Brand Kit & Themes")}
        onOpenHelp={() => setComingSoonFeature("Help & Documentation")}
      />

      {/* 2. Response Limit Banner */}
      <ResponseBanner
        onGetMore={() => setComingSoonFeature("Response Limit Upgrades")}
      />

      {/* 3. Main Application Navigation: Forms, Contacts, Insights */}
      <WorkspaceNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Layout Body: Sidebar + Main Content Area */}
      <div className={styles.layoutBody}>
        {/* 4. Left Sidebar */}
        <Sidebar
          formCount={forms.length}
          totalResponses={totalResponses}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onUpgradeClick={() => setComingSoonFeature("Response Limit Upgrades")}
          isOpenOnMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          <div className={styles.contentContainer}>
            {activeTab === "contacts" && <ContactsView />}

            {activeTab === "insights" && <InsightsView />}

            {activeTab === "forms" && (
              <>
                {/* Workspace Header with Top-Right Create form CTA */}
                <WorkspaceHeader
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onCreateClick={() => setIsCreateModalOpen(true)}
                  onInviteClick={() => setComingSoonFeature("Team Workspace Collaboration")}
                  onWorkspaceOptionsClick={() => setComingSoonFeature("Workspace Settings")}
                  onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />

                {/* Form Suggestion Cards (only when not searching and forms exist) */}
                {!searchQuery && forms.length > 0 && (
                  <SuggestionCards onUseSuggestion={handleUseSuggestion} />
                )}

                {/* Forms Management List / Grid */}
                {loading ? (
                  <div className={styles.loadingSkeleton}>
                    <div className={styles.skeletonRow} />
                    <div className={styles.skeletonRow} />
                    <div className={styles.skeletonRow} />
                  </div>
                ) : viewMode === "list" ? (
                  <FormsList
                    forms={displayedForms}
                    searchQuery={searchQuery}
                    onRename={(f) => setRenameTargetForm(f)}
                    onDuplicate={handleDuplicate}
                    onDelete={(f) => setDeleteTargetForm(f)}
                    onCopyLink={handleCopyLink}
                    onCreateClick={() => setIsCreateModalOpen(true)}
                  />
                ) : (
                  <FormsGrid
                    forms={displayedForms}
                    searchQuery={searchQuery}
                    onRename={(f) => setRenameTargetForm(f)}
                    onDuplicate={handleDuplicate}
                    onDelete={(f) => setDeleteTargetForm(f)}
                    onCopyLink={handleCopyLink}
                    onCreateClick={() => setIsCreateModalOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateForm}
      />

      <RenameModal
        form={renameTargetForm}
        isOpen={Boolean(renameTargetForm)}
        onClose={() => setRenameTargetForm(null)}
        onRename={handleRename}
      />

      <DeleteConfirmModal
        form={deleteTargetForm}
        isOpen={Boolean(deleteTargetForm)}
        onClose={() => setDeleteTargetForm(null)}
        onConfirmDelete={handleDeleteConfirm}
      />

      <ComingSoonModal
        title={comingSoonFeature || "Coming Soon"}
        isOpen={Boolean(comingSoonFeature)}
        onClose={() => setComingSoonFeature(null)}
      />
    </div>
  );
};
