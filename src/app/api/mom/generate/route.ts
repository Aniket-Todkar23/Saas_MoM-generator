import { NextResponse } from "next/server";
import { momGraph, MoMState } from "@/lib/langgraph/agent";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { audioUrl, transcript: manualTranscript, title, date } = await request.json();

    if (!audioUrl && !manualTranscript) {
      return NextResponse.json({ error: "Either audioUrl or transcript is required" }, { status: 400 });
    }

    let transcript = manualTranscript;

    if (audioUrl) {
      // 1. Download the audio file from S3 to memory
      console.log("Downloading audio from S3:", audioUrl);
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error("Failed to fetch audio from S3");
      
      const arrayBuffer = await audioRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const blob = new Blob([buffer], { type: "audio/mpeg" }); 

      // 2. Transcribe using Groq Whisper API
      console.log("Transcribing with Groq Whisper...");
      const formData = new FormData();
      formData.append("file", blob, "audio.mp3");
      formData.append("model", "whisper-large-v3");

      const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: formData as any,
      });

      if (!groqRes.ok) {
        const errorText = await groqRes.text();
        console.error("Groq Error:", errorText);
        throw new Error(`Groq transcription failed: ${errorText}`);
      }

      const transcriptionData = await groqRes.json();
      transcript = transcriptionData.text;

      console.log("Transcription complete. Length:", transcript.length);
    }

    // 3. Invoke LangGraph Orchestrator
    console.log("Invoking LangGraph pipeline...");
    const finalState = await momGraph.invoke({ transcript }) as MoMState;

    // 4. Save to Database
    const meeting = await prisma.meeting.create({
      data: {
        title: title || "New Meeting",
        content: finalState.summary, // using summary as the main content
        audioUrl,
        transcript,
        date: date ? new Date(date) : new Date(),
        userId: session.user.id,
        actionItems: {
          create: finalState.actionItems.map((item: any) => ({
            description: item.description,
            assigneeName: item.assigneeName,
            assigneeEmail: item.assigneeEmail,
            isCompleted: false,
          })),
        },
      },
      include: {
        actionItems: true,
      },
    });

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate MoM" }, { status: 500 });
  }
}
