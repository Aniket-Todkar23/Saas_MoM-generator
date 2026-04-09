"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type KeyboardEvent,
} from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface EffectRendererProps {
  text: string;
  isActive: boolean;
  allowDelete?: boolean;
  typeDurationMs: number;
  deleteDurationMs: number;
  pauseAfterTypeMs: number;
  prefersReducedMotion?: boolean;
  onDeleteComplete?: () => void;
  containerRef?: RefObject<HTMLElement | null>;
}

export type BuiltinEffect = "typewriter" | "slide" | "fade" | "none";

export interface SuggestiveSearchProps {
  value?: string;
  onChange?: (val: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  suggestions?: string[];
  className?: string;
  Leading?: () => React.ReactNode;
  showLeading?: boolean;
  Trailing?: () => React.ReactNode;
  showTrailing?: boolean;
  effect?: BuiltinEffect;
  EffectComponent?: React.ComponentType<EffectRendererProps>;
  typeDurationMs?: number;
  deleteDurationMs?: number;
  pauseAfterTypeMs?: number;
  animateMode?: "infinite" | "once";
}

export const TypewriterEffect: React.FC<EffectRendererProps> = ({
  text,
  isActive,
  allowDelete = true,
  typeDurationMs,
  deleteDurationMs,
  pauseAfterTypeMs,
  prefersReducedMotion,
  onDeleteComplete,
  containerRef,
}) => {
  const [phase, setPhase] = useState<"typing" | "paused" | "deleting">("typing");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setPhase("typing");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [text, isActive, allowDelete]);

  useEffect(() => {
    if (!isActive) {
      setPhase("typing");
      timers.current.forEach(clearTimeout);
      timers.current = [];
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !prefersReducedMotion || !allowDelete) return;

    const t = window.setTimeout(
      () => onDeleteComplete?.(),
      Math.max(200, pauseAfterTypeMs)
    );
    timers.current.push(t);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [
    isActive,
    prefersReducedMotion,
    allowDelete,
    pauseAfterTypeMs,
    onDeleteComplete,
  ]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement> | undefined}
      style={{
        display: "inline-block",
        overflow: "hidden",
        whiteSpace: "nowrap",
        alignItems: "center",
      }}
    >
      {prefersReducedMotion ? (
        <span className="text-sm text-muted-foreground select-none">{text}</span>
      ) : (
        <motion.div
          key={text}
          initial={{ width: "0%" }}
          animate={
            phase === "typing"
              ? { width: "100%" }
              : phase === "deleting"
                ? { width: "0%" }
                : { width: "100%" }
          }
          transition={
            phase === "typing"
              ? { duration: typeDurationMs / 1000, ease: "linear" }
              : phase === "deleting"
                ? { duration: deleteDurationMs / 1000, ease: "linear" }
                : {}
          }
          onAnimationComplete={() => {
            if (phase === "typing") {
              setPhase("paused");
              if (allowDelete) {
                const t = window.setTimeout(
                  () => setPhase("deleting"),
                  pauseAfterTypeMs
                );
                timers.current.push(t);
              }
            } else if (phase === "deleting") {
              onDeleteComplete?.();
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span className="text-sm text-muted-foreground select-none">{text}</span>

          <motion.span
            aria-hidden
            style={{
              display: "inline-block",
              width: 1,
              marginLeft: 4,
              height: "1.1em",
              verticalAlign: "middle",
            }}
            className="bg-muted-foreground"
            animate={
              phase === "typing" || phase === "paused"
                ? { opacity: [0, 1, 0] }
                : { opacity: 0 }
            }
            transition={
              phase === "typing" || phase === "paused"
                ? { repeat: Infinity, duration: 0.9, ease: "linear" }
                : { duration: 0.1 }
            }
          />
        </motion.div>
      )}
    </div>
  );
};

export const SlideEffect: React.FC<EffectRendererProps> = ({
  text,
  isActive,
  allowDelete = true,
  typeDurationMs,
  deleteDurationMs,
  pauseAfterTypeMs,
  prefersReducedMotion,
  onDeleteComplete,
  containerRef,
}) => {
  const [phase, setPhase] = useState<"enter" | "pause" | "exit">("enter");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setPhase("enter");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [text, isActive, allowDelete]);

  useEffect(() => {
    if (!isActive) {
      setPhase("enter");
      timers.current.forEach(clearTimeout);
      timers.current = [];
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !prefersReducedMotion || !allowDelete) return;

    const t = window.setTimeout(
      () => onDeleteComplete?.(),
      Math.max(200, pauseAfterTypeMs)
    );
    timers.current.push(t);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [
    isActive,
    prefersReducedMotion,
    allowDelete,
    pauseAfterTypeMs,
    onDeleteComplete,
  ]);

  if (!isActive) return null;

  if (prefersReducedMotion) {
    return <span className="text-sm text-muted-foreground select-none">{text}</span>;
  }

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement> | undefined}
      style={{
        overflow: "hidden",
        display: "inline-block",
        whiteSpace: "nowrap",
        alignItems: "center",
      }}
    >
      <motion.div
        key={text}
        initial={{ y: "-100%" }}
        animate={
          phase === "enter"
            ? { y: "0%" }
            : phase === "exit"
              ? { y: "100%" }
              : { y: "0%" }
        }
        transition={
          phase === "enter"
            ? { duration: typeDurationMs / 1000, ease: "easeOut" }
            : { duration: deleteDurationMs / 1000, ease: "easeIn" }
        }
        onAnimationComplete={() => {
          if (phase === "enter") {
            setPhase("pause");
            if (allowDelete) {
              const t = window.setTimeout(() => setPhase("exit"), pauseAfterTypeMs);
              timers.current.push(t);
            }
          } else if (phase === "exit") {
            onDeleteComplete?.();
          }
        }}
        style={{ display: "inline-block" }}
      >
        <span className="text-sm text-muted-foreground select-none">{text}</span>
      </motion.div>
    </div>
  );
};

export const FadeEffect: React.FC<EffectRendererProps> = ({
  text,
  isActive,
  allowDelete = true,
  typeDurationMs,
  deleteDurationMs,
  pauseAfterTypeMs,
  prefersReducedMotion,
  onDeleteComplete,
  containerRef,
}) => {
  const [phase, setPhase] = useState<"fadeIn" | "hold" | "fadeOut">("fadeIn");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setPhase("fadeIn");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [text, isActive, allowDelete]);

