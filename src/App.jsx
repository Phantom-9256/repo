
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, LayoutGroup, useReducedMotion } from "motion/react";

import AccordionGallery from "./AccordionGallery";

const ActivityChart = lazy(() => import("./ActivityChart"));

import ImageCarousel from "./ImageCarousel";

import Modal from "./Modal";

import Notification from "./Notification";

import "./App.css";

/* ---------- Static data (module scope: created once, not on every render) ---------- */

const INITIAL_MESSAGES = [

  {

    id: 1,

    title: "New project update",

    sender: "Maya Chen",

    category: "Projects",

    time: "9:42 AM",

    body: "Your project dashboard has been updated. The latest milestones and deliverables are ready for review.",

    unread: true,

    starred: true,

  },

  {

    id: 2,

    title: "Welcome to the workspace",

    sender: "Workspace Team",

    category: "Updates",

    time: "Yesterday",

    body: "Welcome aboard! You can use your workspace to keep track of projects, messages, and important updates.",

    unread: true,

    starred: false,

  },

  {

    id: 3,

    title: "Meeting reminder",

    sender: "Jordan Lee",

    category: "Personal",

    time: "Yesterday",

    body: "A quick reminder to review the project notes before our next planning meeting.",

    unread: false,

    starred: false,

  },

  {

    id: 4,

    title: "Design review is ready",

    sender: "Avery Patel",

    category: "Projects",

    time: "Mon",

    body: "The updated designs are ready. When you have time, please review the new layout and leave your feedback.",

    unread: false,

    starred: true,

  },

];

const STARTER_IMAGES = [

  {

    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",

    alt: "Mountain landscape",

  },

  {

    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85",

    alt: "Ocean waves",

  },

  {

    src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85",

    alt: "Lake and mountains",

  },

];

// Same photos, shaped for AccordionGallery (no `link`, so a click opens the preview instead of navigating)

const GALLERY_ITEMS = STARTER_IMAGES.map(({ src, alt }) => ({ image: src, label: alt, alt }));

const FILTERS = [

  { value: "all", label: "All" },

  { value: "unread", label: "Unread" },

  { value: "starred", label: "Starred" },

  { value: "trash", label: "Trash" },

];

const CATEGORIES = ["Projects", "Updates", "Personal"];
const EMPTY_DRAFT = { title: "", body: "", category: CATEGORIES[0] };

const SPRING = { type: "spring", stiffness: 360, damping: 30 };

const THEME_KEY = "orbit-theme";

const ICON_PATHS = {

  inbox: <><path d="M4 4h16l2 11h-6l-2 3h-4l-2-3H2L4 4Z" /><path d="M2 15v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-4" /></>,

  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,

  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,

  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,

  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2m-11 0 1 14h10l1-14M10 10v6m4-6v6" /></>,

  close: <path d="m6 6 12 12M18 6 6 18" />,

  arrow: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,

  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,

  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,

  plus: <path d="M12 5v14M5 12h14" />,

  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,

  check: <path d="m5 12 4 4L19 6" />,

  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,

};

/* ---------- Helpers ---------- */

const getInitials = (name) =>

  name

    .split(" ")

    .filter(Boolean)

    .map((part) => part[0])

    .slice(0, 2)

    .join("")

    .toUpperCase();

