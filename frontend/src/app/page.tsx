"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetcher } from "../lib/api";
import { Form } from "../types";
import styles from "./page.module.css";

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");
  const router = useRouter();

  const loadForms = async () => {
    try {
      const data = await fetcher("/forms/");
      setForms(data);
    } catch (error) {
      console.error("Failed to load forms", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) return;

    try {
      const newForm = await fetcher("/forms/", {
        method: "POST",
        body: JSON.stringify({
          title: newFormTitle,
          description: newFormDesc,
        }),
      });
      setForms([...forms, newForm]);
      setIsCreateModalOpen(false);
      setNewFormTitle("");
      setNewFormDesc("");
      router.push(`/forms/${newForm.id}`);
    } catch (error) {
      console.error("Failed to create form", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    
    try {
      await fetcher(`/forms/${id}`, { method: "DELETE" });
      setForms(forms.filter(f => f.id !== id));
    } catch (error) {
      console.error("Failed to delete form", error);
    }
  };

  const handleDuplicate = async (form: Form) => {
    try {
      const duplicatedForm = await fetcher("/forms/", {
        method: "POST",
        body: JSON.stringify({
          title: `${form.title} (Copy)`,
          description: form.description,
          thank_you_title: form.thank_you_title,
          thank_you_message: form.thank_you_message,
        }),
      });
      // In a real app, we'd also duplicate the questions here
      // For this clone, we might need a specific backend endpoint to duplicate a form with all its questions.
      // But for now, we just create a shell.
      setForms([...forms, duplicatedForm]);
      loadForms(); // reload to be safe
    } catch (error) {
      console.error("Failed to duplicate form", error);
    }
  };

  if (loading) {
    return <div className={styles.dashboard}>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Workspace</h1>
      </div>

      <div className={styles.grid}>
        <button 
          className={`${styles.card} ${styles.createCard}`}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <div className={styles.createIcon}>+</div>
          <span style={{ fontWeight: 500 }}>Create new form</span>
        </button>

        {forms.map(form => (
          <div key={form.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>{form.title}</h3>
                <span className={`${styles.badge} ${form.is_published ? styles.badgePublished : styles.badgeDraft}`}>
                  {form.is_published ? "Published" : "Draft"}
                </span>
              </div>
            </div>
            
            <div className={styles.cardBody}>
              {form.description || "No description"}
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.responses}>
                {form.response_count || 0} Responses
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => handleDuplicate(form)} title="Duplicate">
                  ⎘
                </button>
                <Link href={`/forms/${form.id}/results`} className={styles.iconBtn} title="Results">
                  📊
                </Link>
                <Link href={`/forms/${form.id}`} className={styles.iconBtn} title="Edit">
                  ✎
                </Link>
                <button className={styles.iconBtn} onClick={() => handleDelete(form.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Create a new form</h2>
            <form onSubmit={handleCreateForm}>
              <div className={styles.formGroup}>
                <label>Form Title</label>
                <input 
                  type="text" 
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  placeholder="e.g. Customer Feedback"
                  autoFocus
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description (Optional)</label>
                <textarea 
                  value={newFormDesc}
                  onChange={(e) => setNewFormDesc(e.target.value)}
                  placeholder="What is this form about?"
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
