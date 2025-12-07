import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { FreelancerProject, UserProfile, AISettings, GeneratedAnswer, ProjectQuestion } from "@/types";

interface RequestBody {
  project: FreelancerProject;
  profile: UserProfile;
  aiSettings: AISettings;
  singleQuestion?: ProjectQuestion;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { project, profile, aiSettings, singleQuestion } = body;

    if (!aiSettings.apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: aiSettings.apiKey,
    });

    const questions = singleQuestion ? [singleQuestion] : project.questions;
    const answers: GeneratedAnswer[] = [];

    for (const question of questions) {
      const prompt = buildPrompt(project, question, profile);

      const completion = await openai.chat.completions.create({
        model: aiSettings.model || "gpt-4o",
        temperature: aiSettings.temperature || 0.7,
        max_tokens: aiSettings.maxTokens || 1000,
        messages: [
          {
            role: "system",
            content: aiSettings.systemPrompt || getDefaultSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const answerText = completion.choices[0]?.message?.content || "";
      
      // Calculate confidence based on various factors
      const confidence = calculateConfidence(answerText, question, profile);

      // Generate improvement suggestions
      const suggestions = generateSuggestions(answerText, question, profile);

      answers.push({
        questionId: question.id,
        question: question.question,
        answer: answerText.trim(),
        confidence,
        suggestions,
      });
    }

    return NextResponse.json({ answers });
  } catch (error) {
    console.error("Error generating answers:", error);
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate answers" },
      { status: 500 }
    );
  }
}

function buildPrompt(
  project: FreelancerProject,
  question: ProjectQuestion,
  profile: UserProfile
): string {
  return `
PROJECT DETAILS:
Title: ${project.title}
Description: ${project.description}
Budget: $${project.budget.min} - $${project.budget.max} (${project.budget.currency})
Required Skills: ${project.skills.join(", ")}
Project Type: ${project.type}

YOUR PROFILE:
Skills: ${profile.skills.join(", ")}
Experience: ${profile.experience || "Not specified"}
Hourly Rate: $${profile.hourlyRate}/hour
Bio: ${profile.bio || "Not specified"}

QUESTION TO ANSWER:
${question.question}
${question.isRequired ? "(This is a required question)" : ""}

Please provide a professional, compelling answer that:
1. Directly addresses the question
2. Highlights relevant skills and experience from the profile
3. Shows understanding of the project requirements
4. Is concise but comprehensive (2-4 paragraphs max)
5. Demonstrates enthusiasm and professionalism
6. Avoids generic or templated responses

Answer:`;
}

function getDefaultSystemPrompt(): string {
  return `You are an expert freelancer assistant helping to craft professional, persuasive responses to project screening questions. 

Your answers should be:
- Concise yet comprehensive
- Professional and confident
- Tailored to the specific project requirements
- Highlighting relevant skills and experience
- Avoiding generic or templated responses
- Written in first person
- Demonstrating clear understanding of the client's needs

Do not include greetings, signatures, or meta-commentary. Focus only on answering the question directly.`;
}

function calculateConfidence(
  answer: string,
  question: ProjectQuestion,
  profile: UserProfile
): number {
  let confidence = 0.7; // Base confidence

  // Longer, more detailed answers get higher confidence
  if (answer.length > 200) confidence += 0.1;
  if (answer.length > 500) confidence += 0.05;

  // Check if answer mentions relevant skills
  const answerLower = answer.toLowerCase();
  const matchedSkills = profile.skills.filter((skill) =>
    answerLower.includes(skill.toLowerCase())
  );
  confidence += Math.min(matchedSkills.length * 0.03, 0.1);

  // Cap confidence at 0.95
  return Math.min(confidence, 0.95);
}

function generateSuggestions(
  answer: string,
  question: ProjectQuestion,
  profile: UserProfile
): string[] {
  const suggestions: string[] = [];
  const answerLower = answer.toLowerCase();

  // Check for missing skills that could be mentioned
  const unmentionedSkills = profile.skills.filter(
    (skill) => !answerLower.includes(skill.toLowerCase())
  );
  if (unmentionedSkills.length > 0 && unmentionedSkills.length <= 3) {
    suggestions.push(`Mention ${unmentionedSkills.slice(0, 2).join(", ")}`);
  }

  // Check answer length
  if (answer.length < 150) {
    suggestions.push("Add more detail");
  }
  if (answer.length > 800) {
    suggestions.push("Consider shortening");
  }

  // Check for common improvements
  if (!answerLower.includes("experience") && profile.experience) {
    suggestions.push("Reference your experience");
  }

  if (!answerLower.includes("portfolio") && profile.portfolio.length > 0) {
    suggestions.push("Mention portfolio examples");
  }

  return suggestions.slice(0, 3);
}

