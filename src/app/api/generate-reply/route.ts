import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { UserProfile, AISettings } from "@/types";

interface Message {
  type: string;
  content: string;
}

interface RequestBody {
  projectTitle: string;
  proposal: string;
  generatedBid: string;
  clientReply: string;
  conversationHistory: Message[];
  profile: UserProfile;
  aiSettings: AISettings;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { projectTitle, proposal, generatedBid, clientReply, conversationHistory, profile, aiSettings } = body;

    if (!aiSettings.apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    if (!clientReply) {
      return NextResponse.json(
        { error: "Client reply is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: aiSettings.apiKey,
    });

    const prompt = buildPrompt(projectTitle, proposal, generatedBid, clientReply, conversationHistory, profile);

    const completion = await openai.chat.completions.create({
      model: aiSettings.model || "gpt-4o",
      temperature: aiSettings.temperature || 0.7,
      max_tokens: aiSettings.maxTokens || 500,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let reply = completion.choices[0]?.message?.content || "";
    
    // Remove quotation marks
    reply = reply.replace(/["""''`]/g, "");

    return NextResponse.json({ reply: reply.trim() });
  } catch (error: unknown) {
    console.error("Error generating reply:", error);
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function buildPrompt(
  projectTitle: string, 
  proposal: string, 
  generatedBid: string, 
  clientReply: string,
  conversationHistory: Message[],
  profile: UserProfile
): string {
  let historyText = "";
  if (conversationHistory.length > 0) {
    historyText = "\nPREVIOUS CONVERSATION:\n" + 
      conversationHistory.map(m => `${m.type === "client" ? "CLIENT" : "ME"}: ${m.content}`).join("\n");
  }

  return `
PROJECT: ${projectTitle}

ORIGINAL PROPOSAL: ${proposal}

MY INITIAL BID: ${generatedBid}
${historyText}

CLIENT'S LATEST REPLY:
${clientReply}

MY PROFILE:
- Name: ${profile.name || "Freelancer"}
- Skills: ${profile.skills.length > 0 ? profile.skills.join(", ") : "Various skills"}
- Experience: ${profile.experience || "Experienced"}

Write my reply to continue the conversation and move closer to winning this project:`;
}

function getSystemPrompt(): string {
  return `You are helping a freelancer respond to client messages to win a project.

RULES:
- Be helpful, professional, and friendly
- Answer any questions the client asks directly
- Address any concerns they raise
- Keep moving toward closing the deal
- Keep replies concise (under 80 words)
- Sound human and natural
- No quotation marks
- No formal greetings or sign-offs
- If they ask about price/timeline, be flexible but reasonable
- If they seem ready, suggest next steps (call, starting work, etc.)

Goal: Win the project by building trust and showing you understand their needs.`;
}

