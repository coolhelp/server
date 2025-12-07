import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_SYSTEM_PROMPT = `You are an expert freelancer bid writer creating SHORT, SPECIFIC, WINNING bids.

Rules:
- First sentence ONLY: ONE friendly emoji (👋 or 🤝 or 💬)
- Rest of bid: NO emojis, NO quotation marks
- Use bullet points with dashes (-)
- Keep it under 120 words
- Be specific to their requirements
- End with call to action to discuss`;

// GET - Load AI settings from database
export async function GET() {
  try {
    let aiSettings = await prisma.aISettings.findFirst();
    
    if (!aiSettings) {
      // Create default AI settings if none exists
      aiSettings = await prisma.aISettings.create({
        data: {
          provider: "openai",
          apiKey: "",
          model: "gpt-4o",
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
        },
      });
    }

    return NextResponse.json({
      provider: aiSettings.provider,
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      systemPrompt: aiSettings.systemPrompt,
    });
  } catch (error) {
    console.error("Error loading AI settings:", error);
    return NextResponse.json(
      { error: "Failed to load AI settings" },
      { status: 500 }
    );
  }
}

// POST - Save AI settings to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model, temperature, maxTokens, systemPrompt } = body;

    let aiSettings = await prisma.aISettings.findFirst();

    if (aiSettings) {
      aiSettings = await prisma.aISettings.update({
        where: { id: aiSettings.id },
        data: {
          provider: provider ?? aiSettings.provider,
          apiKey: apiKey ?? aiSettings.apiKey,
          model: model ?? aiSettings.model,
          temperature: temperature ?? aiSettings.temperature,
          maxTokens: maxTokens ?? aiSettings.maxTokens,
          systemPrompt: systemPrompt ?? aiSettings.systemPrompt,
        },
      });
    } else {
      aiSettings = await prisma.aISettings.create({
        data: {
          provider: provider || "openai",
          apiKey: apiKey || "",
          model: model || "gpt-4o",
          temperature: temperature ?? 0.7,
          maxTokens: maxTokens ?? 1000,
          systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
        },
      });
    }

    return NextResponse.json({
      success: true,
      aiSettings: {
        provider: aiSettings.provider,
        apiKey: aiSettings.apiKey,
        model: aiSettings.model,
        temperature: aiSettings.temperature,
        maxTokens: aiSettings.maxTokens,
        systemPrompt: aiSettings.systemPrompt,
      },
    });
  } catch (error) {
    console.error("Error saving AI settings:", error);
    return NextResponse.json(
      { error: "Failed to save AI settings" },
      { status: 500 }
    );
  }
}

