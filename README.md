# BidFlow - Freelancer Q&A Automation System

A modern Next.js application that automates the bidding process on freelancer.com by using AI to generate compelling answers to project screening questions.

![BidFlow Dashboard](https://via.placeholder.com/800x400?text=BidFlow+Dashboard)

## Features

- 🤖 **AI-Powered Q&A Generation** - Automatically generate professional, persuasive answers to project screening questions
- 📊 **Project Dashboard** - Browse and manage freelancer projects with a beautiful, intuitive interface
- ⚙️ **Customizable AI Settings** - Configure AI provider, model, temperature, and custom prompts
- 👤 **Profile Management** - Set up your skills, experience, and portfolio for personalized responses
- 🔗 **Freelancer.com API Integration** - Fetch projects and submit bids directly
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **AI Integration**: OpenAI API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI features)
- Freelancer.com API credentials (optional, for direct integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd freelancer
```

2. Install dependencies:
```bash
npm install
```

3. Create your environment file:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
OPENAI_API_KEY=sk-your-openai-api-key
FREELANCER_CLIENT_ID=your-client-id
FREELANCER_CLIENT_SECRET=your-client-secret
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Dashboard

The dashboard provides an overview of your bidding activity:
- View active projects and submitted bids
- Track pending Q&A responses
- Monitor your success rate

### Projects

Browse and search through freelancer projects:
- Filter by status, project type, and skills
- View project details including budget, requirements, and client info
- Save projects for later review

### Q&A Generator

Generate AI-powered answers for project questions:
1. Select a project from your saved list or paste a project URL
2. Click "Generate All Answers" to create responses for all questions
3. Review and edit the generated answers
4. Accept answers or regenerate for alternatives
5. Copy answers to clipboard or submit directly

### Settings

Configure the application:

**AI Settings**
- Choose AI provider (OpenAI, Anthropic)
- Set model, temperature, and max tokens
- Customize the system prompt

**Freelancer API**
- Enter your API credentials
- Toggle sandbox mode for testing

**Profile**
- Add your skills and expertise
- Set your hourly rate
- Write your professional bio

## API Routes

### `POST /api/generate-answers`

Generate AI-powered answers for project questions.

**Request Body:**
```json
{
  "project": { ... },
  "profile": { ... },
  "aiSettings": { ... },
  "singleQuestion": { ... } // optional
}
```

### `GET /api/freelancer/projects`

Fetch active projects from Freelancer.com.

**Query Parameters:**
- `skills` - Comma-separated list of skills
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset

### `POST /api/freelancer/bid`

Submit a bid to a Freelancer project.

**Request Body:**
```json
{
  "bid": { ... },
  "accessToken": "...",
  "sandbox": true
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate-answers/    # AI answer generation
│   │   └── freelancer/          # Freelancer.com API routes
│   ├── projects/                # Projects page
│   ├── qa-generator/            # Q&A Generator page
│   ├── settings/                # Settings page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Dashboard
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── StatCard.tsx
│   ├── ProjectCard.tsx
│   └── QACard.tsx
├── lib/
│   ├── store.ts                 # Zustand store
│   └── utils.ts                 # Utility functions
└── types/
    └── index.ts                 # TypeScript types
```

## Configuration

### AI Configuration

The AI system can be configured through the Settings page:

| Setting | Description | Default |
|---------|-------------|---------|
| Provider | AI service provider | OpenAI |
| Model | Language model | gpt-4o |
| Temperature | Response creativity (0-1) | 0.7 |
| Max Tokens | Maximum response length | 1000 |
| System Prompt | Instructions for AI behavior | (see default) |

### Bid Strategies

Choose from three bidding strategies:

- **Budget**: Lower-end of the project budget range
- **Competitive**: Mid-range, balanced approach
- **Premium**: Higher-end for quality-focused clients

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Disclaimer

This tool is designed to assist with crafting bid responses. Always review and personalize AI-generated content before submission. Ensure compliance with Freelancer.com's terms of service when using API integrations.
