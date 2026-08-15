import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const meeting = await prisma.meeting.findUnique({
    where: { id, userId: session.user.id },
    include: { actionItems: { orderBy: { createdAt: "asc" } } },
  })

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ meeting })
}
