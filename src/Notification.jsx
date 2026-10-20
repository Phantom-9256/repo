import { useEffect, useState } from "react";
import { motion } from "motion/react";

const icons = {
  success: "✓",
  error: "!",
  info: "i",
};

export default function Notification({ message, type = "success", onClose }) {
  const [remaining, setRemaining] = useState(100);

  useEffect(() => {
    const startedAt = Date.now();
    const duration = 3800;
    const tick = setInterval(() => {
      const next = Math.max(0, 100 - ((Date.now() - startedAt) / duration) * 100);
      setRemaining(next);
      if (next <= 0) onClose();
    }, 40);
    return () => clearInterval(tick);
  }, [onClose]);

  return (
    <motion.aside
      className={`toast toast-${type}`}
      role={type === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: -16, x: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <span className="toast-symbol">{icons[type] || icons.info}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">×</button>
      <span className="toast-progress-track"><motion.span className="toast-progress" animate={{ width: `${remaining}%` }} transition={{ duration: 0.05 }} /></span>
    </motion.aside>
  );
}
