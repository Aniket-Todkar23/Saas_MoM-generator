"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Pause, Square, Play, FileText, Loader2, ArrowLeft, XCircle, Copy, RotateCcw, Upload } from "lucide-react"
import { Streamdown } from "streamdown"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useRecordingStore } from "@/store/recording-store"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { AnimatedBlobs } from "@/components/ui/blobs"
import AudioUploader from "@/components/AudioUploader"

// ── Web Speech API types ──────────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  length: number; [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean; length: number; [index: number]: { transcript: string }
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string
  start(): void; stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
}

import { signIn } from "next-auth/react"

export default function RecordPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"mic" | "upload">("mic")
  const {
    state, transcript, elapsed, minuteFlow, error,
    setRecordingState, setTranscript, appendTranscript,
    setElapsed, incrementElapsed, setMinuteFlow, setError,
    setAbortController, abortController, reset,
  } = useRecordingStore()

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const interimRef = useRef("")
  const [interimText, setInterimText] = React.useState("")
  const [audioLevel, setAudioLevel] = React.useState(0)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [creditsRemaining, setCreditsRemaining] = React.useState<number | null>(null)
  const [freeLimit, setFreeLimit] = React.useState(5)
  const [creditsLoading, setCreditsLoading] = React.useState(true)
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  const loadCredits = useCallback(async () => {
    setCreditsLoading(true)

    try {
      const res = await fetch("/api/generate-mom", { method: "GET" })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))

      if (typeof data?.isLoggedIn === "boolean") setIsLoggedIn(data.isLoggedIn)
      if (data?.creditsRemaining === null || typeof data?.creditsRemaining === "number") {
        setCreditsRemaining(data.creditsRemaining)
      }
      if (typeof data?.freeLimit === "number") setFreeLimit(data.freeLimit)
    } finally {
      setCreditsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCredits()
  }, [loadCredits])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state === "recording") {
      timerRef.current = setInterval(() => incrementElapsed(), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state, incrementElapsed])

  // ── Audio analyser ─────────────────────────────────────────────────────────
  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        setAudioLevel((data.reduce((a, b) => a + b, 0) / data.length) / 128)
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { /* env without mic */ }
  }, [])

  const stopAnalyser = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioCtxRef.current) audioCtxRef.current.close()
    setAudioLevel(0)
  }, [])

  // ── Speech recognition factory ─────────────────────────────────────────────
  const initRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = "en-US"
    r.onresult = (e) => {
      let final = ""
      let interim = ""

      // Only process new result entries to avoid re-appending previously finalized speech.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0]?.transcript ?? ""
        if (e.results[i].isFinal) final += text + " "
        else interim += text
      }

      if (final.trim()) {
        const normalizedFinal = final.replace(/\s+/g, " ").trim().toLowerCase()
        const normalizedTranscript = useRecordingStore
          .getState()
          .transcript
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()

        // Some engines resend the same final chunk after short pauses.
        if (!normalizedTranscript.endsWith(normalizedFinal)) {
          appendTranscript(final)
        }
      }

      interimRef.current = interim
      setInterimText(interim)
    }
    r.onerror = () => {}
    return r
  }, [appendTranscript])

  // ── Premium MinuteFlow API call ───────────────────────────────────────────────────
  const generateMinuteFlow = useCallback(async (finalTranscript: string) => {
    const ac = new AbortController()
    setAbortController(ac)
    setRecordingState("processing")
    setMinuteFlow("")
    setError(null)

    try {
      const res = await fetch("/api/generate-mom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript }),
        signal: ac.signal,
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))

      if (typeof data?.isLoggedIn === "boolean") setIsLoggedIn(data.isLoggedIn)
      if (data?.creditsRemaining === null || typeof data?.creditsRemaining === "number") {
        setCreditsRemaining(data.creditsRemaining)
      }
      if (typeof data?.freeLimit === "number") setFreeLimit(data.freeLimit)

      if (!res.ok) {
        const errorMessage = typeof data?.error === "string" ? data.error : "Failed"
        throw new Error(errorMessage)
      }

      setMinuteFlow(typeof data?.minuteFlow === "string" ? data.minuteFlow : typeof data?.mom === "string" ? data.mom : "")
      setRecordingState("done")
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setRecordingState("idle") // user cancelled — back to idle
      } else {
        setError(err instanceof Error ? err.message : "Unknown error")
        setRecordingState("done")
      }
    } finally {
      setAbortController(null)
    }
  }, [setAbortController, setRecordingState, setMinuteFlow, setError])

  const handleLogin = useCallback(() => {
    if (isLoggingIn) return

    setIsLoggingIn(true)
    setError(null)
    signIn("google", { callbackUrl: "/record" })
  }, [isLoggingIn, setError])

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    reset()
    setElapsed(0)
    const r = initRecognition()
    if (r) { recognitionRef.current = r; r.start() }
    startAnalyser()
    setRecordingState("recording")
  }, [reset, setElapsed, initRecognition, startAnalyser, setRecordingState])

  const handlePause = useCallback(() => {
    recognitionRef.current?.stop()
    stopAnalyser()
    interimRef.current = ""
    setInterimText("")
    setRecordingState("paused")
  }, [stopAnalyser, setRecordingState])

  const handleResume = useCallback(() => {
    const r = initRecognition()
    if (r) { recognitionRef.current = r; r.start() }
    startAnalyser()
    setRecordingState("recording")
  }, [initRecognition, startAnalyser, setRecordingState])

  const handleStop = useCallback(() => {
    recognitionRef.current?.stop()
    stopAnalyser()
    setInterimText("")

    if (!isLoggedIn && creditsRemaining === 0) {
      setError("Free credits exhausted. Please login to continue generating MinuteFlow.")
      setRecordingState("done")
      return
    }

    // Capture transcript from store at this point + any lingering interim text
    const storeTranscript = useRecordingStore.getState().transcript
    const finalTranscriptToUse = (storeTranscript + " " + interimRef.current).trim()
    generateMinuteFlow(finalTranscriptToUse)
  }, [stopAnalyser, isLoggedIn, creditsRemaining, setError, setRecordingState, generateMinuteFlow])

  const handleAbortMinuteFlow = useCallback(() => {
    abortController?.abort()
  }, [abortController])

  const handleReset = useCallback(() => {
    abortController?.abort()
    reset()
    setInterimText("")
    setAudioLevel(0)
  }, [abortController, reset])

  // ── Derived ────────────────────────────────────────────────────────────────
  const isRecording = state === "recording"
  const isPaused = state === "paused"
  const isProcessing = state === "processing"
  const isDone = state === "done"
  const isActive = isRecording || isPaused
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-rose-500/[0.04] pointer-events-none" />

      {/* Floating back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => router.back()}
        className="fixed top-[5.5rem] left-6 z-50 group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground bg-background/60 border border-border/40 backdrop-blur-md hover:text-foreground hover:border-foreground/30 transition-all"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35 }}
        className="fixed top-[5.5rem] right-6 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-background/60 border border-border/40 backdrop-blur-md"
      >
        <div className="text-sm font-medium text-muted-foreground">
          {isLoggedIn
            ? "Premium: Unlimited"
            : creditsLoading
              ? `Credits: --/${freeLimit}`
              : `Credits: ${creditsRemaining ?? 0}/${freeLimit}`}
        </div>
        {!isLoggedIn && !creditsLoading && creditsRemaining === 0 && (
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? "Redirecting..." : "Log In with Google"}
          </button>
        )}
      </motion.div>

      <main className="flex-1 flex items-center justify-center pt-28 pb-10 px-6 md:px-12 relative z-10">
        <div className={cn("w-full max-w-6xl grid gap-8 lg:gap-16 items-start", activeTab === "mic" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>

          {/* ─── LEFT: Controls ─────────────────────────────────────── */}
          <div className="flex flex-col items-center justify-center gap-8 lg:pt-12">
            
            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300">
                {activeTab === "upload"
                  ? "Upload Meeting Audio"
                  : state === "idle" ? "Start Recording" : state === "recording" ? "Recording…" : state === "paused" ? "Paused" : state === "processing" ? "Generating MinuteFlow…" : "Complete"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeTab === "upload"
                  ? "Upload a recorded meeting to auto-generate MinuteFlow"
                  : state === "idle" ? "Tap the mic to begin capturing your meeting" : formatTime(elapsed)}
              </p>
            </div>

            {/* Tab Switcher */}
            {state === "idle" && (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/40 border border-border/40">
                <button
                  onClick={() => setActiveTab("mic")}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all",
                    activeTab === "mic"
                      ? "bg-background text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Mic className="w-4 h-4" />
                  Record Mic
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all",
                    activeTab === "upload"
                      ? "bg-background text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio
                </button>
              </div>
            )}

            {/* Upload Tab Content */}
            {activeTab === "upload" && state === "idle" && (
              <AudioUploader
                onComplete={(meetingId) => router.push(`/meetings/${meetingId}`)}
              />
            )}

            {/* Mic button — only on mic tab */}
            {activeTab === "mic" && (
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                  <AnimatedBlobs className="w-[160px] h-[160px] opacity-70" />
                </div>
              )}
              {isRecording && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-indigo-500/20 z-0"
                      animate={{ scale: [1, 1.6 + i * 0.4 + audioLevel * 0.4], opacity: [0.5, 0] }}
                      transition={{ duration: 1.2 + i * 0.4, repeat: Infinity, ease: "easeOut", delay: i * 0.3 }}
                      style={{ width: 120, height: 120 }}
                    />
                  ))}
                </>
              )}

              <motion.button
                onClick={state === "idle" ? handleStart : undefined}
                whileHover={state === "idle" ? { scale: 1.06 } : {}}
                whileTap={state === "idle" ? { scale: 0.95 } : {}}
                className={cn(
                  "relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 focus:outline-none",
                  state === "idle" ? "bg-gradient-to-br from-indigo-500 to-purple-600 cursor-pointer hover:shadow-indigo-500/40"
                    : isRecording ? "bg-gradient-to-br from-rose-500 to-pink-600 cursor-default"
                    : isPaused ? "bg-gradient-to-br from-amber-500 to-orange-500 cursor-default"
                    : "bg-gradient-to-br from-indigo-500/40 to-purple-600/40 cursor-default"
                )}
                aria-label="Microphone"
              >
                {isProcessing ? <Loader2 className="w-10 h-10 text-white animate-spin" />
                  : isDone ? <FileText className="w-10 h-10 text-white" />
                  : <Mic className={cn("w-10 h-10 text-white", isRecording && "animate-pulse")} />
                }
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/40"
                    animate={{ scale: 1 + audioLevel * 0.15 }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.button>
            </div>
            )}

            {/* Recording controls */}
            <AnimatePresence mode="wait">
              {isActive && activeTab === "mic" && (
                <motion.div
                  key="rec-controls"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                  className="flex items-center gap-4"
                >
                  {isRecording ? (
                    <button onClick={handlePause}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-500/50 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-sm font-medium transition-all">
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  ) : (
                    <button onClick={handleResume}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-indigo-500/50 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 text-sm font-medium transition-all">
                      <Play className="w-4 h-4" /> Resume
                    </button>
                  )}
                  <button onClick={handleStop}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-500/50 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-sm font-medium transition-all">
                    <Square className="w-4 h-4" /> Stop & Generate
                  </button>
                </motion.div>
              )}

              {/* Abort MinuteFlow generation */}
              {isProcessing && activeTab === "mic" && (
                <motion.div
                  key="abort-controls"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className="text-xs text-muted-foreground/70 text-center max-w-xs">
                    AI is structuring your transcript into a professional MinuteFlow...
                  </p>
                  <button onClick={handleAbortMinuteFlow}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-sm font-medium transition-all">
                    <XCircle className="w-4 h-4" /> Stop & Discard
                  </button>
                </motion.div>
              )}

              {/* Done controls */}
              {isDone && activeTab === "mic" && (
                <motion.div
                  key="done-controls"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <button onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 text-sm font-medium transition-all">
                    <RotateCcw className="w-4 h-4" /> New Recording
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(minuteFlow)}
                    disabled={!minuteFlow}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                    <Copy className="w-4 h-4" /> Copy MinuteFlow
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {state === "idle" && activeTab === "mic" && (
              <p className="text-xs text-muted-foreground/50 text-center max-w-xs">
                Speech is processed locally via the Web Speech API. MinuteFlow is generated by a premium AI model.
              </p>
            )}
          </div>

          {/* ─── RIGHT: Live Transcript + MinuteFlow Output ────────────────── */}
          {activeTab === "mic" && (
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {isDone ? "Minutes of Meeting" : "Live Transcript"}
              </h2>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> LIVE
                </span>
              )}
              {isProcessing && (
                <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> PROCESSING
                </span>
              )}
            </div>

            {/* Container */}
            <HoverBorderGradient
              as="div"
              active={isRecording}
              data-lenis-prevent
              data-lenis-prevent-wheel
              containerClassName={cn("relative w-full rounded-2xl p-[2px] transition-all duration-500", "min-h-[460px] max-h-[70vh]")}
              className={cn(
              "relative w-full flex flex-col h-full rounded-2xl border border-dashed/50 p-6 transition-all duration-500 overflow-y-auto overscroll-contain text-left items-start content-start justify-start",
              "min-h-[460px] max-h-[70vh]",
              isRecording
                ? "border-indigo-500/70 bg-indigo-500/10 dark:border-indigo-300/70 dark:bg-indigo-300/10"
                : isPaused
                  ? "border-amber-500/70 bg-amber-500/10 dark:border-amber-300/70 dark:bg-amber-300/10"
                  : isDone && !error
                    ? "border-emerald-500/70 bg-emerald-500/10 dark:border-emerald-300/70 dark:bg-emerald-300/10"
                    : error
                      ? "border-rose-500/70 bg-rose-500/10 dark:border-rose-300/70 dark:bg-rose-300/10"
                      : "border-border/80 bg-background/60 backdrop-blur-md"
            )}>
              
              {/* Idle placeholder */}
              {state === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                  <Mic className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground/40 max-w-xs">
                    Your live transcript will appear here as you speak
                  </p>
                </div>
              )}

              {/* Processing overlay — only inside this container */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-2xl backdrop-blur-md bg-background/70 z-20 flex flex-col items-center justify-center gap-5"
                  >
                    <div className="relative w-16 h-16">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-foreground">Generating Minutes of Meeting</p>
                      <p className="text-xs text-muted-foreground">AI is processing your transcript...</p>
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                          animate={{ y: [-3, 3, -3] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
                  <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              {/* MinuteFlow output (markdown-like rendering with whitespace) */}
              {isDone && minuteFlow && (
                <div className="max-w-none text-foreground/90">
                  <Streamdown mode="static">{minuteFlow}</Streamdown>
                </div>
              )}

              {/* Live transcript text (shown when not done) */}
              {!isDone && (
                <p className="text-base text-foreground/90 leading-relaxed font-light whitespace-pre-wrap">
                  {transcript}
                  {interimText && <span className="text-muted-foreground/60 italic">{interimText}</span>}
                  {isRecording && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 align-middle"
                    />
                  )}
                </p>
              )}

              {/* Word count */}
              {transcript.length > 0 && !isDone && (
                <div className="absolute bottom-3 right-4 text-xs text-muted-foreground/30 z-10">
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words
                </div>
              )}
            </HoverBorderGradient>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
