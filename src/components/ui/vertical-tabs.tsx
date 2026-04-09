"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Mic, FileAudio, Sparkles, Download } from "lucide-react";

// Synchronized MVP Dataset
const STEPS = [
  {
    id: "01",
    title: "Record",
    description: "Hit the record button right from your browser window. We leverage the Web Speech API to ensure your voice is captured securely and fluidly.",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9162c6a?q=80&w=600&auto=format&fit=crop",
    icon: Mic,
  },
  {
    id: "02",
    title: "Live Transcription",
    description: "Watch your spoken words convert to text magically on your screen. You instantly have a raw text backlog of your conversation.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    icon: FileAudio,
  },
  {
    id: "03",
    title: "Gemini Magic",
    description: "Once the meeting concludes, we hand off the raw text to Google Gemini API to structure, summarize, and identify key facts.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop",
    icon: Sparkles,
  },
  {
    id: "04",
    title: "Export & Action",
    description: "Get structured summaries, action items, and key decisions. Copy to your clipboard or download them as PDF/TXT instantly.",
    image: "https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=600&auto=format&fit=crop",
    icon: Download,
  },
];

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-background/[0.08]",
}: {
  className?: string
  delay?: number
  width?: number
  height?: number
  rotate?: number
  gradient?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate: rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute z-0", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-foreground/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  )
}

const AUTO_PLAY_DURATION = 5000;

export function VerticalTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const lastNavigationTime = useRef(0);
  const navigationCooldown = 400;

  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % STEPS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + STEPS.length) % STEPS.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, AUTO_PLAY_DURATION);

    return () => clearInterval(interval);
  }, [activeIndex, handleNext]);

  // Integrated Stack Navigation Logic
  const navigate = useCallback((newDirection: number) => {
    const now = Date.now();
    if (now - lastNavigationTime.current < navigationCooldown) return;
    lastNavigationTime.current = now;

    if (newDirection > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  }, [handleNext, handlePrev]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y < -threshold) {
      navigate(1);
    } else if (info.offset.y > threshold) {
      navigate(-1);
    }
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // SPA SCROLL-UNLOCK LOGIC:
      // Allow natural scroll UP if we are at the very first step.
      if (activeIndex === 0 && e.deltaY < -10) return;
      // Allow natural scroll DOWN if we are at the very last step.
      if (activeIndex === STEPS.length - 1 && e.deltaY > 10) return;

      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        navigate(e.deltaY > 0 ? 1 : -1);
      }
    },
    [navigate, activeIndex]
  );

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const getCardStyle = (index: number) => {
    const total = STEPS.length;
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 };
    } else if (diff === -1) {
      return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
    } else if (diff === -2) {
      return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
    } else if (diff === 1) {
      return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
    } else if (diff === 2) {
      return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
    } else {
      return { y: diff > 0 ? 400 : -400, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 };
    }
  };

  const isVisible = (index: number) => {
    const total = STEPS.length;
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return Math.abs(diff) <= 2;
  };

  return (
    <section className="w-full h-[100dvh] pt-40 pb-8 flex items-center justify-center overflow-hidden relative">

      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-20 mx-auto max-w-7xl relative z-10 h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Rolling Text Content */}
          <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1 relative h-[300px] lg:h-[500px]">
            <div className="absolute top-0 left-0 space-y-1 hidden lg:block">
              <h2 className="tracking-tighter text-balance text-3xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300">
                How It Works
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] block ml-0.5 mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300 w-fit">
                (THE FREE STACK PROCESS)
              </span>
            </div>

            <div className="relative w-full flex-1 flex flex-col justify-center mt-20 lg:mt-32">
              <div className="w-full h-[2px] bg-muted mb-8 relative overflow-hidden rounded-full max-w-md">
                 <motion.div
                    key={`progress-${activeIndex}`}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300 origin-left"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: AUTO_PLAY_DURATION / 1000, ease: "linear" }}
                 />
              </div>

              <div className="relative h-[250px] w-full">
                <AnimatePresence mode="popLayout" custom={direction}>
                  {STEPS.map((step, index) => {
                    if (index !== activeIndex) return null;
                    return (
                      <motion.div
                        key={step.id}
                        custom={direction}
                        initial={{ opacity: 0, y: direction > 0 ? 60 : -60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: direction > 0 ? -60 : 60 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0 }}
                        className="absolute inset-0 flex flex-col justify-start"
                      >
                        <div className="flex items-center gap-4 mb-4 mt-2">
                          <step.icon className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
                          <span className="text-xl font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300">
                            Step {step.id}
                          </span>
                        </div>
                        <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300">
                          {step.title}
                        </h3>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md">
                          {step.description}
                        </p>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Image Stack */}
          <div className="lg:col-span-7 flex flex-col justify-center items-center h-[500px] lg:h-[600px] order-1 lg:order-2 scale-90 lg:scale-100 origin-center">
            <div className="relative flex h-[500px] lg:h-[550px] w-full max-w-[400px] lg:max-w-[450px] items-center justify-center" style={{ perspective: "1200px" }}>
              {STEPS.map((step, index) => {
                if (!isVisible(index)) return null;
                const style = getCardStyle(index);
                const isCurrent = index === activeIndex;

                return (
                  <motion.div
                    key={step.id}
                    className="absolute cursor-grab active:cursor-grabbing"
                    animate={{
                      y: style.y,
                      scale: style.scale,
                      opacity: style.opacity,
                      rotateX: style.rotateX,
                      zIndex: style.zIndex,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                    drag={isCurrent ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    style={{ transformStyle: "preserve-3d", zIndex: style.zIndex }}
                  >
                    <div
                      className="relative h-[450px] lg:h-[500px] w-[400px] lg:w-[450px] overflow-hidden rounded-3xl bg-card ring-1 ring-border/20 group shadow-xl"
                      style={{
                        boxShadow: isCurrent
                          ? "0 25px 50px -12px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--foreground) / 0.05)"
                          : "0 10px 30px -10px hsl(var(--foreground) / 0.1)",
                      }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-foreground/10 via-transparent to-transparent z-10 pointer-events-none" />

                      <img
                        src={step.image}
                        alt={step.title}
                        className="absolute object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                        draggable={false}
                      />
                      
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent z-20 pointer-events-none" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation controls */}
            <div className="flex gap-4 mt-8 z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-90 shadow-sm"
                  aria-label="Previous"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-90 shadow-sm"
                  aria-label="Next"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
