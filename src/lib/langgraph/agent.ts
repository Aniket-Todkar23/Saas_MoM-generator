import { StateGraph, START, END, Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { sendEmailTool, addActionItemTool } from "./tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import emailMap from "../emailMap.json";

const model = new ChatOpenAI({
  modelName: "openai/gpt-4o-mini",
  temperature: 0.1,
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

const modelWithTools = model.bindTools([sendEmailTool]);
const chatModelWithTools = model.bindTools([sendEmailTool, addActionItemTool]);

// Define State using Annotation.Root (current LangGraph API)
const MoMStateAnnotation = Annotation.Root({
  meetingId: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  transcript: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  summary: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  actionItems: Annotation<{ description: string; assigneeName: string | null; assigneeEmail: string | null }[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  emailsSent: Annotation<boolean>({
    reducer: (x: boolean, y: boolean) => y ?? x,
    default: () => false,
  }),
  status: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "idle",
  }),
});

// Derive the TypeScript type from the annotation
export type MoMState = typeof MoMStateAnnotation.State;

// Node: Analyze Transcript
const analyzeTranscript = async (state: MoMState) => {
  if (!state.transcript) {
    return { status: "error" };
  }

  const prompt = `
  You are an expert meeting assistant. Please analyze the following meeting transcript.
  
  Transcript:
  ${state.transcript}

  Please extract two things:
  1. A general summary of the meeting.
  2. A list of actionable items and the name of the person assigned to each.
  
  Output your response exactly in this JSON format:
  {
    "summary": "...",
    "actionItems": [
      { "description": "...", "assigneeName": "..." }
    ]
  }
  `;

  const jsonModel = new ChatOpenAI({
    modelName: "meta-llama/llama-3.1-70b-instruct",
    temperature: 0.1,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    modelKwargs: { response_format: { type: "json_object" } },
  });

  const response = await jsonModel.invoke([new HumanMessage(prompt)]);
  
  try {
    const content = typeof response.content === "string" ? response.content : "";
    const parsed = JSON.parse(content);
    
    // Map emails
    const actionItemsWithEmails = parsed.actionItems.map((item: any) => {
      const email = (emailMap as Record<string, string>)[item.assigneeName] || null;
      return {
        ...item,
        assigneeEmail: email,
      };
    });

    return {
      summary: parsed.summary,
      actionItems: actionItemsWithEmails,
      status: "analyzed",
    };
  } catch (error) {
    console.error("Failed to parse LLM JSON response", error);
    return { status: "error" };
  }
};

// Node: Execute Email Tool
const executeActionItems = async (state: MoMState) => {
  if (!state.actionItems || state.actionItems.length === 0) {
    return { emailsSent: true, status: "completed" };
  }

  const messages: BaseMessage[] = [];

  for (const item of state.actionItems) {
    if (item.assigneeEmail) {
      const prompt = `You have an action item assigned to ${item.assigneeName} (${item.assigneeEmail}): "${item.description}". Send an email to them right now.`;
      const response = await modelWithTools.invoke([new HumanMessage(prompt)]);
      messages.push(response);
    }
  }

  return { messages, emailsSent: true, status: "completed" };
};

// Node: Chat with Guardrails
const chatNode = async (state: MoMState) => {
  const systemPrompt = `You are an assistant answering questions strictly based on the provided Minutes of Meeting. 
If the user asks a question unrelated to the meeting, politely decline to answer.

IMPORTANT: You have access to tools to add action items (\`add_action_item\`) and send emails (\`send_email\`). 
If the user asks you to add a task, you MUST execute the \`add_action_item\` tool. Do not just reply that you will add it; you must actually call the tool.
If the user asks you to send an email, you MUST execute the \`send_email\` tool.

Context:
Meeting ID: ${state.meetingId}
Transcript: ${state.transcript}
Summary: ${state.summary}
`;

  const messages = [new SystemMessage(systemPrompt), ...state.messages];
  const response = await chatModelWithTools.invoke(messages);
  
  return { messages: [response] };
};

// Tool Nodes
const toolsNode = new ToolNode([sendEmailTool]);
const chatToolsNode = new ToolNode([sendEmailTool, addActionItemTool]);

// Define routing
const shouldContinue = (state: MoMState): "tools" | typeof END => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray((lastMessage as any).tool_calls) &&
    (lastMessage as any).tool_calls.length > 0
  ) {
    return "tools";
  }
  return END;
};

// Create the MoM Graph
export const momGraph = new StateGraph(MoMStateAnnotation)
  .addNode("analyze", analyzeTranscript)
  .addNode("executeActions", executeActionItems)
  .addNode("tools", toolsNode)
  .addEdge(START, "analyze")
  .addEdge("analyze", "executeActions")
  .addConditionalEdges("executeActions", shouldContinue)
  .addEdge("tools", END)
  .compile();

// Create a separate graph specifically for the chat endpoint
export const chatGraph = new StateGraph(MoMStateAnnotation)
  .addNode("chat", chatNode)
  .addNode("tools", chatToolsNode)
  .addEdge(START, "chat")
  .addConditionalEdges("chat", shouldContinue)
  .addEdge("tools", "chat")
  .compile();
