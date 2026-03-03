# Progress Plate Pro (KBFit)

A modern, Progressive Web App for tracking workouts, nutrition, and fitness progress with beautiful UI and offline support.

**Production URL**: https://kbfit.netlify.app

---

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Quick Start](#quick-start)
* [Environment Setup](#environment-setup)
* [Development](#development)
* [Deployment](#deployment)
* [Documentation](#documentation)
* [Troubleshooting](#troubleshooting)

---

## Overview

Progress Plate Pro is a comprehensive fitness tracking application designed for progressive overload training. It features:

* **Workout Tracking**: Log exercises, sets, reps, and weight with automatic session saving
* **Nutrition Logging**: Track daily meals with photo uploads and AI-powered analysis
* **Progress Monitoring**: Visualize your fitness journey with charts and statistics
* **Offline Support**: PWA functionality allows tracking workouts without internet
* **Auto-Save**: Never lose progress with intelligent auto-save every 30 seconds

---

## Features

### Workout Management
* Multi-phase workout system (Cardio, Warm-up, Exercises, Post-workout)
* Exercise library with video demonstrations
* RPE (Rate of Perceived Exertion) tracking
* Timer management for rest periods
* Session history and progress tracking

### Nutrition Tracking
* Photo-based meal logging
* AI-powered nutrition analysis via Gemini
* Daily meal management
* Calendar view of nutrition history

### Technical Features
* Progressive Web App (installable on mobile/desktop)
* Offline-first architecture with localStorage fallback
* Automatic session persistence
* Race condition prevention for data integrity
* Client-side image compression
* Real-time auto-save with conflict resolution

---

## Tech Stack

### Frontend
* **React 18.3** - UI library
* **TypeScript** - Type safety
* **Vite** - Build tool and dev server
* **Tailwind CSS** - Utility-first styling
* **shadcn/ui** - Component library
* **React Router** - Client-side routing

### Backend & Services
* **Supabase** - Backend-as-a-Service
  * PostgreSQL database with Row Level Security
  * JWT-based authentication
  * Cloud storage for images
* **Netlify** - Hosting and deployment
  * CDN distribution
  * Serverless functions (Gemini AI proxy)
  * Automatic HTTPS

### Development
* **ESLint** - Code linting
* **Prettier** - Code formatting
* **Lovable** - AI-assisted development

---

## Quick Start

### Prerequisites

* **Node.js 18+** and npm - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
* **Supabase account** - [Sign up](https://supabase.com)
* **Netlify account** (for deployment) - [Sign up](https://netlify.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/MikeDominic92/progress-plate-pro.git
cd progress-plate-pro

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# (See Environment Setup section below)

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key-here"
VITE_SUPABASE_PROJECT_ID="your-project-id"

# Authentication
VITE_AUTO_AUTH_PASSWORD="your-secure-password"

# AI Features (Optional)
VITE_GEMINI_API_KEY="your-gemini-api-key"
```

### Getting Supabase Credentials

1. **Create a Supabase Project**
   * Go to [Supabase Dashboard](https://supabase.com/dashboard)
   * Click "New Project"
   * Choose organization, name, and region
   * Wait for project to be provisioned

2. **Get API Credentials**
   * Go to Project Settings → API
   * Copy **Project URL** → `VITE_SUPABASE_URL`
   * Copy **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   * Copy **Project Reference ID** → `VITE_SUPABASE_PROJECT_ID`

3. **Set Authentication Password**
   * Choose a secure password
   * Set as `VITE_AUTO_AUTH_PASSWORD`
   * This will be used for auto-login (username: "Kara")

### Database Setup

Run the database migration to create tables and policies:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-id

# Run migration
npx supabase db push
```

Alternatively, manually run the SQL in [supabase/migration.sql](supabase/migration.sql) in the Supabase SQL Editor.

### Storage Bucket Setup

1. Go to Supabase Dashboard → Storage
2. Create a new bucket: `nutrition-pictures`
3. Make bucket **public**
4. Add RLS policy:
   ```sql
   CREATE POLICY "Users can upload their own pictures"
   ON storage.objects FOR INSERT
   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   ```

---

## Development

### Development Server

```bash
# Start dev server with hot reload
npm run dev
```

Access at: `http://localhost:5173`

### Project Structure

```
progress-plate-pro/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth)
│   ├── hooks/            # Custom hooks
│   ├── integrations/     # Third-party integrations
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── supabase/             # Database migrations
├── netlify/              # Serverless functions
├── public/               # Static assets
└── netlify.toml          # Netlify configuration
```

### Key Files

* **[src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts)** - Workout session state management
* **[src/hooks/useNutritionTracker.ts](src/hooks/useNutritionTracker.ts)** - Nutrition logging state
* **[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)** - Authentication logic
* **[src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)** - Supabase client config

### Code Style

This project follows the conventions in [CLAUDE.md](CLAUDE.md):

* No emojis in code, comments, or commits
* Use asterisks (*) for bullet points, not dashes (-)
* Commit format: `[TYPE]: Brief description`
  * Types: FEAT, FIX, SECURITY, REFACTOR, DOCS, TEST, CHORE
* No Co-Authored-By or Claude footers in commits

---

## Deployment

### Netlify Deployment

#### Option 1: Automatic Deployment (Recommended)

1. **Connect GitHub Repository**
   * Go to [Netlify Dashboard](https://app.netlify.com)
   * Click "New site from Git"
   * Choose GitHub and select `progress-plate-pro` repository
   * Configure build settings:
     * Build command: `npm run build`
     * Publish directory: `dist`

2. **Set Environment Variables**
   * Go to Site Settings → Build & Deploy → Environment
   * Add all variables from `.env` file
   * **Important**: Remove `VITE_` prefix when setting in Netlify UI

3. **Deploy**
   * Netlify will automatically build and deploy
   * Every push to `main` branch triggers new deployment

#### Option 2: Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
npx netlify login

# Build with environment variables
VITE_SUPABASE_URL="https://your-project.supabase.co" \
VITE_SUPABASE_PUBLISHABLE_KEY="your-key" \
VITE_SUPABASE_PROJECT_ID="your-id" \
npm run build

# Deploy to production
npx netlify deploy --prod --dir=dist
```

### Important: Build-Time Environment Variables

**Critical**: Vite environment variables are **build-time only**. They are baked into the JavaScript bundle during `npm run build`.

```bash
# ✅ CORRECT: Env vars passed at build time
VITE_SUPABASE_URL="https://..." npm run build

# ❌ WRONG: Setting env vars after build has no effect
npm run build
export VITE_SUPABASE_URL="https://..."  # Too late!
```

This means:
* Local `.env` file works for `npm run dev`
* For production builds, pass env vars explicitly or configure in Netlify
* Changing env vars requires rebuilding the app

### Verifying Deployment

After deployment, verify:

1. **Check Environment Variables**
   ```bash
   # View Netlify env vars
   npx netlify env:list
   ```

2. **Check Built HTML**
   ```bash
   # Verify Supabase URL is correctly baked in
   cat dist/index.html | grep supabase
   ```

3. **Test Production Site**
   * Visit your Netlify URL
   * Open DevTools → Network
   * Verify requests go to correct Supabase project
   * Test login, workout creation, nutrition logging

---

## Documentation

### Comprehensive Guides

* **[DEBUGGING.md](DEBUGGING.md)** - Complete debugging session log
  * Critical bugs found and fixed
  * Step-by-step solutions
  * Common issues and resolutions

* **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture guide
  * System design and patterns
  * Custom hooks deep-dive
  * Race condition prevention
  * State management approach
  * Performance optimizations

### Quick References

* **Authentication**: Username-based auto-login (default: "Kara")
* **Database**: Supabase PostgreSQL with RLS
* **Storage**: Client-side compression → Supabase Storage
* **Auto-Save**: Every 30 seconds + manual save option
* **Offline**: PWA with service worker + localStorage fallback

---

## Troubleshooting

### Common Issues

#### 1. "Cannot access 'saveSession' before initialization"

**Cause**: Circular dependency in useWorkoutStorage hook (fixed in latest version)

**Solution**: Ensure you're on the latest version with the fix from [DEBUGGING.md](DEBUGGING.md)

```bash
git pull origin main
npm install
```

#### 2. Missing User Data / Empty App

**Cause**: App pointing to wrong Supabase database

**Solution**: Verify correct Supabase project ID in `.env`:

```bash
# Check current config
cat .env | grep VITE_SUPABASE_PROJECT_ID

# Should match your Supabase dashboard project ID
# If not, update .env and rebuild
```

#### 3. Build Errors

**Cause**: Missing or incorrect environment variables

**Solution**:

```bash
# Verify all required env vars are set
cat .env

# Ensure they match your Supabase project:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY
# - VITE_SUPABASE_PROJECT_ID
# - VITE_AUTO_AUTH_PASSWORD
```

#### 4. Images Not Uploading

**Cause**: Supabase storage bucket not configured or RLS policy missing

**Solution**:

1. Check bucket exists: Supabase Dashboard → Storage → `nutrition-pictures`
2. Verify bucket is public
3. Check RLS policy allows authenticated uploads
4. Verify `VITE_SUPABASE_URL` is correct

#### 5. Workout Sessions Not Saving

**Cause**: RLS policy blocking writes or auth session expired

**Solution**:

1. Check browser console for errors
2. Verify logged in: Check localStorage for `sb-*-auth-token`
3. Check Supabase logs: Dashboard → Logs → API Logs
4. Verify RLS policies in [supabase/migration.sql](supabase/migration.sql)

### Debug Mode

Enable debug logging in browser console:

```javascript
// In browser console
localStorage.setItem('debug', 'workout:*,nutrition:*');
location.reload();
```

### Getting Help

1. **Check Documentation**
   * [DEBUGGING.md](DEBUGGING.md) - Known issues and fixes
   * [ARCHITECTURE.md](ARCHITECTURE.md) - System design details

2. **Inspect Logs**
   * Browser DevTools → Console
   * Supabase Dashboard → Logs
   * Netlify Dashboard → Functions → Logs

3. **Verify Configuration**
   ```bash
   # Check environment variables
   cat .env

   # Check Supabase connection
   curl https://your-project.supabase.co/rest/v1/

   # Check build output
   npm run build
   cat dist/index.html
   ```

---

## Current Database Configuration

**Active Supabase Project**: `yidrdfhiouaeybmrjwnd`

**Dashboard**: https://supabase.com/dashboard/project/yidrdfhiouaeybmrjwnd

**Tables**:
* `workout_sessions` - Workout tracking data
* `nutrition_logs` - Daily nutrition entries
* `user_profiles` - User profile information
* `user_pictures` - Uploaded images

**Storage Buckets**:
* `nutrition-pictures` - Meal photos (public)

---

## Contributing

### Development Workflow

1. Create feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and test locally
   ```bash
   npm run dev
   ```

3. Commit with proper format (see [CLAUDE.md](CLAUDE.md))
   ```bash
   git add .
   git commit -m "FEAT: Add new feature description"
   ```

4. Push and create pull request
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

* Follow TypeScript strict mode
* Use React hooks patterns (see [ARCHITECTURE.md](ARCHITECTURE.md))
* Add JSDoc comments for complex functions
* Write meaningful commit messages
* Test changes before pushing

---

## License

[MIT License](LICENSE)

---

## Acknowledgments

* Built with [Lovable](https://lovable.dev)
* UI components from [shadcn/ui](https://ui.shadcn.com)
* Backend powered by [Supabase](https://supabase.com)
* Deployed on [Netlify](https://netlify.com)
* AI features powered by [Google Gemini](https://deepmind.google/technologies/gemini/)

---

## Project Links

* **Production Site**: https://kbfit.netlify.app
* **GitHub Repository**: https://github.com/MikeDominic92/progress-plate-pro
* **Lovable Project**: https://lovable.dev/projects/938b8407-9813-4596-becf-d3347ed541a8
* **Supabase Dashboard**: https://supabase.com/dashboard/project/yidrdfhiouaeybmrjwnd

---

## Support

For issues, questions, or feature requests:

1. Check [DEBUGGING.md](DEBUGGING.md) for known issues
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Open an issue on GitHub with detailed description
4. Include error messages, browser console logs, and steps to reproduce
