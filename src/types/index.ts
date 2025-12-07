export interface FreelancerProject {
  id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  type: 'fixed' | 'hourly';
  status: 'open' | 'closed' | 'awarded';
  bidCount: number;
  averageBid?: number;
  deadline?: string;
  questions: ProjectQuestion[];
  postedAt: string;
  clientCountry?: string;
  clientRating?: number;
  clientReviews?: number;
  url?: string;
}

export interface ProjectQuestion {
  id: string;
  question: string;
  answer?: string;
  isRequired: boolean;
}

export interface BidProposal {
  id: string;
  projectId: string;
  amount: number;
  period: number; // in days
  coverLetter: string;
  answers: QuestionAnswer[];
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  createdAt: string;
  submittedAt?: string;
}

export interface QuestionAnswer {
  questionId: string;
  answer: string;
}

export interface GeneratedAnswer {
  questionId: string;
  question: string;
  answer: string;
  confidence: number;
  suggestions?: string[];
}

export interface UserProfile {
  name: string;
  skills: string[];
  experience: string;
  portfolio: string[];
  hourlyRate: number;
  bio: string;
  expertise: string[];
}

export interface AISettings {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface FreelancerAPIConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  sandbox: boolean;
}

export interface AppSettings {
  ai: AISettings;
  freelancer: FreelancerAPIConfig;
  profile: UserProfile;
  autoGenerateAnswers: boolean;
  defaultBidStrategy: 'competitive' | 'premium' | 'budget';
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  submittedBids: number;
  acceptedBids: number;
  pendingAnswers: number;
  avgBidAmount: number;
  successRate: number;
}

