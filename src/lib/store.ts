import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FreelancerProject,
  BidProposal,
  AppSettings,
  DashboardStats,
  GeneratedAnswer,
} from "@/types";

interface AppState {
  // Projects
  projects: FreelancerProject[];
  selectedProject: FreelancerProject | null;
  setProjects: (projects: FreelancerProject[]) => void;
  addProject: (project: FreelancerProject) => void;
  setSelectedProject: (project: FreelancerProject | null) => void;
  updateProjectAnswer: (projectId: string, questionId: string, answer: string) => void;

  // Bids
  bids: BidProposal[];
  addBid: (bid: BidProposal) => void;
  updateBid: (id: string, updates: Partial<BidProposal>) => void;

  // Generated Answers
  generatedAnswers: Record<string, GeneratedAnswer[]>;
  setGeneratedAnswers: (projectId: string, answers: GeneratedAnswer[]) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Stats
  stats: DashboardStats;
  updateStats: () => void;
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateAISettings: (settings: Partial<AppSettings["ai"]>) => void;
  updateFreelancerConfig: (config: Partial<AppSettings["freelancer"]>) => void;
  updateProfile: (profile: Partial<AppSettings["profile"]>) => void;
}

const defaultSettings: AppSettings = {
  ai: {
    provider: "openai",
    apiKey: "",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `You are an expert freelancer bid writer creating SHORT, SPECIFIC, WINNING bids.

Rules:
- First sentence ONLY: ONE friendly emoji (👋 or 🤝 or 💬)
- Rest of bid: NO emojis, NO quotation marks
- Use bullet points with dashes (-)
- Keep it under 120 words
- Be specific to their requirements
- End with call to action to discuss`,
  },
  freelancer: {
    clientId: "",
    clientSecret: "",
    sandbox: true,
  },
  profile: {
    name: "",
    skills: [],
    experience: "",
    portfolio: [],
    hourlyRate: 50,
    bio: "",
    expertise: [],
  },
  autoGenerateAnswers: true,
  defaultBidStrategy: "competitive",
};

const defaultStats: DashboardStats = {
  totalProjects: 0,
  activeProjects: 0,
  submittedBids: 0,
  acceptedBids: 0,
  pendingAnswers: 0,
  avgBidAmount: 0,
  successRate: 0,
};

export const useAppStore = create<AppState>()((set, get) => ({
  projects: [],
  selectedProject: null,
  bids: [],
  generatedAnswers: {},
  isLoading: false,
  sidebarOpen: true,
  stats: defaultStats,

  setProjects: (projects) => {
    set({ projects });
    get().updateStats();
  },

  addProject: (project) => {
    set((state) => ({ projects: [project, ...state.projects] }));
    get().updateStats();
  },

  setSelectedProject: (project) => set({ selectedProject: project }),

  updateProjectAnswer: (projectId, questionId, answer) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              questions: p.questions.map((q) =>
                q.id === questionId ? { ...q, answer } : q
              ),
            }
          : p
      ),
    }));
  },

  addBid: (bid) => {
    set((state) => ({ bids: [bid, ...state.bids] }));
    get().updateStats();
  },

  updateBid: (id, updates) => {
    set((state) => ({
      bids: state.bids.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
    get().updateStats();
  },

  setGeneratedAnswers: (projectId, answers) => {
    set((state) => ({
      generatedAnswers: { ...state.generatedAnswers, [projectId]: answers },
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  updateStats: () => {
    const { projects, bids } = get();
    const submittedBids = bids.filter((b) => b.status === "submitted").length;
    const acceptedBids = bids.filter((b) => b.status === "accepted").length;
    const pendingAnswers = projects.reduce(
      (acc, p) => acc + p.questions.filter((q) => !q.answer).length,
      0
    );
    const avgBidAmount =
      bids.length > 0
        ? bids.reduce((acc, b) => acc + b.amount, 0) / bids.length
        : 0;

    set({
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === "open").length,
        submittedBids,
        acceptedBids,
        pendingAnswers,
        avgBidAmount,
        successRate:
          submittedBids > 0 ? (acceptedBids / submittedBids) * 100 : 0,
      },
    });
  },
}));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateAISettings: (aiSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ai: { ...state.settings.ai, ...aiSettings },
          },
        })),

      updateFreelancerConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            freelancer: { ...state.settings.freelancer, ...config },
          },
        })),

      updateProfile: (profile) =>
        set((state) => ({
          settings: {
            ...state.settings,
            profile: { ...state.settings.profile, ...profile },
          },
        })),
    }),
    {
      name: "freelancer-qa-settings",
    }
  )
);

