"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, Square, Mail, User, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ActionItem {
  id: string
  description: string
  assigneeName: string | null
  assigneeEmail: string | null
  isCompleted: boolean
}

interface ActionItemsPanelProps {
  meetingId: string
  actionItems: ActionItem[]
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string | null) {
  const colors = [
    "from-indigo-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-blue-500",
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function ActionItemsPanel({ meetingId, actionItems: initial }: ActionItemsPanelProps) {
  const [items, setItems] = useState(initial)
  const [toggling, setToggling] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  React.useEffect(() => {
    setItems(initial)
  }, [initial])

  const toggle = async (itemId: string, current: boolean) => {
    setToggling(itemId)
    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, isCompleted: !current } : i))
    try {
      await fetch(`/api/meetings/${meetingId}/action-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      })
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isCompleted: current } : i))
    } finally {
      setToggling(null)
    }
  }

  const completed = items.filter(i => i.isCompleted).length
  const total = items.length

  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-foreground">Action Items</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            completed === total && total > 0
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-indigo-500/15 text-indigo-400"
          )}>
            {completed}/{total}
          </span>
        </div>
        <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 bg-muted/30 mx-5">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 py-3 flex flex-col gap-2 max-h-96 overflow-y-auto [scrollbar-width:thin]">
              {total === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No action items extracted for this meeting.
                </p>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 group",
                      item.isCompleted
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-indigo-500/15 bg-indigo-500/5 hover:border-indigo-500/30"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(item.id, item.isCompleted)}
                      disabled={toggling === item.id}
                      className={cn(
                        "mt-0.5 shrink-0 transition-colors",
                        item.isCompleted ? "text-emerald-400" : "text-muted-foreground hover:text-indigo-400"
                      )}
                      aria-label={item.isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                      {item.isCompleted
                        ? <CheckSquare className="w-5 h-5" />
                        : <Square className="w-5 h-5" />
                      }
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-snug",
                        item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                      )}>
                        {item.description}
                      </p>

                      {/* Assignee */}
                      {item.assigneeName && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br shrink-0",
                            getAvatarColor(item.assigneeName)
                          )}>
                            {getInitials(item.assigneeName)}
                          </div>
                          <span className="text-xs text-muted-foreground">{item.assigneeName}</span>
                          {item.assigneeEmail && (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              <Mail className="w-2.5 h-2.5" />
                              Emailed
                            </span>
                          )}
                        </div>
                      )}
                      {!item.assigneeName && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <User className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground/50">Unassigned</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
