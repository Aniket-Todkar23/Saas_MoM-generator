"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Zap, Bot } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="relative min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Decorative background gradients similar to hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            About Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-rose-500">Mission</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe that meetings should be about exchanging ideas, not scrambling to take notes. Our goal is to give every team an AI-powered assistant.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Clarity",
              description: "Transform chaotic, hour-long discussions into concise, bulleted summaries that get straight to the point.",
              icon: Target,
              gradient: "from-blue-500/10 to-indigo-500/10"
            },
            {
              title: "Speed",
              description: "Using the native Web Speech API, we capture and process your meetings in real-time without bulky downloads.",
              icon: Zap,
              gradient: "from-amber-500/10 to-orange-500/10"
            },
            {
              title: "AI-First",
              description: "Powered by Gemini, our systems extract actionable intelligence—action items, decisions, and context—flawlessly.",
              icon: Bot,
              gradient: "from-rose-500/10 to-pink-500/10"
            }
          ].map((value, idx) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
            >
              <Card className={`h-full border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden relative drop-shadow-md`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-50`} />
                <CardHeader className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                    <value.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <CardTitle className="text-2xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-base text-muted-foreground">{value.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
