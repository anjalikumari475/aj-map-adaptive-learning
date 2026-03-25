# AJ Map — Adaptive Learning Platform

A full-stack adaptive learning platform with course tracking, YouTube video lessons, progress flowcharts, and PDF certificate generation.

## Features

- 🎓 3 Courses: Data Analyst, Web Developer, Cyber Security
- 📊 Visual flowchart progress tracker per course
- ▶️ Embedded YouTube video lessons (5 per course)
- 🏆 PDF certificate download on course completion
- 👤 User accounts stored in PostgreSQL
- 📱 Responsive dark-mode UI

## Project Structure

```
aj-map/
├── client/        # React + Vite frontend (runs on port 5173)
├── server/        # Express + Node.js backend (runs on port 3001)
├── package.json   # Root with npm workspaces + concurrently
└── .env.example   # Environment variable template
```

## Prerequisites

- **Node.js** v18 or higher — https://nodejs.org
- **npm** v8 or higher (comes with Node.js)
- **PostgreSQL** database — https://www.postgresql.org/download/

## Setup & Running

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```
DATABASE_URL=postgresql://user:password@localhost:5432/aj_map
```

> **Free PostgreSQL options:**
> - Local: Install PostgreSQL and create a database (`createdb aj_map`)
> - Cloud: [Neon](https://neon.tech) (free tier) — gives you a DATABASE_URL instantly
> - Cloud: [Supabase](https://supabase.com) (free tier)

### 3. Push database schema

```bash
cd server && npm run db:push && cd ..
```

This creates all the required tables (users, course_progress, certificates).

### 4. Run the app

```bash
npm run dev
```

This starts both the frontend and backend together:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Running Individually

```bash
# Frontend only
npm run dev -w client

# Backend only
npm run dev -w server
```

## Build for Production

```bash
npm run build
```

- Frontend builds to `client/dist/`
- Serve it with any static host (Vercel, Netlify, etc.)
- Deploy the server folder to any Node.js host (Railway, Render, etc.)

---

## Tech Stack

| Layer    | Tech                                        |
|----------|---------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS v4, wouter     |
| Backend  | Express 5, Node.js, TypeScript              |
| Database | PostgreSQL + Drizzle ORM                    |
| UI       | Radix UI, Lucide icons, shadcn/ui style     |
| PDF      | jsPDF                                       |
| Videos   | YouTube embed (iframe)                      |