const getInitialTheme = () => {

  try {

    const saved = localStorage.getItem(THEME_KEY);

    if (saved === "light" || saved === "dark") return saved;

  } catch {

    /* storage unavailable (private mode, etc.) */

  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

};

/* Like useState, but persisted to localStorage (safe if storage is unavailable) */

function useLocalStorage(key, initialValue) {

  const [value, setValue] = useState(() => {

    try {

      const saved = localStorage.getItem(key);

      return saved !== null ? JSON.parse(saved) : initialValue;

    } catch {

      return initialValue;

    }

  });

  useEffect(() => {

    try {

      localStorage.setItem(key, JSON.stringify(value));

    } catch {

      /* ignore */

    }

  }, [key, value]);

  return [value, setValue];

}

/* ---------- Small components ---------- */

const Icon = memo(function Icon({ name }) {

  return (

    <svg

      viewBox="0 0 24 24"

      aria-hidden="true"

      focusable="false"

      className="icon"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.7"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      {ICON_PATHS[name] ?? ICON_PATHS.spark}

    </svg>

  );

});

function ActionButton({ children, variant = "secondary", type = "button", ...props }) {

  // type defaults to "button" so buttons never submit a form by accident

  return (

    <button type={type} className={`button button-${variant}`} {...props}>

      {children}

    </button>

  );

}

function ToolCard({ icon, tone, title, text, actionLabel, onAction, disabled, children }) {

  return (

    <motion.article className="tool-card" whileHover={{ y: -4 }} transition={SPRING}>

      <div className={`tool-icon tool-icon-${tone}`}><Icon name={icon} /></div>

      <h3>{title}</h3>

      <p>{text}</p>

      <ActionButton onClick={onAction} disabled={disabled}>

        {actionLabel} <span className="arrow-symbol" aria-hidden="true">↗</span>

      </ActionButton>

      {children}

    </motion.article>

  );

}

const MessageCard = memo(function MessageCard({ message, onRead, onToggleStar, onDelete, onRestore, onPurge }) {

  return (

    <motion.article

      layout

      className={`message-card ${message.unread ? "message-unread" : ""}`}

      initial={{ opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      exit={{ opacity: 0, x: -28, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}

      transition={{ layout: SPRING, opacity: { duration: 0.18 } }}

    >

      <button type="button" className="message-main" onClick={() => onRead(message.id)}>

        <span className={`message-avatar avatar-${message.id % 4}`}>{getInitials(message.sender)}</span>

        <span className="message-copy">

          <span className="message-meta">

            <strong>{message.sender}</strong>

            <time>{message.time}</time>

          </span>

          <span className="message-title-row">

            <strong>{message.title}</strong>

            {message.unread && <span className="unread-dot" aria-label="Unread" />}

          </span>

          <span className="message-excerpt">{message.body}</span>

          <span className="message-category">{message.category}</span>

        </span>

      </button>

      <div className="message-actions">

        {message.deleted ? (

          <>

            <button type="button" className="text-button" onClick={() => onRestore(message.id)}>Restore</button>

            <button

              type="button"

              className="mini-icon-button delete-message"

              aria-label={`Delete ${message.title} forever`}

              onClick={() => onPurge(message.id)}

            >

              <Icon name="trash" />

            </button>

          </>

        ) : (

          <>

            <button

              type="button"

              className={`mini-icon-button ${message.starred ? "is-starred" : ""}`}

              aria-label={message.starred ? "Unstar message" : "Star message"}

              aria-pressed={message.starred}

              onClick={() => onToggleStar(message.id)}

            >

              <Icon name="star" />

            </button>

            <button

              type="button"

              className="mini-icon-button delete-message"

              aria-label={`Move ${message.title} to trash`}

              onClick={() => onDelete(message.id)}

            >

              <Icon name="trash" />

            </button>

          </>

        )}

      </div>

    </motion.article>

  );

});

/* ---------- App ---------- */

export default function App() {

  const reduceMotion = useReducedMotion();

  // Messages / inbox

  const [messages, setMessages] = useLocalStorage("orbit-messages", INITIAL_MESSAGES);

  const [messagesOpen, setMessagesOpen] = useState(false);

  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [query, setQuery] = useState("");

  const [filter, setFilter] = useState("all");

  const [category, setCategory] = useState("all");

  const [composeOpen, setComposeOpen] = useState(false);

  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const [sortStarred, setSortStarred] = useState(true);

  // Login

  const [loginOpen, setLoginOpen] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  // Profile

  const [profileOpen, setProfileOpen] = useState(false);

  const [username, setUsername] = useLocalStorage("orbit-username", "Alex Morgan");

  const [draftName, setDraftName] = useState("Alex Morgan");

  // Product / cart

  const [productOpen, setProductOpen] = useState(false);

  const [cartCount, setCartCount] = useLocalStorage("orbit-cart", 0);

  // File + gallery

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [fileExists, setFileExists] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);

  // Misc

  const [notification, setNotification] = useState(null);

  const [theme, setTheme] = useState(getInitialTheme);

  /* Theme: the original toggle used a block body without `return`, so state became

     undefined and the theme never changed. Fixed, renamed, and persisted. */

  const toggleTheme = useCallback(() => {

    setTheme((current) => (current === "light" ? "dark" : "light"));

  }, []);

  useEffect(() => {

    document.documentElement.dataset.theme = theme;

    try {

      localStorage.setItem(THEME_KEY, theme);

    } catch {

      /* ignore */

    }

  }, [theme]);

  /* ---------- Derived state ---------- */

  const { activeCount, unreadCount, starredCount, trashCount } = useMemo(() => {

    const active = messages.filter((m) => !m.deleted);

    return {

      activeCount: active.length,

      unreadCount: active.filter((m) => m.unread).length,

      starredCount: active.filter((m) => m.starred).length,

      trashCount: messages.length - active.length,

    };

  }, [messages]);

  const selectedMessage = useMemo(

    () => messages.find((m) => m.id === selectedMessageId) ?? null,

    [messages, selectedMessageId]

  );

  const visibleMessages = useMemo(() => {

    const needle = query.trim().toLowerCase();

    const result = messages.filter((m) => {

      if (filter === "trash") {

        if (!m.deleted) return false;

      } else if (m.deleted) {

        return false;

      }

      const matchesQuery =

        !needle || `${m.title} ${m.sender} ${m.body} ${m.category}`.toLowerCase().includes(needle);

      const matchesFilter =

        filter === "all" ||

        filter === "trash" ||

        (filter === "unread" && m.unread) ||

        (filter === "starred" && m.starred);

      const matchesCategory = category === "all" || m.category === category;

      return matchesQuery && matchesFilter && matchesCategory;

    });

    // Array.prototype.sort is stable, so non-starred order is preserved

    return sortStarred && filter !== "trash"

      ? result.sort((a, b) => Number(b.starred) - Number(a.starred))

      : result;

  }, [messages, query, filter, category, sortStarred]);

  const stats = [

    { label: "Total messages", value: activeCount, icon: "mail", note: "Across your inbox" },

    { label: "Unread", value: unreadCount, icon: "inbox", note: "Ready when you are" },

    { label: "Starred", value: starredCount, icon: "star", note: "Your saved messages" },

    { label: "Cart items", value: cartCount, icon: "plus", note: "Demo shopping cart" },

  ];

  const categoryActivity = useMemo(
    () =>
      CATEGORIES.map((name) => ({
        name,
        messages: messages.filter((message) => !message.deleted && message.category === name).length,
      })),
    [messages]
  );

  /* ---------- Handlers ---------- */

  const notify = useCallback((message, type = "success") => {

    setNotification({ id: Date.now(), message, type });

  }, []);

  const closeNotification = useCallback(() => setNotification(null), []);

  const openInbox = useCallback(() => {

    setSelectedMessageId(null);

    setMessagesOpen(true);

  }, []);

  const closeMessages = useCallback(() => {

    setMessagesOpen(false);

    setSelectedMessageId(null);

    setQuery("");

    setFilter("all");

    setCategory("all");

  }, []);

  const openProfile = useCallback(() => {

    setDraftName(username);

    setProfileOpen(true);

  }, [username]);

  const readMessage = useCallback((id) => {

    setSelectedMessageId(id);

    setMessages((current) => current.map((m) => (m.id === id ? { ...m, unread: false } : m)));

  }, []);

  // Soft delete: moves to Trash so it can be restored

  const deleteMessage = useCallback(

    (id) => {

      setMessages((current) => current.map((m) => (m.id === id ? { ...m, deleted: true } : m)));

      setSelectedMessageId((current) => (current === id ? null : current));

      notify("Moved to Trash", "info");

    },

    [notify, setMessages]

  );

  const restoreMessage = useCallback(

    (id) => {

      setMessages((current) => current.map((m) => (m.id === id ? { ...m, deleted: false } : m)));

      notify("Message restored");

    },

    [notify, setMessages]

  );

  const purgeMessage = useCallback(

    (id) => {

      setMessages((current) => current.filter((m) => m.id !== id));

      notify("Message deleted forever", "info");

    },

    [notify, setMessages]

  );

  const emptyTrash = useCallback(() => {

    setMessages((current) => current.filter((m) => !m.deleted));

    notify("Trash emptied", "info");

  }, [notify, setMessages]);

  const handleCompose = (event) => {

    event.preventDefault();

    const title = draft.title.trim();

    const body = draft.body.trim();

    if (!title || !body) return;

    setMessages((current) => [

      {

        id: Date.now(),

        title,

        body,

        category: draft.category,

        sender: username,

        time: "Just now",

        unread: false,

        starred: false,

        deleted: false,

      },

      ...current,

    ]);

    setDraft(EMPTY_DRAFT);

    setComposeOpen(false);

    setFilter("all");

    notify("Note added to your inbox");

  };

  const toggleStar = useCallback((id) => {

    setMessages((current) => current.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));

  }, []);

  const markAllRead = useCallback(() => {

    setMessages((current) => current.map((m) => ({ ...m, unread: false })));

    notify("All messages marked as read");

  }, [notify]);

  const clearFilters = useCallback(() => {

    setQuery("");

    setFilter("all");

    setCategory("all");

  }, []);

  const handleLogin = (event) => {

    event.preventDefault();

    setLoginOpen(false);

    setPassword("");

    notify(`Demo sign-in submitted for ${email}`, "info");

    setEmail("");

  };

  const handleSaveProfile = (event) => {

    event.preventDefault();

    const name = draftName.trim();

    if (!name) return;

    setUsername(name);

    setProfileOpen(false);

    notify("Profile updated successfully");

  };

  const addToCart = () => {

    setCartCount((count) => count + 1);

    setProductOpen(false);

    notify("Added to your demo cart");

  };

  // Index of the image open in the preview carousel (-1 when closed)

  const imageIndex = selectedImage ? STARTER_IMAGES.findIndex((img) => img.src === selectedImage.src) : -1;

  const changeImage = useCallback((next) => setSelectedImage(STARTER_IMAGES[next]), []);

  const deleteDemoFile = () => {

    setFileExists(false);

    setDeleteOpen(false);

    notify("Demo file deleted", "info");

  };

  // Cmd/Ctrl + K opens the inbox search (the UI already advertises this shortcut)

  useEffect(() => {

    const onKeyDown = (event) => {

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {

        event.preventDefault();

        openInbox();

      }

    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);

  }, [openInbox]);

  const floatAnimation = reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 1.5, 0] };

  const pillAnimation = reduceMotion ? undefined : { y: [0, 6, 0] };

  return (

    <main className={`app-shell ${theme}`}>

      <motion.header

        className="topbar"

        initial={{ opacity: 0, y: -14 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ duration: 0.45 }}

      >

        <motion.button

          type="button"

          onClick={toggleTheme}

          whileHover={{ scale: 1.05 }}

          whileTap={{ scale: 0.95 }}

          className="theme-toggle"

          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}

        >

          <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>

          {theme === "light" ? "Dark mode" : "Light mode"}

        </motion.button>

        <a className="brand" href="#home" aria-label="Orbit home">

          <span className="brand-mark"><Icon name="spark" /></span>

          <span>orbit<span className="brand-dot">.</span></span>

        </a>

        <div className="topbar-actions">

          <button

            type="button"

            className="icon-button notification-trigger"

            aria-label={`Open inbox, ${unreadCount} unread messages`}

            onClick={openInbox}

          >

            <Icon name="bell" />

            {unreadCount > 0 && <span className="notification-dot" />}

          </button>

          <button type="button" className="profile-chip" onClick={openProfile}>

            <span className="avatar">{getInitials(username)}</span>

            <span className="profile-chip-name">{username}</span>

          </button>

        </div>

      </motion.header>

      <motion.section

        className="welcome-section"

        initial={{ opacity: 0, y: 18 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ delay: 0.08, duration: 0.5 }}

      >

        <div>

          <div className="eyebrow"><span className="status-pulse" /> YOUR PERSONAL WORKSPACE</div>

          <h1>Good to see you,<br /><span>{username.split(" ")[0]}.</span></h1>

          <p className="welcome-copy">Everything important, in one calm place.</p>

          <div className="welcome-actions">

            <ActionButton variant="primary" onClick={openInbox}>

              <Icon name="inbox" /> Open inbox <span className="button-count">{unreadCount}</span>

            </ActionButton>

            <ActionButton onClick={openProfile}><Icon name="user" /> Edit profile</ActionButton>

          </div>

        </div>

        <div className="hero-art" aria-hidden="true">

          <div className="hero-orbit orbit-one" />

          <div className="hero-orbit orbit-two" />

          <motion.div

            className="hero-glass-card"

            animate={floatAnimation}

            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}

          >

            <div className="glass-card-top"><span className="glass-dot" /><span className="glass-dot" /><span className="glass-dot" /></div>

            <div className="glass-card-icon"><Icon name="check" /></div>

            <div className="glass-line long" /><div className="glass-line medium" /><div className="glass-line short" />

            <div className="glass-card-footer">

              <span>{unreadCount === 0 ? "All caught up" : `${unreadCount} to review`}</span>

              <span className="mini-check"><Icon name="check" /></span>

            </div>

          </motion.div>

          <motion.div

            className="floating-pill"

            animate={pillAnimation}

            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}

          >

            <span className="pill-dot" /> {unreadCount} unread

          </motion.div>

        </div>

      </motion.section>

      <section className="stats-grid" aria-label="Workspace summary">

        {stats.map((stat, index) => (

          <motion.article

            className="stat-card"

            key={stat.label}

            initial={{ opacity: 0, y: 16 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.12 + index * 0.07 }}

          >

            <div className={`stat-icon stat-icon-${index}`}><Icon name={stat.icon} /></div>

            <div className="stat-value">{stat.value}</div>

            <div className="stat-label">{stat.label}</div>

            <div className="stat-note">{stat.note}</div>

          </motion.article>

        ))}

      </section>

      <Suspense
        fallback={
          <section className="activity-card" aria-label="Loading inbox chart">
            <div className="activity-chart-loading">Loading inbox chart...</div>
          </section>
        }
      >
        <ActivityChart data={categoryActivity} total={activeCount} reduceMotion={reduceMotion} />
      </Suspense>

      <section className="section-heading">

        <div><div className="eyebrow">QUICK ACCESS</div><h2>Your tools</h2></div>

        <span className="section-caption">Interactive demos</span>

      </section>

      <section className="tools-grid" aria-label="Interactive demos">

        <ToolCard

          icon="user" tone="purple" title="Account access" text="Try the animated sign-in flow."

          actionLabel="Open sign in" onAction={() => setLoginOpen(true)}

        />

        <ToolCard

          icon="spark" tone="blue" title="Product preview" text="Explore a product and add it to your cart."

          actionLabel="View product" onAction={() => setProductOpen(true)}

        />

        <ToolCard

          icon="trash" tone="orange" title="File management" text="Practice a destructive-action confirmation."

          actionLabel="Delete demo file" onAction={() => setDeleteOpen(true)} disabled={!fileExists}

        >

          {!fileExists && (

            <button type="button" className="text-button" onClick={() => setFileExists(true)}>

              Restore demo file

            </button>

          )}

        </ToolCard>

        <ToolCard

          icon="image" tone="green" title="Image gallery" text="Open a full-size image preview."

          actionLabel="Open gallery" onAction={() => setSelectedImage(STARTER_IMAGES[0])}

        />

      </section>

      <section className="gallery-strip">

        <div className="section-heading compact">

          <div><div className="eyebrow">VISUAL COLLECTION</div><h2>Little escapes</h2></div>

          <span className="section-caption">Click to preview</span>

        </div>

        <AccordionGallery

          items={GALLERY_ITEMS}

          defaultIndex={1}

          height={380}

          trigger="hover"

          accentColor="#ffffff"

          onSelect={(item) => setSelectedImage({ src: item.image, alt: item.alt })}

        />

      </section>

      <footer className="app-footer">

        <span>orbit<span className="brand-dot">.</span> <span className="footer-muted">A little more organized.</span></span>

        <span>Built to explore React + Motion</span>

      </footer>

      {/* Login */}

      <Modal isOpen={loginOpen} onClose={() => setLoginOpen(false)} title="Welcome back" description="Sign in to continue to your workspace">

        <form onSubmit={handleLogin} className="form-stack">

          <label className="field-label">

            Email address

            <input autoFocus type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />

          </label>

          <label className="field-label">

            Password

            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter any demo password" required minLength={4} />

          </label>

          <ActionButton variant="primary" type="submit">Sign in <span aria-hidden="true">→</span></ActionButton>

          <p className="form-footnote">Demo only — no account is created and no credentials are sent.</p>

        </form>

      </Modal>

      {/* Edit profile */}

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Edit your profile" description="A name that feels like you.">

        <form onSubmit={handleSaveProfile} className="form-stack">

          <label className="field-label">

            Display name

            <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={48} required />

          </label>

          <div className="modal-actions">

            <ActionButton onClick={() => setProfileOpen(false)}>Cancel</ActionButton>

            <ActionButton type="submit" variant="primary" disabled={!draftName.trim()}>Save changes</ActionButton>

          </div>

        </form>

      </Modal>

      {/* Product */}

      <Modal isOpen={productOpen} onClose={() => setProductOpen(false)} title="Product quick view" description="A small demo shop experience.">

        <div className="product-visual" aria-hidden="true"><span>◉</span><span className="product-spark">✦</span></div>

        <div className="product-title-row">

          <div><h3>Studio headphones</h3><p>Wireless · Noise isolating</p></div>

          <strong>$49.99</strong>

        </div>

        <p className="product-description">Comfortable everyday headphones with balanced audio and a rechargeable battery.</p>

        <div className="modal-actions">

          <ActionButton onClick={() => setProductOpen(false)}>Not now</ActionButton>

          <ActionButton variant="primary" onClick={addToCart}><Icon name="plus" /> Add to cart</ActionButton>

        </div>

      </Modal>

      {/* Delete confirmation */}

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete demo file?" description="This action only changes the demo UI.">

        <div className="file-preview">

          <span className="file-type">TXT</span>

          <div><strong>project-notes.txt</strong><small>Plain text document · Demo file</small></div>

        </div>

        <p className="confirm-copy">Are you sure you want to remove this file from the dashboard?</p>

        <div className="modal-actions">

          <ActionButton onClick={() => setDeleteOpen(false)}>Keep file</ActionButton>

          <ActionButton variant="danger" onClick={deleteDemoFile}>Delete file</ActionButton>

        </div>

      </Modal>

      {/* Image preview */}

      <Modal isOpen={Boolean(selectedImage)} onClose={() => setSelectedImage(null)} size="image" title={selectedImage?.alt || "Image preview"}>

        {selectedImage && (

          <div className="image-preview">

            <ImageCarousel images={STARTER_IMAGES} index={imageIndex} onChange={changeImage} />

          </div>

        )}

      </Modal>

      {/* Inbox */}

      <Modal isOpen={messagesOpen} onClose={closeMessages} size="wide" hideHeader>

        <div className="inbox">

          <AnimatePresence mode="wait" initial={false}>

            {selectedMessage ? (

              <motion.section

                key="message-detail"

                className="message-detail"

                initial={{ opacity: 0, x: 18 }}

                animate={{ opacity: 1, x: 0 }}

                exit={{ opacity: 0, x: -18 }}

                transition={{ duration: 0.18 }}

              >

                <div className="inbox-topline">

                  <ActionButton onClick={() => setSelectedMessageId(null)}><Icon name="arrow" /> Back to inbox</ActionButton>

                  <button

                    type="button"

                    className={`icon-button ${selectedMessage.starred ? "is-starred" : ""}`}

                    onClick={() => toggleStar(selectedMessage.id)}

                    aria-label={selectedMessage.starred ? "Unstar message" : "Star message"}

                    aria-pressed={selectedMessage.starred}

                  >

                    <Icon name="star" />

                  </button>

                </div>

                <div className="detail-category">{selectedMessage.category} <span>·</span> {selectedMessage.time}</div>

                <h2 className="detail-title">{selectedMessage.title}</h2>

                <div className="sender-row">

                  <div className="sender-avatar">{getInitials(selectedMessage.sender)}</div>

                  <div><strong>{selectedMessage.sender}</strong><small>To: you</small></div>

                </div>

                <div className="detail-body">{selectedMessage.body}</div>

                <div className="detail-footer">

                  <span><Icon name="check" /> Marked as read</span>

                  <ActionButton variant="danger" onClick={() => deleteMessage(selectedMessage.id)}>

                    <Icon name="trash" /> Delete message

                  </ActionButton>

                </div>

              </motion.section>

            ) : (

              <motion.section

                key="inbox-list"

                className="inbox-list-view"

                initial={{ opacity: 0, x: -12 }}

                animate={{ opacity: 1, x: 0 }}

                exit={{ opacity: 0, x: 12 }}

                transition={{ duration: 0.18 }}

              >

                <div className="inbox-header">

                  <div>

                    <div className="eyebrow">YOUR SPACE</div>

                    <h2>Inbox <span className="inbox-total">{activeCount}</span></h2>

                    <p>You’re in the loop.</p>

                  </div>

                  <div className="inbox-header-actions">

                    <ActionButton variant="primary" onClick={() => setComposeOpen(true)}>

                      <Icon name="plus" /> New note

                    </ActionButton>

                    <button type="button" className="icon-button" aria-label="Close inbox" onClick={closeMessages}>

                      <Icon name="close" />

                    </button>

                  </div>

                </div>

                <label className="search-box">

                  <Icon name="search" />

                  <input

                    autoFocus

                    type="search"

                    value={query}

                    onChange={(e) => setQuery(e.target.value)}

                    placeholder="Search messages, people..."

                    aria-label="Search messages"

                  />

                  <kbd>⌘ K</kbd>

                </label>

                <div className="inbox-toolbar">

                  <div className="filter-tabs" role="group" aria-label="Filter messages">

                    {FILTERS.map(({ value, label }) => (

                      <button

                        type="button"

                        key={value}

                        className={filter === value ? "filter-tab active" : "filter-tab"}

                        aria-pressed={filter === value}

                        onClick={() => setFilter(value)}

                      >

                        {label}

                        {value === "unread" && unreadCount > 0 && <span>{unreadCount}</span>}

                        {value === "trash" && trashCount > 0 && <span>{trashCount}</span>}

                      </button>

                    ))}

                  </div>

                  <button

                    type="button"

                    className={`sort-button ${sortStarred ? "active" : ""}`}

                    aria-pressed={sortStarred}

                    onClick={() => setSortStarred((value) => !value)}

                    title="Toggle starred-first sorting"

                  >

                    <Icon name="star" /> <span>Priority</span>

                  </button>

                </div>

                <div className="filter-tabs category-tabs" role="group" aria-label="Filter by category">

                  {["all", ...CATEGORIES].map((value) => (

                    <button

                      type="button"

                      key={value}

                      className={category === value ? "filter-tab active" : "filter-tab"}

                      aria-pressed={category === value}

                      onClick={() => setCategory(value)}

                    >

                      {value === "all" ? "Any category" : value}

                    </button>

                  ))}

                </div>

                <div className="message-list">

                  <LayoutGroup>

                    <AnimatePresence initial={false}>

                      {visibleMessages.map((message) => (

                        <MessageCard

                          key={message.id}

                          message={message}

                          onRead={readMessage}

                          onToggleStar={toggleStar}

                          onDelete={deleteMessage}

                          onRestore={restoreMessage}

                          onPurge={purgeMessage}

                        />

                      ))}

                    </AnimatePresence>

                  </LayoutGroup>

                  {visibleMessages.length === 0 && (

                    <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                      <span className="empty-icon"><Icon name="search" /></span>

                      <strong>{messages.length === 0 ? "Your inbox is empty" : "No messages found"}</strong>

                      <p>{filter === "trash" ? "Trash is empty." : messages.length === 0 ? "Nothing to see here." : "Try another search or change your filter."}</p>

                      {messages.length > 0 && (

                        <button type="button" className="text-button" onClick={clearFilters}>Clear filters</button>

                      )}

                    </motion.div>

                  )}

                </div>

                <div className="inbox-bottom">

                  <span>{visibleMessages.length} of {filter === "trash" ? trashCount : activeCount} messages</span>

                  {filter === "trash" ? (

                    <button type="button" className="text-button" onClick={emptyTrash} disabled={trashCount === 0}>

                      Empty trash <Icon name="trash" />

                    </button>

                  ) : (

                    <button type="button" className="text-button" onClick={markAllRead} disabled={unreadCount === 0}>

                      Mark all as read <Icon name="check" />

                    </button>

                  )}

                </div>

              </motion.section>

            )}

          </AnimatePresence>

        </div>

      </Modal>

      {/* Compose note */}

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="New note" description="Add a note to your own inbox.">

        <form onSubmit={handleCompose} className="form-stack">

          <label className="field-label">

            Title

            <input autoFocus value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={80} required />

          </label>

          <label className="field-label">

            Category

            <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>

              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}

            </select>

          </label>

          <label className="field-label">

            Note

            <textarea rows={4} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} maxLength={500} required />

          </label>

          <div className="modal-actions">

            <ActionButton onClick={() => setComposeOpen(false)}>Cancel</ActionButton>

            <ActionButton type="submit" variant="primary" disabled={!draft.title.trim() || !draft.body.trim()}>Add note</ActionButton>

          </div>

        </form>

      </Modal>

      <AnimatePresence>

        {notification && (

          <Notification

            key={notification.id}

            message={notification.message}

            type={notification.type}

            onClose={closeNotification}

          />

        )}

      </AnimatePresence>

    </main>

  );

}
