# LearnPath AI — Intelligent Personalized Developer Learning Platform

LearnPath AI is a full-stack, AI-driven developer career acceleration and learning platform. It generates dynamic curriculum roadmaps, tracks verified skill competencies, provides an interactive AI Mentor and AI Pair Programmer, and features a recruiter-ready portfolio system.

---

## ✨ Key Features

* 🎯 **Dynamic AI Learning Path Generator**: Generates customized multi-phase roadmaps (e.g. Frontend, Backend, Full Stack) tailored to skill baseline and pace.
* 🧠 **LearnPath AI Mentor & Pair Programmer**: High-speed conversational AI coach powered by Groq / OpenAI-compatible LLMs with full context of completed roadmap phases and mastered competencies.
* 🔥 **Action-Gated Learning Streak**: Streak counters increment exclusively through verified learning activities (lesson completion, quiz submission, code challenge, or mentor consultation).
* 📊 **Unified Cross-Page Synchronization**: Single source of truth across Dashboard, Curriculum Roadmap, Catalog, and AI Mentor.
* 💼 **Recruiter Portfolio**: Auto-generated exportable portfolio highlighting verified project hours, mastered skills, and milestone completions.
* 🛡️ **Enterprise Admin Dashboard**: Secure administrative portal (`/back`) for user analytics, audit logs, and curriculum metrics.
* 🌓 **PostgreSQL-Persisted Dark/Light Mode**: User UI preferences automatically synchronized with the database.

---

## 🏛️ Project Architecture

```text
learnpath-ai/
├── src/
│   ├── components/           # Reusable UI components (Sidebar, TopNav, Cards, Modals, Badges)
│   ├── pages/                # Screens (Dashboard, LearningPath, SkillAnalysis, AIMentor, PairProgrammer, RecruiterProfile, Progress, Explore)
│   ├── layouts/              # AppLayout and ProtectedRoute
│   ├── contexts/             # AuthContext, ThemeContext, ToastContext
│   ├── services/             # Axios API services
│   ├── types/                # TypeScript models and interfaces
│   │
│   ├── server/
│   │   ├── controllers/      # Auth, Dashboard, Path, Skills, Assessment, AI Mentor, Pair Programmer, Admin
│   │   ├── routes/           # Express `/api/*` endpoints
│   │   ├── middleware/       # JWT Auth, Rate Limiter & Error handler
│   │   ├── services/         # Prisma client, Streak engine, AI engines (Mentor, PathGenerator, Recommender)
│   │   └── index.ts          # Express API server entry point (serves Vite SPA in production)
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── prisma/
│   ├── schema.prisma         # Full PostgreSQL database schema
│   └── seed.ts               # Database seed script
│
├── render.yaml               # One-click Render Blueprint specification
├── Dockerfile                # Production multi-stage Dockerfile
├── docker-compose.yml        # Local PostgreSQL 16 container configuration
├── package.json              # Root package configuration & build scripts
└── vite.config.ts            # Vite bundler configuration
```

---

## ⚡ Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
* **Backend**: Express.js, Node.js 20+, TypeScript (via `tsx`)
* **Database & ORM**: PostgreSQL, Prisma ORM
* **Authentication**: JWT, bcryptjs password hashing, role-based access control
* **AI Engine**: Groq API (`openai/gpt-oss-120b`, `qwen/qwen3.6-27b`, `llama-3.3-70b-versatile`) with Google Gemini fallback

---

## 🚀 Live Cloud Deployment (Render Blueprint)

LearnPath AI is pre-configured for automated **one-click deployment on Render.com** via [`render.yaml`](file:///c:/Users/aswin/OneDrive/Desktop/HCL-Hackathon-main/render.yaml).

### Step-by-Step Deployment:
1. Push your repository to **GitHub**.
2. Go to [**dashboard.render.com**](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Select your repository.
4. Render will automatically read `render.yaml` and provision:
   * 🐘 **Managed PostgreSQL Database**: `learnpath-ai-db`
   * 🚀 **Full-Stack Web Service**: `learnpath-ai-app` (Build: `npm run render-build`, Start: `npm start`)
5. In the Render Environment Variables tab, provide your **`LLM_API_KEY`** (Groq / OpenAI-compatible key).
6. Click **Apply / Deploy**.

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd learnpath-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learnpath_ai?schema=public

# Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d

# LLM Configuration (Groq / FreeLLMAPI)
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=your_groq_api_key
LLM_MODEL=openai/gpt-oss-120b
```

### 3. Start Local Database & Run Migrations
```bash
# Launch PostgreSQL via Docker Compose
docker compose up -d

# Push Prisma schema to PostgreSQL & generate client
npx prisma db push
npx prisma generate

# Seed sample curriculum and demo data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api`

---

## 🔑 Demo Credentials

* **Student Account**:
  * **Email**: `devashish@learnpath.ai`
  * **Password**: `password123`
* **Admin Account**:
  * **Email**: `admin@learnpath.ai`
  * **Password**: `admin123`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user & generate AI learning path |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & active streak |
| `GET` | `/api/dashboard` | Synchronized dashboard metrics, active milestone & focus tasks |
| `GET` | `/api/learning-path` | Complete multi-phase curriculum roadmap |
| `POST` | `/api/learning-path/generate` | Generate new personalized AI roadmap for target role |
| `GET` | `/api/skills` | Competency matrix, mastered skills & skill gaps |
| `GET` | `/api/courses` | Curriculum catalog with live completion status |
| `GET` | `/api/assessments/history` | Combined diagnostic assessments & phase milestone exams |
| `POST` | `/api/assessments/submit` | Submit assessment, calculate baseline & update skill radar |
| `POST` | `/api/ai/chat` | Chat with AI Mentor with live roadmap context |
| `GET` | `/api/ai/context` | Live AI Mentor learning context & milestone status |
| `POST` | `/api/pair-programmer/chat` | Interactive AI Pair Programmer code assistant |

---

## 📜 License

MIT License. Built for the HCL Hackathon 2026.
