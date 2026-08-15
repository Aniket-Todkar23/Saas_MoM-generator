"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, FileAudio, Calendar, Copy, Check, Printer, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Streamdown } from "streamdown"
import { cn } from "@/lib/utils"
import ActionItemsPanel, { ActionItem } from "@/components/ActionItemsPanel"
import MoMChat from "@/components/MoMChat"

interface Meeting {
  id: string
  title: string
  content: string
  audioUrl: string | null
  transcript: string | null
  createdAt: string
  date: string | null
  actionItems: ActionItem[]
}

export default function MeetingDetailClient({ meeting }: { meeting: Meeting }) {
  const [copied, setCopied] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [activeTab, setActiveTab] = useState<"actionItems" | "agent">("actionItems")

  const handleCopy = async () => {
    await navigator.clipboard.writeText(meeting.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>${meeting.title}</title>
          <style>
            @media print { @page { margin: 20mm; } }
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
            h2 { font-size: 1.2rem; font-weight: bold; margin-top: 1.5rem; }
            p { margin-bottom: 0.8rem; }
            ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
            li { margin-bottom: 0.25rem; }
          </style>
        </head>
        <body>
          <h1>${meeting.title}</h1>
          <p style="color:#666; margin-bottom: 2rem;"><em>${format(new Date(meeting.createdAt), "MMM d, yyyy – h:mm a")}</em></p>
          <div>${document.getElementById("mom-content")?.innerHTML ?? meeting.content}</div>
        </body>
      </html>
    `)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 250)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Subtle bg gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-6 w-full flex-1 flex flex-col min-h-0">
        {/* ── Back + Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mb-8"
        >
          <Link
            href="/past-meets"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Past Meets
          </Link>
        </motion.div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* LEFT: MoM Content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto [scrollbar-width:thin] pr-2 pb-6"
          >
            {/* Header (Title & Date) */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{meeting.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(meeting.createdAt), "MMM d, yyyy – h:mm a")}
                </span>
                {meeting.audioUrl && (
                  <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <FileAudio className="w-3 h-3" />
                    Audio Upload
                  </span>
                )}
                {meeting.actionItems.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {meeting.actionItems.length} Action Item{meeting.actionItems.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* MoM Card */}
            <div className="rounded-2xl border border-border/60 bg-background/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Minutes of Meeting
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background/60 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background/60 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
              <article
                id="mom-content"
                className="text-sm md:text-base leading-relaxed text-foreground/90
                  [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3
                  [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5
                  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-4
                  [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                  [&_li]:mb-1 [&_strong]:font-semibold"
              >
                <Streamdown mode="static">{meeting.content}</Streamdown>
              </article>
            </div>

            {/* Transcript Collapsible */}
            {meeting.transcript && (
              <div className="rounded-2xl border border-border/60 bg-background/50 backdrop-blur-sm overflow-hidden">
                <button
                  onClick={() => setShowTranscript(t => !t)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    Raw Transcript
                  </span>
                  {showTranscript ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {showTranscript && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto [scrollbar-width:thin]">
                      {meeting.transcript}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* RIGHT: Action Items or Agent */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 overflow-y-auto [scrollbar-width:thin] pr-2 pb-6"
          >
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/40 border border-border/40">
              <button
                onClick={() => setActiveTab("actionItems")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  activeTab === "actionItems"
                    ? "bg-background text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Action Items
              </button>
              <button
                onClick={() => setActiveTab("agent")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  activeTab === "agent"
                    ? "bg-background text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Agent Chat
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "actionItems" ? (
              <>
                <ActionItemsPanel
                  meetingId={meeting.id}
                  actionItems={meeting.actionItems}
                />

                {/* Quick Stats */}
                <div className={cn(
                  "rounded-2xl border border-border/60 bg-background/50 p-4 space-y-3",
                  "text-sm text-muted-foreground"
                )}>
                  <p className="font-semibold text-foreground text-xs uppercase tracking-widest">Meeting Stats</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-foreground">{meeting.actionItems.length}</p>
                      <p className="text-xs text-muted-foreground">Action Items</p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-foreground">
                        {meeting.actionItems.filter(i => i.isCompleted).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-foreground">
                        {new Set(meeting.actionItems.map(i => i.assigneeName).filter(Boolean)).size}
                      </p>
                      <p className="text-xs text-muted-foreground">Assignees</p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-foreground">
                        {meeting.transcript ? Math.ceil(meeting.transcript.split(" ").length / 130) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">Est. Minutes</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[600px] flex">
                <MoMChat meetingId={meeting.id} />
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
