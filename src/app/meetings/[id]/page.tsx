import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import MeetingDetailClient from "./MeetingDetailClient"

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const { id } = await params

  const meeting = await prisma.meeting.findUnique({
    where: { id, userId: session.user.id },
    include: {
      actionItems: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!meeting) notFound()

  const serialized = {
    id: meeting.id,
    title: meeting.title,
    content: meeting.content,
    audioUrl: meeting.audioUrl,
    transcript: meeting.transcript,
    createdAt: meeting.createdAt.toISOString(),
    date: meeting.date?.toISOString() ?? null,
    actionItems: meeting.actionItems.map(item => ({
      id: item.id,
      description: item.description,
      assigneeName: item.assigneeName,
      assigneeEmail: item.assigneeEmail,
      isCompleted: item.isCompleted,
    })),
  }

  return <MeetingDetailClient meeting={serialized} />
}
