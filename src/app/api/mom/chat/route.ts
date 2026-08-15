import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chatGraph, MoMState } from "@/lib/langgraph/agent";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, message, history = [] } = await request.json();

    if (!meetingId || !message) {
      return NextResponse.json({ error: "Meeting ID and message are required" }, { status: 400 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId, userId: session.user.id },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Call LangGraph chat node directly, passing the transcript and summary as context
    const chatState = {
      meetingId: meeting.id,
      transcript: meeting.transcript || "",
      summary: meeting.content || "",
      messages: [
        ...history.map((m: any) =>
          m.type === "ai" ? new AIMessage(m.content) : new HumanMessage(m.content)
        ),
        new HumanMessage(message),
      ],
    };

    const newState = await chatGraph.invoke(chatState) as MoMState;
    const aiMessage = newState.messages[newState.messages.length - 1];

    return NextResponse.json({ response: aiMessage.content });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
