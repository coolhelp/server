import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Load all projects from database
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error loading projects:", error);
    return NextResponse.json(
      { error: "Failed to load projects" },
      { status: 500 }
    );
  }
}

// POST - Save a new project with proposal and bid as messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, proposal, generatedBid } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create project with messages in one transaction
    const project = await prisma.project.create({
      data: {
        title,
        messages: {
          create: [
            ...(proposal ? [{ type: "proposal", content: proposal }] : []),
            ...(generatedBid ? [{ type: "bid", content: generatedBid }] : []),
          ],
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: unknown) {
    console.error("Error saving project:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save project: ${errorMessage}` },
      { status: 500 }
    );
  }
}
