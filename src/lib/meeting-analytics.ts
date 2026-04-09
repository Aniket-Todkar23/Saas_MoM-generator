export type SentimentLabel = "Positive" | "Neutral" | "Negative"

export type KeywordStat = {
  name: string
  count: number
}

export type ActionItemStat = {
  id: string
  meetingId: string
  text: string
  priority: "High" | "Medium" | "Low"
  status: "Completed" | "Pending"
}

export type MeetingRecordForAnalytics = {
  id: string
  title: string
  content: string
  createdAt: Date | string
}

export type MeetingAnalytics = {
  meetingCount: number
  wordCount: number
  durationMins: number
  decisions: number
  questions: number
  commands: number
  keywords: KeywordStat[]
  actionItems: ActionItemStat[]
  sentiment: SentimentLabel
  sentimentReason: string
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
}

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "were", "have", "your", "will", "into", "their", "about", "there",
  "would", "could", "should", "been", "being", "into", "also", "than", "then", "them", "they", "what", "when", "where", "which",
  "while", "who", "whom", "whose", "after", "before", "because", "during", "between", "within", "without", "across", "under", "over",
  "again", "very", "just", "more", "most", "some", "such", "only", "same", "each", "other", "many", "much", "minutes", "meeting",
  "items", "action", "made", "discussion", "points", "attendees", "agenda", "generated", "please", "review", "note",
])

const POSITIVE_TERMS = [
  "good", "great", "excellent", "success", "successful", "improved", "improvement", "growth", "clear", "aligned", "completed",
  "delivered", "on-track", "resolved", "approved", "happy", "confident", "strong", "positive", "efficient",
]

const NEGATIVE_TERMS = [
  "risk", "issue", "issues", "blocked", "delay", "delayed", "problem", "problems", "concern", "concerns", "failed", "failure",
  "missed", "overdue", "negative", "unclear", "conflict", "urgent", "escalation", "bottleneck",
]

