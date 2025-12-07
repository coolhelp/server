"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Save,
  Key,
  Bot,
  User,
  Settings2,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components";
import { useAppStore, useSettingsStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "ai" | "profile" | "general";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { sidebarOpen } = useAppStore();
  const { settings, updateAISettings, updateProfile, updateSettings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>("ai");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Set active tab from URL query param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "ai" || tab === "profile" || tab === "general") {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const tabs: { id: Tab; label: string; icon: typeof Bot }[] = [
    { id: "ai", label: "AI Settings", icon: Bot },
    { id: "profile", label: "Profile", icon: User },
    { id: "general", label: "General", icon: Settings2 },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save profile to database
      await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings.profile),
      });

      // Save AI settings to database
      await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings.ai),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill && !settings.profile.skills.includes(newSkill)) {
      updateProfile({ skills: [...settings.profile.skills, newSkill] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    updateProfile({ skills: settings.profile.skills.filter((s) => s !== skill) });
  };

  return (
    <main
      className={cn(
        "min-h-screen transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}
    >
      <Header
        title="Settings"
        subtitle="Configure your bidding automation preferences"
      />

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-electric animate-spin mx-auto mb-4" />
                <p className="text-silver">Loading settings...</p>
              </div>
            </div>
          ) : (
          <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-electric text-snow"
                      : "bg-slate/50 text-silver hover:text-snow hover:bg-slate"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* AI Settings */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-fade-in">
              <div className="card">
                <h3 className="text-lg font-semibold text-snow mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-electric-bright" />
                  AI Provider Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-silver mb-2">Provider</label>
                    <select
                      value={settings.ai.provider}
                      onChange={(e) =>
                        updateAISettings({ provider: e.target.value as "openai" | "anthropic" | "custom" })
                      }
                      className="input-field"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-silver" />
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={settings.ai.apiKey}
                        onChange={(e) => updateAISettings({ apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="input-field pl-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-silver hover:text-snow"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">Model</label>
                    <select
                      value={settings.ai.model}
                      onChange={(e) => updateAISettings({ model: e.target.value })}
                      className="input-field"
                    >
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-silver mb-2">
                        Temperature: {settings.ai.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.ai.temperature}
                        onChange={(e) =>
                          updateAISettings({ temperature: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-silver mb-2">
                        Max Tokens: {settings.ai.maxTokens}
                      </label>
                      <input
                        type="range"
                        min="256"
                        max="4096"
                        step="256"
                        value={settings.ai.maxTokens}
                        onChange={(e) =>
                          updateAISettings({ maxTokens: parseInt(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">
                      System Prompt
                    </label>
                    <textarea
                      value={settings.ai.systemPrompt}
                      onChange={(e) => updateAISettings({ systemPrompt: e.target.value })}
                      rows={6}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className="card">
                <h3 className="text-lg font-semibold text-snow mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-mint-bright" />
                  Your Profile
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-silver mb-2">Name</label>
                    <input
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                      placeholder="Enter your name..."
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">
                      Professional Bio
                    </label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={(e) => updateProfile({ bio: e.target.value })}
                      rows={4}
                      placeholder="Describe your professional background and expertise..."
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">Experience</label>
                    <textarea
                      value={settings.profile.experience}
                      onChange={(e) => updateProfile({ experience: e.target.value })}
                      rows={4}
                      placeholder="Describe your relevant work experience..."
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {settings.profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-electric/10 border border-electric/30 rounded-full text-sm text-electric-bright"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="hover:text-coral-bright transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addSkill()}
                        placeholder="Add a skill..."
                        className="input-field"
                      />
                      <button onClick={addSkill} className="btn-secondary">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">
                      Hourly Rate (USD)
                    </label>
                    <input
                      type="number"
                      value={settings.profile.hourlyRate}
                      onChange={(e) =>
                        updateProfile({ hourlyRate: parseInt(e.target.value) || 0 })
                      }
                      className="input-field w-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              <div className="card">
                <h3 className="text-lg font-semibold text-snow mb-4 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-coral-bright" />
                  General Preferences
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate/30 rounded-lg">
                    <div>
                      <p className="font-medium text-snow">Auto-generate Answers</p>
                      <p className="text-sm text-silver">
                        Automatically generate AI answers when viewing a project
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSettings({
                          autoGenerateAnswers: !settings.autoGenerateAnswers,
                        })
                      }
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        settings.autoGenerateAnswers ? "bg-electric" : "bg-steel"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-snow transition-transform",
                          settings.autoGenerateAnswers
                            ? "translate-x-7"
                            : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-silver mb-2">
                      Default Bid Strategy
                    </label>
                    <select
                      value={settings.defaultBidStrategy}
                      onChange={(e) =>
                        updateSettings({
                          defaultBidStrategy: e.target.value as
                            | "competitive"
                            | "premium"
                            | "budget",
                        })
                      }
                      className="input-field"
                    >
                      <option value="budget">Budget (Lower End)</option>
                      <option value="competitive">Competitive (Mid Range)</option>
                      <option value="premium">Premium (Higher End)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 mt-6">
            {saved && (
              <span className="flex items-center gap-2 text-mint-bright animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                Settings saved to database!
              </span>
            )}
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </main>
  );
}
