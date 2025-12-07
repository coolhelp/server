"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components";
import { useAppStore, useSettingsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FileText, Send, Loader2, MessageCircle, User, Sparkles, Copy, Check } from "lucide-react";

interface Project {
  id: string;
  title: string;
  proposal: string;
  generatedBid: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  type: string;  // "proposal", "bid", "client", "me"
  content: string;
  createdAt: string;
}

function QAGeneratorContent() {
  const searchParams = useSearchParams();
  const { sidebarOpen } = useAppStore();
  const { settings, updateAISettings, updateProfile } = useSettingsStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientReply, setClientReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profileRes, aiRes] = await Promise.all([
          fetch("/api/settings/profile"),
          fetch("/api/settings/ai"),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          updateProfile(profileData);
        }

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          updateAISettings(aiData);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, [updateAISettings, updateProfile]);

  // Load project and messages from database
  useEffect(() => {
    const projectId = searchParams.get("id");
    if (projectId) {
      const loadData = async () => {
        try {
          const projectRes = await fetch(`/api/projects/${projectId}`);

          if (projectRes.ok) {
            const data = await projectRes.json();
            setProject(data.project);
            // Filter only conversation messages (client and me)
            const allMessages = data.project.messages || [];
            const conversationMessages = allMessages.filter(
              (m: Message) => m.type === "client" || m.type === "me"
            );
            setMessages(conversationMessages);
          }
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleGenerateReply = async () => {
    if (!clientReply.trim() || !project) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Generate AI reply
      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: project.title,
          proposal: project.proposal,
          generatedBid: project.generatedBid,
          clientReply: clientReply,
          conversationHistory: messages,
          profile: settings.profile,
          aiSettings: settings.ai,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate reply");
      }

      // Save client message to database
      await fetch(`/api/projects/${project.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client",
          content: clientReply,
        }),
      });

      // Save my reply to database
      await fetch(`/api/projects/${project.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "me",
          content: data.reply,
        }),
      });

      // Update local state
      const newClientMessage: Message = {
        id: Date.now().toString(),
        type: "client",
        content: clientReply,
        createdAt: new Date().toISOString(),
      };
      const newMyMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "me",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages([...messages, newClientMessage, newMyMessage]);
      setClientReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main
      className={cn(
        "min-h-screen transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}
    >
      <Header 
        title="Q&A Generator" 
        subtitle={project?.title || ""} 
      />

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-electric animate-spin" />
            </div>
          ) : !project ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-silver mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-snow mb-2">No project selected</h3>
              <p className="text-silver">Select a project from the Dashboard</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project Title */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-cyan/20 rounded-lg">
                    <FileText className="w-5 h-5 text-cyan" />
                  </div>
                  <h2 className="text-lg font-semibold text-snow">Project Title</h2>
                </div>
                <p className="text-cloud">{project.title}</p>
              </div>

              {/* Client's Proposal */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-electric/20 rounded-lg">
                    <FileText className="w-5 h-5 text-electric-bright" />
                  </div>
                  <h2 className="text-lg font-semibold text-snow">Client&apos;s Proposal</h2>
                </div>
                <p className="text-cloud whitespace-pre-wrap">{project.proposal}</p>
              </div>

              {/* Initial Bid */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-mint/20 rounded-lg">
                    <Send className="w-5 h-5 text-mint-bright" />
                  </div>
                  <h2 className="text-lg font-semibold text-snow">My Initial Bid</h2>
                </div>
                <p className="text-cloud whitespace-pre-wrap">{project.generatedBid || "No bid yet"}</p>
              </div>

              {/* Conversation History */}
              {messages.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-amber-bright" />
                    </div>
                    <h2 className="text-lg font-semibold text-snow">Conversation</h2>
                  </div>
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-4 rounded-lg",
                          msg.type === "client" 
                            ? "bg-slate/50 border-l-4 border-coral" 
                            : "bg-electric/10 border-l-4 border-electric"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className={cn(
                              "w-4 h-4",
                              msg.type === "client" ? "text-coral-bright" : "text-electric-bright"
                            )} />
                            <span className={cn(
                              "text-sm font-medium",
                              msg.type === "client" ? "text-coral-bright" : "text-electric-bright"
                            )}>
                              {msg.type === "client" ? "Client" : "Me"}
                            </span>
                          </div>
                          {msg.type === "me" && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-silver hover:text-snow bg-slate/50 hover:bg-slate rounded transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-mint" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-cloud whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Reply Input */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-coral/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-coral-bright" />
                    </div>
                    <h2 className="text-lg font-semibold text-snow">Client&apos;s Reply</h2>
                  </div>
                  <button
                    onClick={handleGenerateReply}
                    disabled={isGenerating || !clientReply.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate My Reply
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={clientReply}
                  onChange={(e) => setClientReply(e.target.value)}
                  placeholder="Paste the client's reply here..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-coral/10 border border-coral/30 rounded-lg text-coral-bright">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function QAGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <QAGeneratorContent />
    </Suspense>
  );
}