function countWords(text: string): number {
  const cleaned = text.replace(/[#*_`>|\-]/g, " ").trim()
  if (!cleaned) return 0
  return cleaned.split(/\s+/).length
}

function extractSection(content: string, sectionTitles: string[]): string {
  const lines = content.split(/\r?\n/)
  const normalizedTitles = sectionTitles.map((title) => title.toLowerCase())

  let start = -1
  for (let i = 0; i < lines.length; i += 1) {
    const normalizedLine = lines[i].toLowerCase().replace(/^#{1,6}\s*/, "").trim()
    if (normalizedTitles.some((title) => normalizedLine.includes(title))) {
      start = i + 1
      break
    }
  }

  if (start === -1) return ""

  const collected: string[] = []
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i]
    if (/^#{1,6}\s+/.test(line) && collected.length > 0) {
      break
    }

    // Handles numbered markdown section headers like "2. Decisions Made"
    if (/^\s*\d+\.\s+/.test(line) && collected.length > 0) {
      break
    }

    collected.push(line)
  }

  return collected.join("\n").trim()
}

function extractBulletItems(sectionText: string): string[] {
  if (!sectionText) return []

  const lines = sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const bulletPattern = /^([-*+]\s+|\d+\.\s+)(.+)$/
  const bullets = lines
    .map((line) => {
      const match = line.match(bulletPattern)
      return match ? match[2].trim() : ""
    })
    .filter(Boolean)

  return bullets
}

function inferPriority(text: string): "High" | "Medium" | "Low" {
  const normalized = text.toLowerCase()
  if (/(high priority|asap|urgent|immediately|critical|blocker|today|tomorrow)/.test(normalized)) {
    return "High"
  }
  if (/(optional|nice to have|low priority|someday|later|when possible)/.test(normalized)) {
    return "Low"
  }
  return "Medium"
}

function inferStatus(text: string): "Completed" | "Pending" {
  return /(done|completed|finished|closed|resolved|shipped)/i.test(text) ? "Completed" : "Pending"
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

function classifySentiment(score: number): SentimentLabel {
  if (score > 1) return "Positive"
  if (score < -1) return "Negative"
  return "Neutral"
}

export function buildMeetingAnalytics(meetings: MeetingRecordForAnalytics[]): MeetingAnalytics {
  const fullText = meetings.map((meeting) => `${meeting.title}\n${meeting.content}`).join("\n")
  const wordCount = countWords(fullText)
  const durationMins = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 130))

  const actionItems: ActionItemStat[] = []
  let decisions = 0
  let questions = 0
  let commands = 0

  let positiveMeetings = 0
  let neutralMeetings = 0
  let negativeMeetings = 0
  let aggregateSentimentScore = 0

  meetings.forEach((meeting, meetingIdx) => {
    const combined = `${meeting.title}\n${meeting.content}`

    const actionSection = extractSection(meeting.content, ["action items", "next steps", "tasks"])
    const actionBullets = extractBulletItems(actionSection)
    actionBullets.forEach((item, itemIdx) => {
      actionItems.push({
        id: `${meeting.id}-${itemIdx + 1}`,
        meetingId: meeting.id,
        text: item,
        priority: inferPriority(item),
        status: inferStatus(item),
      })
    })

    const decisionSection = extractSection(meeting.content, ["decisions made", "decisions", "key decisions"])
    const decisionBullets = extractBulletItems(decisionSection)
    if (decisionBullets.length > 0) {
      decisions += decisionBullets.length
    } else {
      decisions += countMatches(meeting.content, /\b(decided|approved|agreed|finalized|confirmed)\b/gi)
    }

    questions += countMatches(combined, /\?/g)
    commands += countMatches(
      combined,
      /\b(do|complete|finish|prepare|send|review|update|schedule|assign|follow up|share|deploy|implement|document|fix)\b/gi,
    )

    const positiveCount = POSITIVE_TERMS.reduce(
      (sum, term) => sum + countMatches(combined.toLowerCase(), new RegExp(`\\b${term}\\b`, "g")),
      0,
    )
    const negativeCount = NEGATIVE_TERMS.reduce(
      (sum, term) => sum + countMatches(combined.toLowerCase(), new RegExp(`\\b${term}\\b`, "g")),
      0,
    )

    const score = positiveCount - negativeCount
    aggregateSentimentScore += score

    const label = classifySentiment(score)
    if (label === "Positive") positiveMeetings += 1
    if (label === "Neutral") neutralMeetings += 1
    if (label === "Negative") negativeMeetings += 1

    if (actionBullets.length === 0) {
      const fallbackTaskMatches = meeting.content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^[-*+]\s+/.test(line) && /\b(will|to do|todo|follow up|next step)\b/i.test(line))
        .map((line) => line.replace(/^[-*+]\s+/, ""))

      fallbackTaskMatches.forEach((item, itemIdx) => {
        actionItems.push({
          id: `${meeting.id}-fallback-${meetingIdx + 1}-${itemIdx + 1}`,
          meetingId: meeting.id,
          text: item,
          priority: inferPriority(item),
          status: inferStatus(item),
        })
      })
    }
  })

  const tokenCounts = new Map<string, number>()
  for (const token of fullText.toLowerCase().match(/[a-z]{3,}/g) ?? []) {
    if (STOP_WORDS.has(token)) continue
    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1)
  }

  const keywords = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const sentiment = classifySentiment(aggregateSentimentScore)
  const sentimentReason =
    sentiment === "Positive"
      ? "More positive indicators than blockers were found across your meeting notes."
      : sentiment === "Negative"
        ? "Risk and blocker terms appear more often than positive outcome indicators."
        : "The language is balanced, with a similar mix of positive and risk-oriented terms."

  return {
    meetingCount: meetings.length,
    wordCount,
    durationMins,
    decisions,
    questions,
    commands,
    keywords,
    actionItems: actionItems.slice(0, 30),
    sentiment,
    sentimentReason,
    sentimentBreakdown: {
      positive: positiveMeetings,
      neutral: neutralMeetings,
      negative: negativeMeetings,
    },
  }
}
