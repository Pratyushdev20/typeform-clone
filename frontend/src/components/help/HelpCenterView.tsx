"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";
import styles from "./HelpCenterView.module.css";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  snippet: string;
  content: string[];
  tags: string[];
}

interface VideoItem {
  id: string;
  title: string;
  duration: string;
  badge: string;
  url: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "getting-started-basics",
    title: "Getting started with Typeform: The complete guide",
    category: "Getting started",
    snippet: "Learn the fundamentals of creating conversational forms, customizing themes, and publishing your first survey.",
    tags: ["getting started", "basics", "create form", "publish"],
    content: [
      "Welcome to Typeform! Our conversational interface helps you collect higher quality data by asking one question at a time.",
      "To build your first form: Navigate to the Dashboard, click '+ Create Typeform', and choose either a blank canvas or a pre-configured template.",
      "Customize question titles, descriptions, and answer choices directly in the center Form Builder canvas.",
      "When ready, click 'Publish' in the top navigation to generate your public shareable link!"
    ]
  },
  {
    id: "conditional-logic-branching",
    title: "How to use Conditional Logic & Question Branching",
    category: "Logic & Workflows",
    snippet: "Create dynamic paths for respondents based on their previous answers using Jump, End Form, or Next actions.",
    tags: ["logic", "branching", "conditional logic", "jump", "workflow"],
    content: [
      "Conditional Logic lets you direct respondents down different paths depending on their answers.",
      "1. Select the question you want to branch from in the Form Builder.",
      "2. In the right-hand Question Settings panel, expand 'Conditional Logic / Branching'.",
      "3. Click '+ Add Logic Rule' to specify conditions (e.g. 'If answer is Yes -> Jump to Question 3').",
      "4. Supported actions include: 'Jump to question', 'End form / Thank you screen', and 'Continue to next question'."
    ]
  },
  {
    id: "csv-response-import",
    title: "Importing form responses from CSV files",
    category: "Data & Analytics",
    snippet: "Easily migrate historical survey data or bulk-import responses into your Typeform results dashboard.",
    tags: ["csv", "import", "responses", "analytics", "data"],
    content: [
      "You can import offline or third-party survey responses directly from CSV spreadsheets.",
      "1. Open your form's 'Results' page from the top navigation.",
      "2. Click the 'Import CSV' button in the toolbar.",
      "3. Upload a CSV matching your question headers or review the column mapping preview.",
      "4. Click 'Confirm & Import' to persist all rows into SQLite analytics instantly."
    ]
  },
  {
    id: "email-notifications-setup",
    title: "Setting up response email notifications",
    category: "Notifications",
    snippet: "Get notified immediately whenever someone submits a response to any of your published forms.",
    tags: ["email", "notifications", "alerts", "respondent"],
    content: [
      "Keep track of submissions in real time with automated email alerts.",
      "Go to Account Settings > Preferences and toggle 'New form response notifications' on.",
      "You can customize notification recipients and summary frequency per form."
    ]
  },
  {
    id: "salesforce-integrations",
    title: "Connecting Typeform with Salesforce & CRMs",
    category: "Integrations",
    snippet: "Automatically sync captured leads and responses to your Salesforce accounts, contacts, and custom objects.",
    tags: ["salesforce", "integrations", "crm", "leads", "webhooks"],
    content: [
      "Supercharge your pipeline by mapping respondent contact details directly to Salesforce Leads.",
      "Use our Webhooks and API endpoints to pipe JSON payloads directly into your CRM or Zapier workflows with zero latency."
    ]
  },
  {
    id: "typefridays-workshops",
    title: "TypeFridays workshops: Live deep-dives and webinars",
    category: "Trending topics",
    snippet: "Join our weekly interactive sessions to master advanced workflows, conversion optimization, and design hacks.",
    tags: ["workshops", "webinars", "live", "training", "typefridays"],
    content: [
      "TypeFridays is our weekly live interactive workshop series.",
      "Every Friday, product experts and community builders demonstrate real-world implementations, from multi-branch quiz funnels to automated database syncs.",
      "Recordings and project templates are available on-demand for all registered attendees."
    ]
  },
  {
    id: "workflow-builder-release",
    title: "The new Workflow Builder: What's new and how to use it",
    category: "What's New",
    snippet: "Discover how we transformed the Logic tab into an all-in-one visual automation and branching center.",
    tags: ["workflow", "builder", "release", "logic", "updates"],
    content: [
      "The new Workflow Builder consolidates conditional logic, jump rules, and third-party integrations into a single unified interface.",
      "Easily visualize multi-step paths, set fallback routes, and preview your respondent experience in real time."
    ]
  }
];

