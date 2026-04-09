import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildMeetingAnalytics } from "@/lib/meeting-analytics"
import { redirect } from "next/navigation"
import AnalyticsClient from "./AnalyticsClient"

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  const meetings = await prisma.meeting.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
    },
  })

  const analytics = buildMeetingAnalytics(meetings)

  return (
    <main className="min-h-screen pt-24 pb-16 flex justify-center">
      <AnalyticsClient analytics={analytics} />
    </main>
  )
}