# PrepPro - AI-Powered Interview Preparation Platform

<div align="center">

![PrepPro Logo](https://img.shields.io/badge/PrepPro-AI%20Interview%20Prep-6633FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSIjNjYzM0ZGIi8+PHRleHQgeD0iMTIiIHk9IjE3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPlA8L3RleHQ+PC9zdmc+)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

**The comprehensive platform for mastering technical interviews with AI-powered practice, realistic assessments, and personalized insights.**

[Get Started](#installation--setup) • [Features](#key-features) • [Documentation](#usage) • [Architecture](#system-architecture)

</div>

---

## 📋 Project Overview

**PrepPro** is a full-stack interview preparation platform that combines AI-powered mock interviews, adaptive practice tests, and real-time code execution to help candidates prepare for technical interviews at top companies.

### Problem It Solves
- **Unstructured Preparation**: Many candidates lack a systematic approach to interview prep
- **Limited Feedback**: Traditional practice methods offer no personalized feedback
- **No Real Simulation**: Difficulty recreating realistic interview pressure
- **Fragmented Resources**: Scattered tools for coding, behavioral, and system design practice

### Target Users
- **Students** preparing for campus placements
- **Software Engineers** targeting FAANG and top tech companies
- **Career Switchers** transitioning into tech roles
- **Anyone** seeking structured, AI-enhanced interview practice

### Why PrepPro?
Unlike generic coding platforms, PrepPro provides an **integrated experience** combining:
- Real-time AI interviewer simulation with conversational follow-ups
- Multi-language code execution with test case validation
- Comprehensive scoring across correctness, efficiency, clarity, and communication
- Progress tracking with actionable insights

---

## ✨ Key Features

### 🎙️ AI-Powered Mock Interviews
- Conversational AI interviewer using **Google Gemini**
- Support for **Technical**, **System Design**, **Behavioral**, and **Mixed** interview types
- Dynamic follow-up questions based on candidate responses
- Real-time feedback and multi-dimensional scoring

### 💻 Multi-Language Code Execution
- Execute code in **8 languages**: JavaScript, Python, Java, C++, C#, Go, Rust
- Automatic test case validation with pass/fail reporting
- Runtime and memory usage tracking
- Sandboxed local execution environment

### 📊 Comprehensive Assessments
- **Soft Skills Track**: Quantitative aptitude, verbal reasoning, logical puzzles
- **Technical Track**: Coding fundamentals, cloud concepts, system design
- AI-generated questions with difficulty scaling
- Detailed explanations for every answer

### 📈 Smart Dashboard & Analytics
- Personalized progress tracking
- Performance trends across topics
- Strength and weakness identification
- Study recommendations based on performance data

### 🏆 Gamification
- Global and college-specific leaderboards
- Achievement badges for milestones
- Activity streaks and study hour tracking
- Skill level progression

### 👤 User Profiles
- Professional profile builder
- Performance history and statistics
- Goal setting and progress tracking

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **UI Components** | Radix UI (57+ primitives), shadcn/ui, Framer Motion |
| **Code Editor** | Monaco Editor (VS Code-core) |
| **3D/Graphics** | React Three Fiber, Three.js |
| **Backend** | Express.js 4, TypeScript, Node.js |
| **Database** | MongoDB with native driver |
| **AI** | Google Gemini AI (generative-ai SDK) |
| **Authentication** | JWT, bcrypt |
| **Payments** | Stripe (integration ready) |
| **Validation** | Zod, express-validator |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
├─────────────────────────────────────────────────────────────────┤
│  Pages: Dashboard | Practice | Tests | Interview | Insights     │
│         Leaderboard | Profile | Settings                        │
├─────────────────────────────────────────────────────────────────┤
│  Components: AppShell | CodeEditor | UI Primitives (57+)        │
│  Hooks: useInView | Custom Auth Hooks                           │
│  State: React hooks, localStorage auth                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Routes: /auth | /user | /interview | /practice | /tests        │
│          /dashboard | /insights                                 │
├─────────────────────────────────────────────────────────────────┤
│  Services:                                                      │
│  ├── GeminiAIService (question gen, feedback, conversation)     │
│  ├── CodeExecutionService (8 languages, sandboxed)              │
│  ├── ScoringService (multi-dimensional evaluation)              │
│  ├── AssessmentService (session lifecycle, grading)             │
│  └── PracticeService (topic-based practice)                     │
├─────────────────────────────────────────────────────────────────┤
│  Models: User | Interview | Assessment | Practice               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB (Users, Sessions, Questions, Analytics)                │
│  Google Gemini API (AI generation)                              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React frontend components
2. API calls route through frontend API layer (`/lib/api/`)
3. Express backend authenticates via JWT middleware
4. Services orchestrate business logic (AI, execution, scoring)
5. MongoDB persists sessions, scores, and user data
6. Results return through the stack to update UI

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18+ 
- **MongoDB** (local or Atlas connection string)
- **Google Gemini API Key** ([Get one free](https://ai.google.dev/))

### Frontend Setup

```bash
# Clone and enter directory
cd Prep-Pro

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Environment Variables

**Backend `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/preppro
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:3000
```

---

## 📖 Usage

### Starting a Mock Interview
1. Navigate to **Interview** from the dashboard
2. Configure your preferences (company, role, difficulty, language)
3. Start the interview session
4. Engage with the AI interviewer through text responses
5. For coding questions, use the integrated code editor
6. Submit code to run against test cases
7. Review detailed scores and feedback at completion

### Taking Practice Tests
1. Go to **Tests** section
2. Select a track (Soft Skills or Technical)
3. Choose topic and difficulty level
4. Answer questions (MCQ, multi-select, fill-in-the-blank)
5. Review AI-generated explanations and feedback

### Tracking Progress
- **Dashboard**: Overview of stats, recent activity, recommended tests
- **Insights**: Deep analytics on performance trends
- **Leaderboard**: Compare your ranking with peers

---

## 📁 Project Structure

```
Prep-Pro/
├── src/                          # Frontend source
│   ├── app/                      # Next.js app router pages
│   │   ├── dashboard/            # User dashboard
│   │   ├── interview/            # Mock interview interface
│   │   ├── tests/                # Assessment tests
│   │   ├── practice/             # Practice sessions
│   │   ├── insights/             # Analytics & insights
│   │   ├── leaderboard/          # Rankings
│   │   └── profile/              # User profile
│   ├── components/               # React components
│   │   ├── ui/                   # 57+ Radix-based primitives
│   │   ├── layout/               # AppShell, navigation
│   │   └── CodeEditor.tsx        # Monaco editor wrapper
│   ├── lib/                      # Utilities & API clients
│   │   ├── api/                  # Backend API integrations
│   │   ├── auth.ts               # Auth utilities
│   │   └── utils.ts              # Common helpers
│   └── hooks/                    # Custom React hooks
│
├── backend/                      # Express.js backend
│   └── src/
│       ├── routes/               # API route handlers
│       │   ├── auth.ts           # Authentication
│       │   ├── interview.ts      # Interview sessions (1500+ lines)
│       │   ├── practice.ts       # Practice mode
│       │   └── assessment.ts     # Test assessments
│       ├── services/             # Business logic
│       │   ├── geminiAI.ts       # Gemini integration (880+ lines)
│       │   ├── codeExecution.ts  # Multi-lang executor (700+ lines)
│       │   ├── scoring.ts        # Evaluation engine
│       │   └── assessmentService.ts
│       ├── models/               # TypeScript interfaces
│       └── config/               # Database configuration
│
└── public/                       # Static assets
```

---

## ⚡ Performance & Optimizations

- **Turbopack Support**: Optional `npm run dev:turbopack` for faster builds
- **AI Timeout Handling**: 7-second timeouts with graceful fallbacks
- **Retry Logic**: Automatic retries for AI service failures
- **Local Fallbacks**: Deterministic question generation when AI is unavailable
- **Efficient Queries**: MongoDB indexing on userId and sessionId
- **Client-side Caching**: Auth state in localStorage for fast reloads

---

## 🛡️ Edge Cases & Validation

| Scenario | Handling |
|----------|----------|
| AI service timeout | Fallback to local question bank |
| Invalid auth token | Redirect to login with clear error |
| Empty question set | Generate local deterministic questions |
| Code execution failure | Graceful error with retry option |
| Long passwords | Pre-hashed password validation (bcrypt limit handling) |
| Duplicate sessions | Deduplication by session ID |
| Network failures | Frontend error boundaries with retry |

---

## 🔮 Future Improvements

- [ ] **Video Interview Mode**: WebRTC-based video mock interviews
- [ ] **Collaborative Practice**: Pair programming sessions
- [ ] **Resume Analysis**: AI-powered resume feedback
- [ ] **Company-Specific Tracks**: Tailored prep for specific companies
- [ ] **Mobile App**: React Native companion app
- [ ] **Advanced Analytics**: ML-powered performance predictions
- [ ] **CI/CD Pipeline**: Automated testing and deployment

---

## 👨‍💻 Author

Built with passion for helping candidates succeed in technical interviews.

**PrepPro** combines modern web technologies with AI to create a comprehensive, effective interview preparation experience.

---

<div align="center">

Made with ❤️ for students and developers

</div>
