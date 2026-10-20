import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./ImageCarousel.css";

const SWIPE_DISTANCE = 80; // px dragged to count as a swipe
const SWIPE_VELOCITY = 500; // px/s flick to count as a swipe
const AUTOPLAY_MS = 4000;

const SLIDE_SPRING = { type: "spring", stiffness: 300, damping: 32 };

// `custom` carries the travel direction (1 = forward, -1 = back) into enter/exit
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "45%" : dir < 0 ? "-45%" : 0, opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-45%" : "45%", opacity: 0, scale: 0.92 }),
};

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function Chevron({ flip }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/**
 * Controlled image carousel.
 * images: [{ src, alt }]   index: active index   onChange(nextIndex)
 */
export default function ImageCarousel({ images, index, onChange, autoPlayDefault = false }) {
  const reduceMotion = useReducedMotion();
  const total = images.length;
  const image = images[index];

  const [playing, setPlaying] = useState(autoPlayDefault && !reduceMotion);
  const [hovering, setHovering] = useState(false);

  // Work out travel direction from the index change, so arrow keys, thumbnails,
  // swipes and autoplay all animate the right way (including wrap-around).
  const prevIndexRef = useRef(index);
  const directionRef = useRef(1);
  const delta = index - prevIndexRef.current;
  if (delta !== 0) {
    const wrapped = total > 2 && Math.abs(delta) === total - 1;
    directionRef.current = wrapped ? -Math.sign(delta) : Math.sign(delta);
  }
  useEffect(() => {
    prevIndexRef.current = index;
  }, [index]);
  const direction = directionRef.current;

  const move = useCallback(
    (step) => onChange((index + step + total) % total),
    [index, total, onChange]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  const handleDragEnd = (_event, { offset, velocity }) => {
    if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) move(1);
    else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) move(-1);
  };

  if (!image) return null;

  const showProgress = playing && !hovering && total > 1;

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="carousel-stage">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={image.src}
            className="carousel-slide"
            custom={direction}
            variants={reduceMotion ? fadeVariants : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { x: SLIDE_SPRING, scale: { duration: 0.3 }, opacity: { duration: 0.25 } }
            }
            drag={total > 1 && !reduceMotion ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.45}
            onDragEnd={handleDragEnd}
            whileDrag={{ cursor: "grabbing" }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}`}
          >
            <img src={image.src} alt={image.alt} draggable="false" />
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <motion.button
              type="button"
              className="carousel-arrow carousel-arrow-prev"
              aria-label="Previous image"
              onClick={() => move(-1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Chevron flip />
            </motion.button>
            <motion.button
              type="button"
              className="carousel-arrow carousel-arrow-next"
              aria-label="Next image"
              onClick={() => move(1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Chevron />
            </motion.button>
          </>
        )}

        {showProgress && (
          <motion.span
            key={`progress-${index}`}
            className="carousel-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
            onAnimationComplete={() => move(1)}
          />
        )}
      </div>

      <div className="carousel-meta">
        <span className="carousel-caption" aria-live="polite">
          {image.alt} · {index + 1} / {total}
        </span>
        {total > 1 && !reduceMotion && (
          <button
            type="button"
            className="carousel-play"
            aria-pressed={playing}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "❚❚ Pause" : "▶ Autoplay"}
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="carousel-thumbs" role="group" aria-label="Choose image">
          {images.map((item, i) => (
            <button
              type="button"
              key={item.src}
              className={`carousel-thumb ${i === index ? "active" : ""}`}
              aria-label={item.alt}
              aria-pressed={i === index}
              onClick={() => onChange(i)}
            >
              <img src={item.src} alt="" loading="lazy" decoding="async" draggable="false" />
              {i === index && (
                <motion.span
                  layoutId="carousel-thumb-ring"
                  className="carousel-thumb-ring"
                  transition={SLIDE_SPRING}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}