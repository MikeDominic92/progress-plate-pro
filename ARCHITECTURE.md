# Progress Plate Pro - Architecture Documentation

A comprehensive guide to the technical architecture, design patterns, and system design of Progress Plate Pro.

---

## Table of Contents

* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Authentication System](#authentication-system)
* [Database Schema](#database-schema)
* [Custom Hooks Architecture](#custom-hooks-architecture)
* [State Management](#state-management)
* [Race Condition Prevention](#race-condition-prevention)
* [Auto-Save System](#auto-save-system)
* [Image Handling](#image-handling)
* [Offline Support](#offline-support)
* [Deployment Architecture](#deployment-architecture)

---

## Tech Stack

### Frontend
* **React 18.3** - UI library with hooks-based architecture
* **TypeScript** - Type safety and developer experience
* **Vite** - Build tool and dev server
* **Tailwind CSS** - Utility-first CSS framework
* **shadcn/ui** - Component library built on Radix UI
* **React Router** - Client-side routing

### Backend & Services
* **Supabase** - Backend-as-a-Service
  * PostgreSQL database with Row Level Security (RLS)
  * Authentication (JWT-based)
  * Storage for images
  * Real-time subscriptions (not currently used)
* **Netlify** - Hosting and serverless functions
  * CDN distribution
  * Edge functions for Gemini AI proxy
  * Automatic deployments from GitHub

### Development Tools
* **ESLint** - Code linting
* **Prettier** - Code formatting
* **Lovable** - AI-assisted development platform

---

## Project Structure

```
progress-plate-pro/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...              # Feature components
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state
│   ├── hooks/               # Custom React hooks
│   │   ├── useWorkoutStorage.ts
│   │   ├── useNutritionTracker.ts
│   │   └── useAuthenticatedUser.ts
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client config
│   │       └── types.ts     # Database types
│   ├── lib/                 # Utility functions
│   │   └── utils.ts
│   ├── pages/               # Page components
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── supabase/
│   ├── config.toml          # Supabase CLI config
│   └── migration.sql        # Database schema
├── netlify/
│   └── functions/           # Serverless functions
├── public/                  # Static assets
│   ├── sw.js               # Service worker
│   └── manifest.webmanifest
└── netlify.toml            # Netlify config
```

---

## Authentication System

### Username-Based Authentication

Progress Plate Pro uses a **username-based** authentication system built on top of Supabase's email authentication.

#### How It Works

**[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)**

1. **Auto-Login**: App automatically authenticates as "Kara" on load
2. **Email Conversion**: Usernames are converted to temporary emails: `{username}@temp.local`
3. **Password**: Stored in `VITE_AUTO_AUTH_PASSWORD` environment variable
4. **Auto-Signup**: If user doesn't exist, automatically creates account

```typescript
const DEFAULT_USERNAME = 'Kara';

useEffect(() => {
  if (!loading && !session) {
    const autoSignIn = async () => {
      const email = `${DEFAULT_USERNAME.toLowerCase()}@temp.local`;
      const password = import.meta.env.VITE_AUTO_AUTH_PASSWORD;

      // Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If user doesn't exist, create account
      if (signInError) {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: DEFAULT_USERNAME }
          }
        });
      }
    };
    autoSignIn();
  }
}, [loading, session]);
```

#### Session Management

* **Storage**: `localStorage` via Supabase client config
* **Persistence**: Sessions persist across page reloads
* **Auto-Refresh**: JWT tokens auto-refresh before expiration
* **User Metadata**: Username stored in `user_metadata.username`

**[src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)**
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## Database Schema

### Tables

#### `workout_sessions`
Stores individual workout session data.

```sql
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  session_date DATE NOT NULL,
  current_phase TEXT DEFAULT 'cardio',
  cardio_completed BOOLEAN DEFAULT false,
  cardio_time INTEGER DEFAULT 0,
  cardio_calories INTEGER DEFAULT 0,
  warmup_completed BOOLEAN DEFAULT false,
  warmup_exercises_completed INTEGER DEFAULT 0,
  warmup_mood TEXT,
  warmup_watched_videos TEXT[],
  workout_data JSONB DEFAULT '{"logs": [], "timers": {}}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields**:
* `workout_data.logs` - Array of exercise logs (sets, reps, weight)
* `workout_data.timers` - Timer state for each exercise
* `workout_data.rpe` - Rate of Perceived Exertion (1-10 scale)

#### `nutrition_logs`
Stores daily nutrition tracking data.

```sql
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

**Meals Structure** (JSONB):
```typescript
interface MealEntry {
  id: string;
  title: string;
  foods: string[];
  picture_url?: string;
  timestamp: string;
}
```

#### `user_profiles`
Stores user profile information.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_pictures`
Stores user-uploaded pictures.

```sql
CREATE TABLE user_pictures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  picture_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS policies that restrict access to the authenticated user's own data:

```sql
-- Example RLS policy for workout_sessions
CREATE POLICY "Users can only access their own sessions"
  ON workout_sessions
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Custom Hooks Architecture

### useWorkoutStorage

**Location**: [src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts)

Central hook for managing workout session state with sophisticated race condition prevention.

#### Key Features

1. **Optimistic UI Updates**: Local state updates immediately
2. **Auto-Save**: 30-second interval with debouncing
3. **Manual Save**: Explicit save with conflict resolution
4. **Version Tracking**: Prevents stale writes from completing
5. **Retry Logic**: Exponential backoff for network failures

#### State Management Flow

```
User Action → updateSession() → Local State Update → saveSession() → Supabase
                                      ↓
                                 Immediate UI Feedback
```

#### Race Condition Prevention

Uses a version counter to discard stale async operations:

```typescript
const saveVersion = useRef<number>(0);

const saveSession = useCallback(async (session: WorkoutSession) => {
  const version = ++saveVersion.current; // Increment version for this save

  try {
    await supabaseRetry(() => /* save to database */);
  } catch (error) {
    // Only show error if this is still the latest save attempt
    if (saveVersion.current !== version) return; // Discard stale error
    toast({ title: "Save Error", variant: "destructive" });
  } finally {
    // Only update UI if this is still the latest save attempt
    if (saveVersion.current === version) {
      setSaving(false);
    }
  }
}, [toast]);
```

**How It Works**:
* Each save attempt gets a unique version number
* If a newer save starts, the old save's version is no longer current
* Old saves check `saveVersion.current !== version` before updating UI
* This prevents race conditions where an old slow save overwrites a new fast save's UI state

#### Auto-Save Implementation

```typescript
useEffect(() => {
  if (!currentSession || !currentSession.id) return;

  const interval = setInterval(() => {
    // Use ref to access latest session without adding to deps
    const session = sessionRef.current;
    if (session?.id) {
      saveSession(session);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [currentSession?.id, saveSession]); // Only re-create interval if session ID changes
```

**Key Pattern**: Uses `sessionRef.current` inside interval to access latest state without adding `currentSession` to dependencies (which would recreate interval on every state change).

#### API

```typescript
const {
  currentSession,      // Current workout session state
  saving,              // Boolean: is save in progress?
  initializeSession,   // Create or load session for today
  updateSession,       // Update local state
  manualSave,          // Force immediate save
  resetSession         // Clear current session
} = useWorkoutStorage(username);
```

### useNutritionTracker

**Location**: [src/hooks/useNutritionTracker.ts](src/hooks/useNutritionTracker.ts)

Manages daily nutrition logging with localStorage fallback.

#### Key Features

1. **Hybrid Storage**: localStorage for speed, Supabase for persistence
2. **Optimistic Sync**: Updates localStorage immediately, syncs to cloud asynchronously
3. **Version Tracking**: Same race condition prevention as useWorkoutStorage
4. **Upsert Strategy**: Uses Supabase upsert to handle create/update automatically

#### Storage Flow

```
Add Meal → localStorage Update → UI Update → Cloud Sync
             ↓                      ↓
        Instant Feedback      Background Save
```

#### Cloud Sync with Race Prevention

```typescript
const syncVersion = useRef<number>(0);

const saveMeals = (updated: MealEntry[]) => {
  // 1. Update local storage immediately
  setMeals(updated);
  localStorage.setItem(key, JSON.stringify(updated));

  // 2. Sync to cloud asynchronously
  const version = ++syncVersion.current;

  (async () => {
    if (syncVersion.current !== version) return; // Discard if stale

    await supabaseRetry(() =>
      supabase.from('nutrition_logs').upsert({
        user_id,
        log_date,
        meals: mealsForCloud(updated),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,log_date' }) // Upsert on unique constraint
    , { maxRetries: 2 });
  })();
};
```

#### API

```typescript
const {
  meals,              // Array of meal entries for today
  isLoading,          // Boolean: loading initial data?
  addMeal,            // Add new meal entry
  updateMeal,         // Update existing meal
  deleteMeal,         // Delete meal entry
  uploadPicture       // Upload and attach picture to meal
} = useNutritionTracker(user_id, log_date);
```

### useAuthenticatedUser

**Location**: [src/hooks/useAuthenticatedUser.ts](src/hooks/useAuthenticatedUser.ts)

Extracts authenticated user information from Supabase session.

#### Implementation

```typescript
export function useAuthenticatedUser() {
  const { session } = useAuth();

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.user_metadata?.username || 'Unknown'
  };
}
```

---

## State Management

### Pattern: Co-located State

Progress Plate Pro uses **co-located state** managed by custom hooks rather than global state management (Redux, Zustand).

#### Benefits

1. **Simplicity**: No boilerplate reducers or actions
2. **Type Safety**: TypeScript inference works naturally
3. **Performance**: Only components using the hook re-render
4. **Testability**: Hooks can be tested independently

#### State Layers

```
┌─────────────────────────────────────┐
│ Component State (useState)          │ ← UI-specific state
├─────────────────────────────────────┤
│ Custom Hook State (useWorkoutStorage)│ ← Feature state + sync logic
├─────────────────────────────────────┤
│ Context State (AuthContext)         │ ← Global auth state
├─────────────────────────────────────┤
│ localStorage                        │ ← Offline persistence
├─────────────────────────────────────┤
│ Supabase (PostgreSQL)               │ ← Source of truth
└─────────────────────────────────────┘
```

### Data Flow Example: Logging an Exercise

```
1. User enters weight/reps in ExercisePage
   └─> Component calls updateSession({ workout_data: {...} })

2. useWorkoutStorage.updateSession()
   ├─> Updates currentSession state (optimistic)
   └─> Triggers useEffect for auto-save

3. Auto-save interval calls saveSession()
   ├─> Version = ++saveVersion.current
   ├─> Calls supabaseRetry() with exponential backoff
   └─> Updates Supabase workout_sessions table

4. On success:
   └─> If version is still current, set saving = false

5. On error:
   └─> If version is still current, show toast error
```

---

## Race Condition Prevention

### The Problem

In async state management, race conditions occur when:

1. User makes change A → starts async save A
2. User makes change B → starts async save B
3. Save B completes first
4. Save A completes second and overwrites B's UI state

### The Solution: Version Tracking

Every custom hook uses a version counter pattern:

```typescript
const saveVersion = useRef<number>(0);

const save = useCallback(async (data) => {
  const version = ++saveVersion.current;  // Get unique version for this save

  try {
    await asyncOperation(data);
  } catch (error) {
    if (saveVersion.current !== version) return;  // Discard if stale
    handleError(error);
  } finally {
    if (saveVersion.current === version) {  // Only update UI if still current
      setLoading(false);
    }
  }
}, []);
```

### Why useRef for Versions?

* **Mutation without re-render**: Incrementing `saveVersion.current` doesn't trigger re-renders
* **Latest value in closures**: Async callbacks see the most recent version
* **No dependency issues**: Don't need to add ref to useCallback/useEffect deps

---

## Auto-Save System

### Design Goals

1. **Minimize user friction**: No manual save buttons during workout
2. **Preserve data**: Don't lose progress if user closes tab
3. **Avoid spam**: Don't save on every keystroke
4. **Handle conflicts**: Gracefully handle concurrent updates

### Implementation Strategy

#### 1. Debounced Auto-Save

[src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts)

```typescript
useEffect(() => {
  if (!currentSession || !currentSession.id) return;

  const interval = setInterval(() => {
    const session = sessionRef.current;
    if (session?.id) {
      saveSession(session);
    }
  }, 30000); // Save every 30 seconds

  return () => clearInterval(interval);
}, [currentSession?.id, saveSession]);
```

**Why 30 seconds?**
* Long enough to batch multiple user actions
* Short enough that minimal data is lost on crash
* Balances API calls vs data safety

#### 2. Manual Save Option

For critical moments (finishing workout, leaving page), users can force immediate save:

```typescript
const manualSave = useCallback(async (updates?: Partial<WorkoutSession>) => {
  const sessionToSave = updates
    ? { ...currentSession, ...updates }
    : currentSession;

  if (!sessionToSave) return;

  await saveSession(sessionToSave);
}, [currentSession, saveSession]);
```

#### 3. Ref-Based Access

Uses `sessionRef` to access latest state inside interval without recreating interval:

```typescript
const sessionRef = useRef<WorkoutSession | null>(null);

useEffect(() => {
  sessionRef.current = currentSession;
}, [currentSession]);

// Later in interval:
const session = sessionRef.current; // Always gets latest session
```

**Alternative (wrong)**:
```typescript
// ❌ BAD: Recreates interval on every state change
useEffect(() => {
  const interval = setInterval(() => {
    saveSession(currentSession); // Stale closure
  }, 30000);
  return () => clearInterval(interval);
}, [currentSession, saveSession]); // Interval recreated constantly
```

---

## Image Handling

### Client-Side Compression

**Location**: [src/hooks/useNutritionTracker.ts](src/hooks/useNutritionTracker.ts)

Images are compressed before upload to reduce storage costs and upload time.

```typescript
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const scale = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(),
        'image/jpeg',
        0.8  // 80% quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
};
```

**Compression Settings**:
* Max width: 1024px (maintains aspect ratio)
* Format: JPEG
* Quality: 80%
* Typical reduction: 70-90% file size

### Upload Flow

```
1. User selects image
   └─> File input onChange

2. Compress image
   ├─> Canvas API resize to 1024px
   └─> Convert to JPEG at 80% quality

3. Upload to Supabase Storage
   ├─> Bucket: "nutrition-pictures"
   ├─> Path: {user_id}/{timestamp}-{filename}
   └─> Get public URL

4. Attach to meal entry
   ├─> Update meal object with picture_url
   └─> Save to nutrition_logs.meals JSONB

5. Display in UI
   └─> Load from Supabase CDN
```

### Storage Organization

**Supabase Storage Bucket**: `nutrition-pictures`

**Path Structure**:
```
nutrition-pictures/
  {user_id}/
    {timestamp}-{original_filename}
```

**Example**:
```
nutrition-pictures/
  abc123-def456-ghi789/
    1709654321000-breakfast.jpg
    1709654322000-lunch.jpg
```

---

## Offline Support

### Progressive Web App (PWA)

**Manifest**: [public/manifest.webmanifest](public/manifest.webmanifest)

```json
{
  "name": "KBFit",
  "short_name": "KBFit",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

**Location**: [public/sw.js](public/sw.js)

Provides offline functionality using Workbox:

1. **Cache-First Strategy**: Assets loaded from cache for speed
2. **Network-First for API**: Always try network for fresh data
3. **Offline Fallback**: Show offline page when network unavailable

**Caching Strategy**:
```
Static Assets (JS/CSS) → Cache-First with max-age=31536000
API Requests → Network-First with cache fallback
Images → Cache-First with stale-while-revalidate
```

### localStorage Fallback

When offline, data is saved to localStorage:

```typescript
// Save to localStorage immediately (works offline)
localStorage.setItem(key, JSON.stringify(updated));

// Sync to cloud when online (fails gracefully when offline)
try {
  await supabase.from('nutrition_logs').upsert(data);
} catch (error) {
  // Data safely in localStorage, will sync when back online
  console.error('Offline - will retry later');
}
```

---

## Deployment Architecture

### Build Process (Vite)

**[netlify.toml](netlify.toml)**
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"
```

**Build Steps**:
1. `vite build` compiles TypeScript and bundles with Rollup
2. Environment variables baked into bundle at build time
3. Assets hashed for cache busting: `index-Dcr4MU9y.js`
4. Service worker generated with Workbox
5. Output to `dist/` directory

### Environment Variables (Critical)

**Vite Requirement**: Env vars are **build-time**, not runtime.

```bash
# ✅ CORRECT: Pass env vars at build time
VITE_SUPABASE_URL="https://..." npm run build

# ❌ WRONG: Setting runtime env vars has no effect
export VITE_SUPABASE_URL="https://..."
npm run build  # Won't see the variable
```

**Where They're Used**:
* [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) - `import.meta.env.VITE_SUPABASE_URL`
* [index.html](index.html) - DNS preconnect URL must match

### Netlify Configuration

**Hosting**:
* CDN: Global edge network
* HTTPS: Automatic Let's Encrypt certificates
* Redirects: SPA fallback to `index.html`

**Functions** (Serverless):
* **gemini-proxy**: Proxies Gemini AI API to hide keys
* **gemini-proxy-stream**: Streaming version for real-time responses
* Timeout: 26 seconds (just under Netlify's 30s limit)

**Cache Headers**:
```toml
# HTML and service worker: Never cache
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

# Hashed assets: Cache forever (immutable)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Deployment Flow

```
1. Push to GitHub
   └─> Triggers Netlify webhook

2. Netlify Build
   ├─> Clone repo
   ├─> npm install
   ├─> Inject env vars (build-time)
   ├─> npm run build
   └─> Generate dist/

3. Deploy to CDN
   ├─> Upload 26 files to edge network
   ├─> Upload 2 serverless functions
   └─> Invalidate old CDN cache

4. Live
   └─> https://kbfit.netlify.app
```

**Manual Deployment**:
```bash
# Build with env vars
VITE_SUPABASE_URL="https://..." \
VITE_SUPABASE_PUBLISHABLE_KEY="..." \
VITE_SUPABASE_PROJECT_ID="..." \
npm run build

# Deploy to production
npx netlify deploy --prod --dir=dist
```

---

## Key Patterns Summary

### 1. Version-Guarded Async Ops
Every async operation gets a version number to prevent race conditions.

### 2. Ref for Non-Reactive Data
Use `useRef` for data that should update without re-renders (versions, intervals).

### 3. Optimistic UI Updates
Update local state immediately, sync to server asynchronously.

### 4. Retry with Exponential Backoff
[src/lib/supabaseRetry.ts](src/lib/supabaseRetry.ts) - Automatically retry failed operations.

### 5. Hybrid Storage
localStorage for speed and offline support, Supabase for persistence and sync.

### 6. Upsert Strategy
Use database upserts to avoid separate create/update logic.

### 7. JSONB for Flexibility
Store complex workout data as JSONB for schema flexibility.

---

## Performance Optimizations

### 1. DNS Preconnect
[index.html](index.html):
```html
<link rel="preconnect" href="https://yidrdfhiouaeybmrjwnd.supabase.co">
```
Establishes connection to Supabase before first request.

### 2. Font Preloading
```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
```

### 3. Image Compression
All images compressed to max 1024px and JPEG 80% before upload.

### 4. Cache-First Assets
Hashed JS/CSS files cached forever with immutable flag.

### 5. Code Splitting
Vite automatically splits code by route for faster initial load.

---

## Security Considerations

### Row Level Security (RLS)

All database tables have RLS policies:
```sql
CREATE POLICY "Users can only access their own sessions"
  ON workout_sessions
  FOR ALL
  USING (auth.uid() = user_id);
```

Prevents users from accessing each other's data even with direct SQL.

### API Keys

* **Client-Side**: Supabase anon key (safe for public)
* **Server-Side**: Gemini AI key hidden in Netlify functions
* **Never in Git**: `.env` in `.gitignore`, use environment variables

### Content Security

**[netlify.toml](netlify.toml)** headers:
```toml
X-Content-Type-Options = "nosniff"
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
```

---

## Future Architecture Improvements

### Potential Enhancements

1. **Real-Time Sync**: Use Supabase real-time subscriptions for multi-device sync
2. **Offline Queue**: Queue failed operations and retry when back online
3. **Optimistic Rollback**: Roll back local changes if server save fails
4. **Incremental Migration**: Add schema versioning to handle database migrations
5. **Server-Side Rendering**: Migrate to Next.js for better SEO and initial load
6. **GraphQL Layer**: Add GraphQL for more flexible data fetching
7. **Multi-User Support**: Extend beyond auto-login for multiple users

---

## Common Gotchas

### 1. Environment Variables

Remember: Vite env vars are **build-time only**. Setting them after build has no effect.

### 2. useEffect Dependencies

Missing dependencies cause stale closures. Always include all used variables.

### 3. Supabase RLS Policies

If queries mysteriously return empty, check RLS policies match your auth state.

### 4. localStorage Limits

localStorage has ~5-10MB limit. Don't store large images directly.

### 5. JSONB Query Performance

Index JSONB columns for queries: `CREATE INDEX ON workout_sessions USING GIN (workout_data);`

---

## References

* **React Hooks**: https://react.dev/reference/react
* **Supabase Docs**: https://supabase.com/docs
* **Vite Docs**: https://vitejs.dev
* **Netlify Docs**: https://docs.netlify.com
* **Workbox (PWA)**: https://developers.google.com/web/tools/workbox