const POPULAR_VIDEOS: VideoItem[] = [
  {
    id: "v1",
    title: "Learn Typeform in under 10 minutes!! 🚀 | Typeform Demo 2026",
    duration: "09:49",
    badge: "Typeform Demo 2026 | How to use Typeform",
    url: "https://www.youtube.com/watch?v=D-KHH6-WizE"
  },
  {
    id: "v2",
    title: "Design the most EYE-CATCHING form 🎨 (No experience needed!!) | Typeform Tips",
    duration: "18:12",
    badge: "Design Masterclass | Form Aesthetics & Themes",
    url: "https://www.youtube.com/watch?v=D-KHH6-WizE"
  },
  {
    id: "v3",
    title: "Master Conditional Logic & Branching rules ⚡",
    duration: "14:05",
    badge: "Advanced Logic & Dynamic Paths",
    url: "https://www.youtube.com/watch?v=D-KHH6-WizE"
  },
  {
    id: "v4",
    title: "Automate your workflows with Integrations & CSV Import 📊",
    duration: "11:30",
    badge: "Data Import, Export & API Automations",
    url: "https://www.youtube.com/watch?v=D-KHH6-WizE"
  }
];

export const HelpCenterView: React.FC = () => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem>(POPULAR_VIDEOS[0]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isWidgetDismissed, setIsWidgetDismissed] = useState(false);
  const [articleFeedback, setArticleFeedback] = useState<Record<string, "yes" | "no">>({});

  // Contact Form State
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Filtered search articles
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return HELP_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.snippet.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))
    );
  }, [searchQuery]);

  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
  };

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleFeedback = (articleId: string, helpful: "yes" | "no") => {
    setArticleFeedback((prev) => ({ ...prev, [articleId]: helpful }));
    showToast("Thank you for your feedback!", "success");
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setSendingMessage(true);
    setTimeout(() => {
      setSendingMessage(false);
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
      setContactEmail("");
      showToast("Your support message has been received! We'll reply shortly.", "success");
    }, 700);
  };

  return (
    <div className={styles.helpContainer}>
      {/* 1. Nav Header */}
      <header className={styles.helpNav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.brandLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
            </svg>
            <span>Typeform</span>
          </Link>
          <span className={styles.helpBadge}>Help Center</span>
        </div>

        <div className={styles.navRight}>
          <Link href="/dashboard" className={styles.navBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to workspace</span>
          </Link>
          <button
            className={styles.navBtn}
            onClick={() => setIsContactModalOpen(true)}
          >
            Contact support
          </button>
        </div>
      </header>

      {/* 2. Hero Section (Lavender) */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>What do you need help with?</h1>

        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask a question..."
            />
            {searchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchQuery.trim() && (
            <div className={styles.searchResultsDropdown}>
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className={styles.searchResultItem}
                    onClick={() => {
                      setSelectedArticle(item);
                      setSearchQuery("");
                    }}
                  >
                    <span className={styles.searchResultCategory}>{item.category}</span>
                    <span className={styles.searchResultTitle}>{item.title}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", color: "#71717a", textAlign: "center", fontSize: "0.875rem" }}>
                  No articles found for &quot;{searchQuery}&quot;. Try searching for &quot;Logic&quot; or &quot;Email&quot;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popular Searches Pills */}
        <div className={styles.popularSearchesRow}>
          <span className={styles.popularLabel}>Popular searches</span>
          {["Email", "Notifications", "Salesforce", "Logic", "CSV Import"].map((term) => (
            <button
              key={term}
              className={styles.popularPill}
              onClick={() => handlePopularSearchClick(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Main Container */}
      <main className={styles.mainContainer}>
        {/* Getting Started Card */}
        <div className={styles.gettingStartedCard}>
          <div className={styles.gettingStartedArt}>
            ☕✨
          </div>
          <div className={styles.gettingStartedContent}>
            <h2 className={styles.gettingStartedTitle}>Getting started</h2>
            <p className={styles.gettingStartedDesc}>
              Explore all our articles to learn how to use Typeform, from getting started to using advanced features.
            </p>
            <div
              className={styles.seeAllLink}
              onClick={() => setSelectedArticle(HELP_ARTICLES[0])}
            >
              See all articles →
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeadingLarge}>Trending topics</h2>
          <p className={styles.sectionSubtitle}>Here&apos;s what other people are finding most useful right now:</p>

          <div className={styles.topicsGrid}>
            <div
              className={styles.topicCard}
              onClick={() => setSelectedArticle(HELP_ARTICLES[5])}
            >
              <h3 className={styles.topicTitle}>TypeFridays workshops</h3>
              <p className={styles.topicSnippet}>
                We&apos;re launching a brand new live workshop series, TypeFridays. Each session we&apos;ll focus on a new
                topic, build workflows, and share expert tips and tricks on how to get the most out of Typeform 🚀
              </p>
            </div>

            <div
              className={styles.topicCard}
              onClick={() => setSelectedArticle(HELP_ARTICLES[1])}
            >
              <h3 className={styles.topicTitle}>Conditional Logic & Question Branching</h3>
              <p className={styles.topicSnippet}>
                Create dynamic interactive paths, jump respondents to custom destinations based on choices, and preview
                smart respondent workflows.
              </p>
            </div>

            <div
              className={styles.topicCard}
              onClick={() => setSelectedArticle(HELP_ARTICLES[2])}
            >
              <h3 className={styles.topicTitle}>CSV Response Import & Data Analytics</h3>
              <p className={styles.topicSnippet}>
                Import legacy responses, sync offline field notes, and generate real-time visual statistics in your form
                Results dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Popular Videos */}
        <section className={styles.videosBlock}>
          <h2 className={styles.sectionHeadingLarge}>Popular videos</h2>

          <div className={styles.videoHeroCard}>
            <div
              className={styles.videoPlayerMock}
              onClick={() => setIsVideoModalOpen(true)}
            >
              <div className={styles.playButtonCircle}>▶</div>
              <div className={styles.videoOverlayBadge}>{activeVideo.badge}</div>
            </div>

            <div className={styles.videoPlaylist}>
              {POPULAR_VIDEOS.map((vid) => (
                <div
                  key={vid.id}
                  className={`${styles.playListItem} ${activeVideo.id === vid.id ? styles.playListItemActive : ""}`}
                  onClick={() => {
                    setActiveVideo(vid);
                    setIsVideoModalOpen(true);
                  }}
                >
                  <div className={styles.playListLeft}>
                    <span className={styles.playIcon}>▶</span>
                    <span className={styles.playListTitle}>{vid.title}</span>
                  </div>
                  <span className={styles.playListDuration}>{vid.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join the Discussion */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeadingLarge}>Join the discussion</h2>

          <div className={styles.communityGrid}>
            <div
              className={styles.communityCard}
              onClick={() => setSelectedArticle(HELP_ARTICLES[0])}
            >
              <h3 className={styles.communityTitle}>Rewatch our Spring Release and Typeform Tune-up event!</h3>
              <p className={styles.communitySnippet}>
                Missed our Spring 2025 Product Release & Tune Up Your Typeform webinars? You can now watch the recordings
                on-demand! Whether you&apos;re looking for a deep dive into our latest features or expert tips on optimizing
                your forms, we&apos;ve got you covered...
              </p>
            </div>

            <div
              className={styles.communityCard}
              onClick={() => setSelectedArticle(HELP_ARTICLES[6])}
            >
              <h3 className={styles.communityTitle}>The new Workflow Builder is here!</h3>
              <p className={styles.communitySnippet}>
                The new Workflow Builder is officially live, making it easier than ever to customize and automate your
                forms - all in one place. 🎉 Discover how we&apos;ve transformed the Logic tab into a new Workflow tab!
              </p>
            </div>

            <div
              className={styles.communityCard}
              onClick={() => setSelectedArticle(HELP_ARTICLES[1])}
            >
              <h3 className={styles.communityTitle}>
                Have you checked out the solopreneurs guide to building your typeform?
              </h3>
              <p className={styles.communitySnippet}>
                If you&apos;re just starting out running your own business you&apos;ll know there are so many different
                tools out there to help you get organized, get automated, or maybe even build a quick and scrappy MVP to
                test out whether your idea has legs!
              </p>
            </div>
          </div>
        </section>

        {/* Still Got Questions Banner */}
        <section className={styles.questionsCtaBanner}>
          <h2 className={styles.questionsCtaTitle}>Still got questions?</h2>
          <p className={styles.questionsCtaText}>
            Feel free to <span className={styles.ctaLink} onClick={() => setIsContactModalOpen(true)}>contact us</span> or{" "}
            <span className={styles.ctaLink} onClick={() => setSelectedArticle(HELP_ARTICLES[0])}>ask the Community</span>.
            Got a Business or Enterprise plan?{" "}
            <span className={styles.ctaLink} onClick={() => setIsContactModalOpen(true)}>Log in</span> to use Live Chat.
          </p>

          <div className={styles.ctaActionsRow}>
            <button
              className={styles.btnCtaPrimary}
              onClick={() => setIsContactModalOpen(true)}
            >
              Contact Support
            </button>
            <button
              className={styles.btnCtaSecondary}
              onClick={() => setSelectedArticle(HELP_ARTICLES[5])}
            >
              Explore Workshops
            </button>
          </div>
        </section>
      </main>

      {/* Dark Footer */}
      <footer className={styles.darkFooter}>
        <div className={styles.footerLocation}>
          <span>📍 With love, from Barcelona</span>
        </div>

        <div className={styles.footerLanguageSelect}>
          <span>🌐 English (United States) ⌵</span>
        </div>

        <div className={styles.footerLinksRow}>
          <span className={styles.footerLink}>Cookie settings</span>
          <span className={styles.footerLink}>Check our Cookie Policy to delete cookies</span>
          <span className={styles.footerLink}>Report abuse</span>
        </div>

        <div className={styles.socialIconsRow}>
          <span className={styles.socialIconBtn} title="Facebook">FB</span>
          <span className={styles.socialIconBtn} title="X (Twitter)">𝕏</span>
          <span className={styles.socialIconBtn} title="LinkedIn">in</span>
          <span className={styles.socialIconBtn} title="Instagram">IG</span>
          <span className={styles.socialIconBtn} title="YouTube">YT</span>
        </div>

        <div className={styles.copyrightText}>© Typeform</div>
      </footer>

      {/* Floating Support Widget */}
      {!isWidgetDismissed && (
        <div className={styles.floatingWidgetWrapper}>
          <div className={styles.speechBubble}>
            <span>Hi. Need any help?</span>
            <button
              className={styles.bubbleCloseBtn}
              onClick={() => setIsWidgetDismissed(true)}
              title="Close"
            >
              ✕
            </button>
          </div>
          <button
            className={styles.floatingChatBtn}
            onClick={() => setIsContactModalOpen(true)}
            title="Chat with Support"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className={styles.modalOverlay} onClick={() => setSelectedArticle(null)}>
          <div className={styles.articleModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.articleModalHeader}>
              <div>
                <span className={styles.articleModalCategory}>{selectedArticle.category}</span>
                <h3 className={styles.articleModalTitle}>{selectedArticle.title}</h3>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setSelectedArticle(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.articleModalBody}>
              {selectedArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className={styles.articleFeedbackRow}>
              <span className={styles.feedbackQuestion}>Was this article helpful?</span>
              <div className={styles.feedbackBtnGroup}>
                <button
                  className={styles.feedbackBtn}
                  onClick={() => handleFeedback(selectedArticle.id, "yes")}
                  style={articleFeedback[selectedArticle.id] === "yes" ? { backgroundColor: "#d8b4fe" } : {}}
                >
                  👍 Yes
                </button>
                <button
                  className={styles.feedbackBtn}
                  onClick={() => handleFeedback(selectedArticle.id, "no")}
                  style={articleFeedback[selectedArticle.id] === "no" ? { backgroundColor: "#fecaca" } : {}}
                >
                  👎 No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsVideoModalOpen(false)}>
          <div className={styles.articleModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.articleModalHeader}>
              <div>
                <span className={styles.articleModalCategory}>Video Tutorial</span>
                <h3 className={styles.articleModalTitle}>{activeVideo.title}</h3>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsVideoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px" }}>
              <iframe
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                src="https://www.youtube-nocookie.com/embed/D-KHH6-WizE?autoplay=1"
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {isContactModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsContactModalOpen(false)}>
          <div className={styles.articleModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.articleModalHeader}>
              <div>
                <span className={styles.articleModalCategory}>Support</span>
                <h3 className={styles.articleModalTitle}>Contact Support</h3>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsContactModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendContact} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Your Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d4d4d8",
                    fontSize: "0.9375rem"
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Subject</label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g. Help configuring conditional jump rules"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d4d4d8",
                    fontSize: "0.9375rem"
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>How can we help?</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  rows={4}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d4d4d8",
                    fontSize: "0.9375rem",
                    fontFamily: "inherit"
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #d4d4d8",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#18181b",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  {sendingMessage ? "Sending..." : "Submit ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
