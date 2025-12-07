import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Load a single project by ID with all messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Extract proposal and bid from messages for convenience
    const proposal = project.messages.find(m => m.type === "proposal")?.content || "";
    const generatedBid = project.messages.find(m => m.type === "bid")?.content || "";
    const conversation = project.messages.filter(m => m.type === "client" || m.type === "me");

    return NextResponse.json({ 
      project: {
        ...project,
        proposal,
        generatedBid,
        conversation,
      }
    });
  } catch (error) {
    console.error("Error loading project:", error);
    return NextResponse.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
