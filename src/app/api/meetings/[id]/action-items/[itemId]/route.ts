import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, itemId } = await params
  const { isCompleted } = await req.json()

  // Verify the action item belongs to the user's meeting
  const item = await prisma.actionItem.findFirst({
    where: {
      id: itemId,
      meetingId: id,
      meeting: { userId: session.user.id },
    },
  })

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.actionItem.update({
    where: { id: itemId },
    data: { isCompleted },
  })

  return NextResponse.json({ item: updated })
}
