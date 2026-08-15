"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Bot, User, Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface MoMChatProps {
  meetingId: string
}

export default function MoMChat({ meetingId }: MoMChatProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hi! I'm your MoM assistant. I can answer questions strictly based on this meeting's transcript. What would you like to know?",
      }])
    }
  }, [messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch("/api/mom/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          message: text,
          history: messages.slice(-10).map(m => ({
            type: m.role === "user" ? "human" : "ai",
            content: m.content,
          })),
        }),
      })

      if (!res.ok) throw new Error("Chat request failed")
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
      
      // Refresh the page data so any added tasks or DB changes are reflected
      router.refresh()
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that request. Please try again.",
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col w-full h-full min-h-[500px] max-h-[700px] rounded-2xl border border-border/60 bg-background/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Agent</p>
          <p className="text-xs text-muted-foreground">Contextual Chat & Tools</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          Guardrailed
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 [scrollbar-width:thin]">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2 items-start", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
              msg.role === "assistant"
                ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                : "bg-muted border border-border"
            )}>
              {msg.role === "assistant"
                ? <Bot className="w-3.5 h-3.5 text-white" />
                : <User className="w-3.5 h-3.5 text-muted-foreground" />
              }
            </div>
            <div className={cn(
              "max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
              msg.role === "assistant"
                ? "bg-muted/60 text-foreground rounded-tl-sm"
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/60 p-3 flex gap-2 items-end bg-background/80">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this meeting..."
          rows={1}
          className="flex-1 resize-none bg-muted/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder:text-muted-foreground/50 max-h-28 [scrollbar-width:thin]"
          style={{ minHeight: "38px" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
