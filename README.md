# Ad Nova Studio

**AI-Powered Video Advertising Platform**

Ad Nova Studio is a sophisticated web application designed to streamline the creation of video advertisements using advanced AI technologies. It guides users through a structured workflow—from ideation and scripting to storyboard generation and final video production—leveraging the power of Google Gemini and generative video models.

![Status](https://img.shields.io/badge/Status-Development-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js_|_Supabase_|_Tailwind-black)

## 🚀 Features

- **AI Ideation**: Generate ad concepts and scripts based on simple prompts and reference images.
- **Visual Storyboarding**: Create scene-by-scene breakdowns with consistent character and style generation.
- **Video Generation**: Transform static storyboards into dynamic video clips using state-of-the-art video models (e.g., Google Veo, OpenAI Sora).
- **Pro Editor**: Integrated timeline features for trimming, stitching, and refining generated clips.
- **Project Management**: Organize assets, scripts, and video generations in a unified workspace.

## 🛠 Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React 19, Tailwind CSS v4.
- **Backend & Database**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage).
- **AI Integration**:
  - Google Gemini 1.5 Pro (Text/Multimodal)
  - Google Veo / OpenAI Sora (Video Generation)
- **State Management**: Zustand
- **UI Components**: Radix UI, Lucide React

## 📖 Documentation

Detailed documentation for setup and troubleshooting can be found in the `docs/` directory:

- [**Setup Guide**](docs/SETUP.md): Instructions for installing dependencies, setting up environment variables, and running the local development server.
- [**Troubleshooting**](docs/TROUBLESHOOTING.md): Solutions for common issues regarding API keys, database migrations, and storage.
- [**Design Brief**](docs/Studio%202%20-%20UI%20design%20Brief.md): Overview of the UI/UX design philosophy and requirements.

## ⚡️ Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bilalmoten/Ad_nova_studio.git
    cd Ad_nova_studio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy `.env.example` to `.env.local` and populate the required keys (Supabase, Google GenAI).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `app/` - Application routes and pages (Next.js App Router).
- `components/` - Reusable UI components and feature-specific blocks.
- `lib/` - Utility functions, AI clients, and constants.
- `server/` - Server Actions and database queries.
- `supabase/` - Database migrations and types.
- `docs/` - Project documentation and reference materials.

---

© 2026 Ad Nova Studio. All rights reserved.