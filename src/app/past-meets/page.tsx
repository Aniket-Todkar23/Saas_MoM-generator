import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import PastMeetsClient from "./PastMeetsClient"

export default async function PastMeetsPage() {
  const session = await auth()
  
  if (!session?.user || !session.user.id) {
    redirect("/")
  }

  const meetings = await prisma.meeting.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      audioUrl: true,
      _count: { select: { actionItems: true } },
    }
  })

  // Convert Date objects to ISO strings for client component
  const serializedMeetings = meetings.map((m: (typeof meetings)[number]) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    audioUrl: m.audioUrl,
    _count: m._count,
  }))

  return (
    <main className="min-h-screen pt-28 pb-16 px-4 max-w-5xl mx-auto flex flex-col items-center">
      <PastMeetsClient initialMeetings={serializedMeetings} />
    </main>
  )
}
