"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  ArrowRightCircle,
  CheckCircle2,
  FileText,
  HelpCircle,
  MessageSquare,
  Target,
  Zap,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MeetingAnalytics } from "@/lib/meeting-analytics"

type AnalyticsClientProps = {
  analytics: MeetingAnalytics
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: any = {
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
}

export default function AnalyticsClient({ analytics }: AnalyticsClientProps) {
  const totalActions = analytics.actionItems.length
  const rawScore = analytics.durationMins > 0 ? (analytics.decisions + totalActions) / analytics.durationMins : 0
  const normalizedScore = Math.max(0, Math.min(100, Math.round((rawScore / 1.2) * 100)))

  let productivityLabel = "Moderate"
  let progressColor = "bg-amber-500"
  if (rawScore >= 1) {
    productivityLabel = "High Productivity"
    progressColor = "bg-emerald-500"
  } else if (rawScore < 0.6) {
    productivityLabel = "Low Productivity"
    progressColor = "bg-red-500"
  }

  const sentimentData = [
    { name: "Positive", value: analytics.sentimentBreakdown.positive, color: "#10b981" },
    { name: "Neutral", value: analytics.sentimentBreakdown.neutral, color: "#64748b" },
    { name: "Negative", value: analytics.sentimentBreakdown.negative, color: "#ef4444" },
  ]

  const hasSentimentData = sentimentData.some((entry) => entry.value > 0)
  const sentimentChartData = hasSentimentData ? sentimentData : [{ name: "Neutral", value: 1, color: "#64748b" }]

  const hasMeetings = analytics.meetingCount > 0

  return (
    <div className="w-full max-w-6xl px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Meeting Analytics
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Live insights generated from your saved meetings database.</p>
      </motion.div>

      {!hasMeetings ? (
        <Card className="w-full border border-border/50 bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="py-14 px-6 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">No meetings to analyze yet</h2>
            <p className="text-muted-foreground">Record your first meeting to unlock analytics and trend insights.</p>
            <Button asChild className="rounded-full px-6">
              <Link href="/record">Start First Meet</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Words</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.wordCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across {analytics.meetingCount} meetings</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Action Items</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalActions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Extracted from saved MoMs</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Decisions</CardTitle>
                  <Target className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.decisions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Decision points identified</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <MessageSquare className="h-16 w-16" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sentiment</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div
                    className={`text-2xl font-bold ${
                      analytics.sentiment === "Positive"
                        ? "text-emerald-500"
                        : analytics.sentiment === "Negative"
                          ? "text-red-500"
                          : "text-slate-500"
                    }`}
                  >
                    {analytics.sentiment}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{analytics.sentimentReason}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="md:col-span-2">
              <Card className="h-full border border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Productivity Score
                  </CardTitle>
                  <CardDescription>
                    Formula: (Decisions + Action Items) / Estimated Meeting Length
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between mb-2 gap-4">
                    <div className="text-3xl font-bold">
                      {normalizedScore}
                      <span className="text-lg text-muted-foreground font-normal">/100</span>
                    </div>
                    <Badge variant={rawScore >= 1 ? "default" : "secondary"} className="text-sm px-3 py-1 whitespace-nowrap">
                      {productivityLabel}
                    </Badge>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${normalizedScore}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Questions Asked</p>
                        <p className="text-2xl font-bold">{analytics.questions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        <ArrowRightCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Commands Given</p>
                        <p className="text-2xl font-bold">{analytics.commands}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Estimated duration: ~{analytics.durationMins} mins
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-1">
              <Card className="h-full border border-border/50 shadow-sm flex flex-col">
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                  <CardDescription>Per meeting tone breakdown</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center pb-6">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={84}
                          paddingAngle={4}
                          dataKey="value"
                          animationDuration={1300}
                        >
                          {sentimentChartData.map((entry, index) => (
                            <Cell key={`sentiment-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            borderColor: "hsl(var(--border))",
                            backgroundColor: "hsl(var(--card))",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 items-center justify-center mt-2 w-full flex-wrap">
                    {sentimentData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full border border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  <CardDescription>Most frequent topics in your saved meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.keywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8">No keyword data available yet.</p>
                  ) : (
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.keywords} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "currentColor", opacity: 0.72, fontSize: 13 }}
                            width={100}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderRadius: "8px",
                              borderColor: "hsl(var(--border))",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30} animationDuration={1300}>
                            {analytics.keywords.map((entry, index) => (
                              <Cell key={`keyword-cell-${entry.name}`} fill={`hsl(var(--primary) / ${1 - index * 0.14})`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border border-border/50 shadow-sm flex flex-col">
                <CardHeader>
                  <CardTitle>Action Items ({totalActions})</CardTitle>
                  <CardDescription>Task breakdown from generated meeting notes</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {totalActions === 0 ? (
                    <p className="text-sm text-muted-foreground py-8">No action items were extracted yet.</p>
                  ) : (
                    <div className="space-y-3 h-[320px] overflow-y-auto pr-2">
                      <AnimatePresence>
                        {analytics.actionItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(index * 0.03, 0.35) }}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/50 transition-colors"
                          >
                            <div className="mt-0.5">
                              {item.status === "Completed" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  item.status === "Completed" ? "text-muted-foreground line-through" : "font-medium"
                                }`}
                              >
                                {item.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge
                                  variant={
                                    item.priority === "High"
                                      ? "destructive"
                                      : item.priority === "Medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className={`text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider ${
                                    item.priority === "Medium" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                                  }`}
                                >
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider">
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
