"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Copy, Check, FileText, Send, CheckCircle, RefreshCw } from "lucide-react";
import { Header } from "@/components";
import { useAppStore, useSettingsStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const { sidebarOpen } = useAppStore();
  const { settings, updateAISettings, updateProfile } = useSettingsStore();

  const [projectTitle, setProjectTitle] = useState("");
  const [proposal, setProposal] = useState("");
  const [generatedBid, setGeneratedBid] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Load settings from database on mount
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

  // Load project from database if ID is provided in URL
  useEffect(() => {
    const projectId = searchParams.get("id");
    if (projectId) {
      const loadProject = async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.project) {
              setProjectTitle(data.project.title);
              setProposal(data.project.proposal);
              setGeneratedBid(data.project.generatedBid || "");
            }
          }
        } catch (error) {
          console.error("Error loading project:", error);
        }
      };
      loadProject();
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!projectTitle.trim()) {
      setError("Please enter the project title first");
      return;
    }

    if (!proposal.trim()) {
      setError("Please enter the client's proposal first");
      return;
    }

    if (!settings.ai.apiKey) {
      setError("Please configure your AI API key in Settings");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle,
          proposal,
          profile: settings.profile,
          aiSettings: settings.ai,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server error - please try again");
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate bid");
      }

      if (!data.bid) {
        throw new Error("No bid was generated");
      }
      
      setGeneratedBid(data.bid);
      setError(null);

      // Save project to database
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          proposal: proposal,
          generatedBid: data.bid,
        }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      
      // Add helpful hints based on error type
      if (errorMessage.includes("API key")) {
        setError("❌ API key is required\n\n💡 Go to Settings → AI Settings to add your OpenAI API key");
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("invalid")) {
        setError("❌ Invalid API key\n\n💡 Check your API key in Settings → AI Settings");
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
        setError("❌ Rate limit exceeded\n\n💡 Wait a moment and try again, or check your OpenAI billing");
      } else if (errorMessage.includes("500") || errorMessage.includes("server")) {
        setError("❌ Server error\n\n💡 Check your API key or try again later");
      } else {
        setError("❌ " + errorMessage + "\n\n💡 Make sure your API key is set in Settings → AI Settings");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = () => {
    setProjectTitle("");
    setProposal("");
    setGeneratedBid("");
    setError(null);
  };

  const handleCopy = async () => {
    if (!generatedBid) return;
    await navigator.clipboard.writeText(generatedBid);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => {
      setCopied(false);
      setShowToast(false);
    }, 2500);
  };

  return (
    <main
      className={cn(
        "min-h-screen transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}
    >
      <Header title="Projects" subtitle="Generate ideal bids from client proposals" />

      {/* Custom Toast Notification */}
      <div
        className={cn(
          "fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
          showToast 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-mint/20 via-emerald-500/10 to-cyan/20 border border-mint/40 rounded-2xl shadow-2xl shadow-mint/25 backdrop-blur-xl">
          <div className="p-2 bg-mint/30 rounded-full animate-pulse">
            <CheckCircle className="w-5 h-5 text-mint-bright" />
          </div>
          <div>
            <p className="font-semibold text-snow">Copied!</p>
            <p className="text-xs text-silver">Bid copied to clipboard</p>
          </div>
        </div>
      </div>

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Project Title Input */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-cyan/20 rounded-lg">
                <FileText className="w-5 h-5 text-cyan" />
              </div>
              <h2 className="text-lg font-semibold text-snow">Project Title</h2>
            </div>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Enter the project title..."
              className="input-field"
            />
          </div>

          {/* Client's Proposal Input */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-electric/20 rounded-lg">
                  <FileText className="w-5 h-5 text-electric-bright" />
                </div>
                <h2 className="text-lg font-semibold text-snow">Client&apos;s Proposal</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="btn-primary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !proposal.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Paste the client's project description or questions here..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-coral/10 border border-coral/30 rounded-lg text-coral-bright text-center whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Generated Bid Output */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-mint/20 rounded-lg">
                  <Send className="w-5 h-5 text-mint-bright" />
                </div>
                <h2 className="text-lg font-semibold text-snow">Ideal Bid</h2>
              </div>
              <button
                onClick={handleCopy}
                disabled={!generatedBid}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            {generatedBid ? (
              <div className="p-4 bg-slate/30 rounded-lg">
                <p className="text-cloud whitespace-pre-wrap">{generatedBid}</p>
              </div>
            ) : (
              <div className="p-8 bg-slate/30 rounded-lg text-center">
                <p className="text-silver">Your generated bid will appear here...</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