  useEffect(() => {
    if (!isActive) {
      setPhase("fadeIn");
      timers.current.forEach(clearTimeout);
      timers.current = [];
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !prefersReducedMotion || !allowDelete) return;

    const t = window.setTimeout(
      () => onDeleteComplete?.(),
      Math.max(200, pauseAfterTypeMs)
    );
    timers.current.push(t);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [
    isActive,
    prefersReducedMotion,
    allowDelete,
    pauseAfterTypeMs,
    onDeleteComplete,
  ]);

  if (!isActive) return null;

  if (prefersReducedMotion) {
    return <span className="text-sm text-muted-foreground select-none">{text}</span>;
  }

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement> | undefined}
      style={{
        overflow: "hidden",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      <motion.div
        key={text}
        initial={{ opacity: 0 }}
        animate={
          phase === "fadeIn"
            ? { opacity: 1 }
            : phase === "fadeOut"
              ? { opacity: 0 }
              : { opacity: 1 }
        }
        transition={
          phase === "fadeIn"
            ? { duration: typeDurationMs / 1000 }
            : { duration: deleteDurationMs / 1000 }
        }
        onAnimationComplete={() => {
          if (phase === "fadeIn") {
            setPhase("hold");
            if (allowDelete) {
              const t = window.setTimeout(() => setPhase("fadeOut"), pauseAfterTypeMs);
              timers.current.push(t);
            }
          } else if (phase === "fadeOut") {
            onDeleteComplete?.();
          }
        }}
        style={{ display: "inline-block" }}
      >
        <span className="text-sm text-muted-foreground select-none">{text}</span>
      </motion.div>
    </div>
  );
};

export const SuggestiveSearch: React.FC<SuggestiveSearchProps> = ({
  value,
  onChange,
  onKeyDown,
  suggestions = ["Search your favourite movie", "Search user from connection"],
  className,
  Leading = () => <Search className="size-4 text-muted-foreground" />,
  showLeading = true,
  Trailing = () => <Search className="size-4 text-muted-foreground" />,
  showTrailing = false,
  effect = "typewriter",
  EffectComponent,
  typeDurationMs = 500,
  deleteDurationMs = 300,
  pauseAfterTypeMs = 1500,
  animateMode = "infinite",
}) => {
  const [internalSearch, setInternalSearch] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [index, setIndex] = useState<number>(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const isControlled = value !== undefined;
  const search = isControlled ? value : internalSearch;

  const current = useMemo(() => suggestions[index] ?? "", [suggestions, index]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const leadingRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const trailingRef = useRef<HTMLDivElement | null>(null);

  const [leftOffsetPx, setLeftOffsetPx] = useState<number | null>(null);
  const [rightOffsetPx, setRightOffsetPx] = useState<number | null>(null);

  useEffect(() => {
    if (index > suggestions.length - 1) {
      setIndex(0);
    }
  }, [index, suggestions.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mq.matches);
    update();

    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const lead = leadingRef.current;
    const trail = trailingRef.current;
    if (!wrapper) return;

    const update = () => {
      const cs = getComputedStyle(wrapper);
      const padLeft = parseFloat(cs.paddingLeft || "0");
      const padRight = parseFloat(cs.paddingRight || "0");
      const leadW = showLeading ? lead?.getBoundingClientRect().width ?? 0 : 0;
      const trailW = showTrailing ? trail?.getBoundingClientRect().width ?? 0 : 0;
      const left = padLeft + leadW + 8;
      const right = padRight + trailW;
      setLeftOffsetPx(left);
      setRightOffsetPx(right);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    if (lead) ro.observe(lead);
    if (trail) ro.observe(trail);
    return () => ro.disconnect();
  }, [showLeading, showTrailing]);

  useEffect(() => {
    if (suggestions.length <= 1) {
      return;
    }

    if (animateMode === "once" && index >= suggestions.length - 1) {
      return;
    }

    const cycleMs = Math.max(
      900,
      typeDurationMs + pauseAfterTypeMs + deleteDurationMs
    );

    const timerId = window.setTimeout(() => {
      setIndex((prev) => {
        if (animateMode === "once") {
          return Math.min(prev + 1, suggestions.length - 1);
        }
        return (prev + 1) % suggestions.length;
      });
    }, cycleMs);

    return () => window.clearTimeout(timerId);
  }, [
    suggestions.length,
    animateMode,
    index,
    typeDurationMs,
    pauseAfterTypeMs,
    deleteDurationMs,
  ]);

  const builtinMap: Record<BuiltinEffect, React.ComponentType<EffectRendererProps>> = {
    typewriter: TypewriterEffect,
    slide: SlideEffect,
    fade: FadeEffect,
    none: () => null,
  };
  const ChosenEffect = EffectComponent ?? builtinMap[effect];

  const handleInputChange = (val: string) => {
    if (!isControlled) {
      setInternalSearch(val);
    }
    onChange?.(val);
  };

  const overlayActive = !search && !isFocused;
  const allowDelete = false;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative flex items-center gap-x-2 py-2 px-4 border border-border rounded-full",
        className
      )}
      style={{ maxWidth: "100%" }}
    >
      <div ref={leadingRef} className="flex-shrink-0">
        {showLeading && <Leading />}
      </div>

      <input
        type="text"
        value={search}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="bg-transparent outline-none text-sm text-foreground placeholder:text-transparent flex-1 min-w-0"
        placeholder=""
        aria-label="search"
      />

      <div ref={trailingRef} className="flex-shrink-0">
        {showTrailing && Trailing && <Trailing />}
      </div>

      {overlayActive && (
        <div
          ref={overlayRef}
          aria-hidden
          style={{
            position: "absolute",
            left:
              leftOffsetPx != null
                ? `${leftOffsetPx}px`
                : "calc(0.5rem + 1.5rem + 8px)",
            right: rightOffsetPx != null ? `${rightOffsetPx}px` : "0.5rem",
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <ChosenEffect
            text={current}
            isActive={overlayActive}
            allowDelete={allowDelete}
            typeDurationMs={typeDurationMs}
            deleteDurationMs={deleteDurationMs}
            pauseAfterTypeMs={pauseAfterTypeMs}
            prefersReducedMotion={prefersReduced}
            onDeleteComplete={undefined}
            containerRef={overlayRef}
          />
        </div>
      )}
    </div>
  );
};

export default SuggestiveSearch;
