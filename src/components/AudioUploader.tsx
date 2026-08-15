"use client"

import React, { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileAudio, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "uploading" | "processing" | "done" | "error"

interface AudioUploaderProps {
  onComplete: (meetingId: string) => void
  onError?: (error: string) => void
}

export default function AudioUploader({ onComplete, onError }: AudioUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [fileName, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    const ACCEPTED = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "video/mp4", "audio/x-m4a"]
    if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(mp3|mp4|m4a|wav|webm|ogg)$/i)) {
      setUploadState("error")
      setStatusMessage("Unsupported file type. Please upload an audio or video file.")
      onError?.("Unsupported file type")
      return
    }

    setFileName(file.name)
    setUploadState("uploading")
    setProgress(0)
    setStatusMessage("Uploading to secure storage...")

    try {
      // 1. Get S3 presigned URL
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/mpeg" }),
      })
      if (!presignRes.ok) throw new Error("Failed to get upload URL")
      const { signedUrl, fileUrl } = await presignRes.json()

      // 2. Upload directly to S3 with XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", signedUrl)
        xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg")
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
        xhr.onerror = () => reject(new Error("Upload failed"))
        xhr.send(file)
      })

      setProgress(100)
      setUploadState("processing")
      setStatusMessage("Transcribing audio with Groq Whisper...")

      // 3. Trigger LangGraph pipeline
      await new Promise(r => setTimeout(r, 800)) // small UX pause
      setStatusMessage("Extracting action items with LangGraph...")

      const genRes = await fetch("/api/mom/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: fileUrl, title: file.name.replace(/\.[^/.]+$/, "") }),
      })

      if (!genRes.ok) {
        const err = await genRes.json()
        throw new Error(err.error || "Failed to generate MinuteFlow")
      }

      const { meeting } = await genRes.json()
      setStatusMessage("Done! Sending action item emails...")
      setUploadState("done")
      setTimeout(() => onComplete(meeting.id), 1200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred"
      setUploadState("error")
      setStatusMessage(msg)
      onError?.(msg)
    }
  }, [onComplete, onError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }, [processFile])

  const reset = () => {
    setUploadState("idle")
    setProgress(0)
    setStatusMessage("")
    setFileName("")
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {uploadState === "idle" && (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            htmlFor="audio-upload"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative w-full max-w-md h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 group",
              isDragging
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
                : "border-border/60 bg-background/40 hover:border-indigo-500/60 hover:bg-indigo-500/5"
            )}
          >
            <input
              id="audio-upload"
              type="file"
              accept="audio/*,video/mp4"
              className="hidden"
              onChange={handleFileChange}
            />
            <motion.div
              animate={{ y: isDragging ? -4 : 0 }}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                isDragging ? "bg-indigo-500/20" : "bg-muted/60 group-hover:bg-indigo-500/10"
              )}
            >
              <Upload className={cn("w-7 h-7 transition-colors", isDragging ? "text-indigo-400" : "text-muted-foreground group-hover:text-indigo-400")} />
            </motion.div>
            <div className="text-center space-y-1 px-4">
              <p className="text-sm font-semibold text-foreground">
                {isDragging ? "Release to upload" : "Drop your meeting audio here"}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse · MP3, MP4, M4A, WAV, WEBM</p>
            </div>
          </motion.label>
        )}

        {(uploadState === "uploading" || uploadState === "processing") && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="currentColor" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - (uploadState === "processing" ? 1 : progress / 100))}`}
                  className={cn("transition-all duration-500", uploadState === "processing" ? "text-purple-500" : "text-indigo-500")}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {uploadState === "processing"
                  ? <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  : <span className="text-xs font-bold text-indigo-400">{progress}%</span>
                }
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileAudio className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[200px]">{fileName}</span>
            </div>
            <p className="text-xs text-muted-foreground animate-pulse text-center">{statusMessage}</p>

            {uploadState === "processing" && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500"
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {uploadState === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-400">MinuteFlow generated! Redirecting…</p>
          </motion.div>
        )}

        {uploadState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md flex flex-col items-center gap-4"
          >
            <div className="w-full p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-400">Upload Failed</p>
                <p className="text-xs text-rose-400/70 mt-0.5">{statusMessage}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" /> Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
