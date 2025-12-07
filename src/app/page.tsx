"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components";
import { useAppStore } from "@/lib/store";
import { cn, formatRelativeTime } from "@/lib/utils";
import { FileText, ChevronRight, Loader2, Download, Trash2 } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface Message {
  id: string;
  type: string;  // "proposal", "bid", "client", "me"
  content: string;
  createdAt: string;
}

interface SavedProject {
  id: string;
  title: string;
  proposal: string;
  generatedBid: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { sidebarOpen } = useAppStore();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load saved projects from database
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleExport = async (project: SavedProject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setExportingId(project.id);

    try {
      // Fetch project with all messages
      const response = await fetch(`/api/projects/${project.id}`);
      const data = await response.json();
      const allMessages: Message[] = data.project.messages || [];
      
      // Extract different message types
      const proposalMsg = allMessages.find(m => m.type === "proposal");
      const bidMsg = allMessages.find(m => m.type === "bid");
      const conversationMsgs = allMessages.filter(m => m.type === "client" || m.type === "me");

      const proposal = proposalMsg?.content || "";
      const generatedBid = bidMsg?.content || "";

      // Build conversation text
      let conversationText = "";
      if (conversationMsgs.length > 0) {
        conversationText = conversationMsgs.map(msg => 
          `${msg.type === "client" ? "CLIENT" : "ME"}: ${msg.content}`
        ).join("\n\n");
      }

      // Create comprehensive Cursor-ready prompt content
      const cursorPrompt = `# PROJECT IMPLEMENTATION GUIDE
# Project: ${project.title}
# Generated: ${new Date().toLocaleDateString()}

================================================================================
SECTION 1: COMPLETE PROJECT CONTEXT
================================================================================

## 1.1 Client's Original Requirements
${proposal}

## 1.2 My Accepted Proposal
${generatedBid || "No bid generated"}

## 1.3 Full Conversation History
${conversationText || "No additional conversation"}

================================================================================
SECTION 2: CURSOR EDITOR - DIRECT IMPLEMENTATION PROMPT
================================================================================

Copy everything below this line and paste directly into Cursor Editor:

---BEGIN CURSOR PROMPT---

I need you to implement a complete project based on the following requirements gathered from client discussions:

PROJECT NAME: ${project.title}

ORIGINAL CLIENT REQUIREMENTS:
${proposal}

WHAT I PROMISED TO DELIVER:
${generatedBid || "Standard implementation"}

ADDITIONAL REQUIREMENTS FROM CONVERSATION:
${conversationText || "None"}

IMPLEMENTATION INSTRUCTIONS:

1. ANALYZE all requirements above carefully
2. IDENTIFY the tech stack needed (frameworks, libraries, databases)
3. CREATE the complete project structure
4. IMPLEMENT all features mentioned in:
   - The original client requirements
   - My proposal/bid
   - Any additional details from our conversation
5. ADD proper error handling, validation, and security
6. INCLUDE configuration files (package.json, .env.example, etc.)
7. WRITE clean, well-documented code

IMPORTANT NOTES:
- Follow best practices for the chosen tech stack
- Make the code production-ready
- Include setup instructions
- Handle edge cases mentioned in the conversation

Please start implementing now. Create all necessary files and folders.

---END CURSOR PROMPT---

================================================================================
SECTION 3: EXTRACTED REQUIREMENTS SUMMARY
================================================================================

Project Title: ${project.title}

Key Deliverables (extracted from all communications):
- Review the proposal and conversation above for specific features
- Pay attention to any technical specifications mentioned
- Note any deadlines or timeline requirements discussed
- Check for specific technology preferences mentioned by client

================================================================================
`;

      // Create document
      const children: Paragraph[] = [];

      // Title
      children.push(
        new Paragraph({
          text: `Cursor Project: ${project.title}`,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );

      // Instruction
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Copy the content below and paste into Cursor Editor to start building:",
              italics: true,
            }),
          ],
          spacing: { after: 400 },
        })
      );

      // Separator
      children.push(
        new Paragraph({
          text: "─".repeat(50),
          spacing: { after: 400 },
        })
      );

      // Cursor Prompt Content
      cursorPrompt.split("\n").forEach((line) => {
        if (line.startsWith("# ")) {
          children.push(
            new Paragraph({
              text: line.replace("# ", ""),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 200 },
            })
          );
        } else if (line.startsWith("## ")) {
          children.push(
            new Paragraph({
              text: line.replace("## ", ""),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 150 },
            })
          );
        } else if (line.startsWith("---")) {
          children.push(
            new Paragraph({
              text: "─".repeat(50),
              spacing: { before: 300, after: 300 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line })],
              spacing: { after: 100 },
            })
          );
        }
      });

      // Create and save document
      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, "_")}_cursor.docx`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error("Error exporting project:", error);
      alert("Failed to export project");
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setDeletingId(projectId);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove project from local state
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main
      className={cn(
        "min-h-screen transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}
    >
      <Header title="Dashboard" subtitle="Your saved projects" />

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-electric animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-silver mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-snow mb-2">No projects yet</h3>
              <p className="text-silver mb-4">Generate your first bid to see it here</p>
              <Link href="/projects" className="btn-primary inline-flex items-center gap-2">
                Go to Projects
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-snow mb-4">
                Saved Projects ({projects.length})
              </h2>
              {projects.map((project) => (
                <div key={project.id} className="card flex items-center justify-between group">
                  <Link
                    href={`/qa-generator?id=${project.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="p-2 bg-electric/20 rounded-lg">
                      <FileText className="w-5 h-5 text-electric-bright" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-snow group-hover:text-electric-bright transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-silver">
                        {formatRelativeTime(project.createdAt)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      disabled={deletingId === project.id}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-silver hover:text-coral-bright bg-slate/50 hover:bg-coral/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                    <button
                      onClick={(e) => handleExport(project, e)}
                      disabled={exportingId === project.id}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-silver hover:text-snow bg-slate/50 hover:bg-slate rounded-lg transition-colors disabled:opacity-50"
                    >
                      {exportingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Export
                    </button>
                    <Link href={`/qa-generator?id=${project.id}`}>
                      <ChevronRight className="w-5 h-5 text-silver group-hover:text-electric transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
