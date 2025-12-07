import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { UserProfile, AISettings } from "@/types";

interface RequestBody {
  projectTitle: string;
  proposal: string;
  profile: UserProfile;
  aiSettings: AISettings;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { projectTitle, proposal, profile, aiSettings } = body;

    if (!aiSettings.apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: aiSettings.apiKey,
    });

    const prompt = buildPrompt(projectTitle, proposal, profile);

    const completion = await openai.chat.completions.create({
      model: aiSettings.model || "gpt-4o",
      temperature: aiSettings.temperature || 0.7,
      max_tokens: aiSettings.maxTokens || 1000,
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

    let bid = completion.choices[0]?.message?.content || "";
    
    // Remove all quotation marks from the bid
    bid = bid.replace(/["""''`]/g, "");

    return NextResponse.json({ bid: bid.trim() });
  } catch (error: unknown) {
    console.error("Error generating bid:", error);
    
    // Handle OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      const errorMsg = error.message || "OpenAI API error";
      return NextResponse.json(
        { error: errorMsg },
        { status: error.status || 500 }
      );
    }

    // Handle other errors with actual message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function buildPrompt(projectTitle: string, proposal: string, profile: UserProfile): string {
  return `
PROJECT: ${projectTitle}

CLIENT'S REQUIREMENTS:
${proposal}

MY CREDENTIALS:
- Name: ${profile.name || "Professional Freelancer"}
- Skills: ${profile.skills.length > 0 ? profile.skills.join(", ") : "Relevant technical skills"}
- Experience: ${profile.experience || "Experienced in similar projects"}
- Rate: $${profile.hourlyRate}/hour
- About: ${profile.bio || "Dedicated professional"}

---

Analyze this project and write a WINNING bid. Focus on:
1. What specific problem does the client want solved?
2. What exact deliverables do they need?
3. What concerns might they have?
4. How can I show I'm the RIGHT person for THIS project?

Write the bid now:`;
}

function getSystemPrompt(): string {
  return `You are a top freelancer who wins most bids by making clients feel understood.

WINNING BID STRUCTURE:

1. OPENING - One line with wave emoji, show you read their project
2. BULLET POINTS - 2-3 specific solutions for their requirements  
3. EXPERIENCE - One sentence about relevant work
4. CALL TO ACTION - Invite them to discuss

RULES:
- Start with wave emoji only
- Use bullet points with dashes, no other emojis
- Reference specific things from their proposal
- Keep under 100 words
- No quotation marks anywhere
- No Dear Client or formal greetings
- Sound human, not like a template

EXAMPLE:
👋 I can build your e-commerce mobile app with the features you described.

- Cross-platform React Native for iOS and Android
- Offline cart that syncs when back online
- Stripe payment integration with order notifications

I built 3 similar apps last year. When works for a quick call?`;
}