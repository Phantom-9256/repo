import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "normal",
  hideHeader = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          role="presentation"
        >
          <motion.section
            className={`modal-panel modal-${size}`}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Dialog"}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{
              layout: { type: "spring", stiffness: 340, damping: 32 },
              opacity: { duration: 0.18 },
              y: { type: "spring", stiffness: 340, damping: 28 },
              scale: { type: "spring", stiffness: 340, damping: 28 },
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {!hideHeader && (
              <div className="modal-heading">
                <div>
                  {title && <h2>{title}</h2>}
                  {description && <p>{description}</p>}
                </div>
                <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
                  <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
            )}
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
