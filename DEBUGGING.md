# Debugging Session Log

This document chronicles a critical debugging session that resolved multiple production issues with Progress Plate Pro.

## Session Overview

**Date**: March 2026
**Trigger**: "Cannot access 'saveSession' before initialization" error on production site
**Outcome**: Fixed 4 critical bugs and recovered missing user data

---

## Critical Bug #1: saveSession Initialization Error

### Symptoms
```
Error: Cannot access 'saveSession' before initialization
```
App failed to load completely on production site.

### Root Cause
Circular dependency in [src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts):

1. `initializeSession()` was defined at line 40
2. `initializeSession()` called `saveSession()` at lines 78 and 131
3. `saveSession()` was defined AFTER `initializeSession()` at line 135
4. `saveSession` was missing from `initializeSession`'s dependency array
5. This created a stale closure where `initializeSession` captured undefined `saveSession`

### The Fix

**Step 1**: Moved `saveSession` definition before `initializeSession`
```typescript
// Save session to database - NOW DEFINED FIRST
const saveSession = useCallback(async (session: WorkoutSession) => {
  if (!session) return;

  const version = ++saveVersion.current;
  setSaving(true);

  try {
    const sessionData = {
      username: session.username,
      session_date: session.session_date,
      current_phase: session.current_phase,
      cardio_completed: session.cardio_completed,
      cardio_time: session.cardio_time,
      cardio_calories: session.cardio_calories,
      warmup_completed: session.warmup_completed,
      warmup_exercises_completed: session.warmup_exercises_completed,
      warmup_mood: session.warmup_mood,
      warmup_watched_videos: session.warmup_watched_videos,
      workout_data: session.workout_data
    };

    if (session.id) {
      // Update existing session
      const { error } = await supabaseRetry(
        () => supabase
          .from('workout_sessions')
          .update(sessionData)
          .eq('id', session.id!),
        { maxRetries: 2 },
      );
      if (error) throw error;
    } else {
      // Insert new session
      const { data, error } = await supabaseRetry(
        () => supabase
          .from('workout_sessions')
          .insert(sessionData)
          .select()
          .single(),
        { maxRetries: 2 },
      );
      if (error) throw error;
      if (data && saveVersion.current === version) {
        setCurrentSession(prev => prev ? { ...prev, id: data.id } : null);
      }
    }
  } catch (error) {
    if (saveVersion.current !== version) return;
    console.error('Error saving session:', error);
    toast({
      title: "Save Error",
      description: "Failed to save workout progress. Please try again.",
      variant: "destructive",
    });
  } finally {
    if (saveVersion.current === version) {
      setSaving(false);
    }
  }
}, [toast]);
```

**Step 2**: Wrapped `saveSession` in `useCallback` with proper dependencies
```typescript
const saveSession = useCallback(async (session: WorkoutSession) => {
  // ... implementation
}, [toast]); // Added toast dependency
```

**Step 3**: Added `saveSession` to dependency arrays
```typescript
const initializeSession = useCallback(async (existingSession?: WorkoutSession) => {
  // ... implementation
  await saveSession(newSession);
}, [username, saveSession]); // Added saveSession to deps

const manualSave = useCallback(async (updates?: Partial<WorkoutSession>) => {
  // ... implementation
  await saveSession(sessionToSave);
}, [currentSession, saveSession]); // Added saveSession to deps
```

### Files Changed
* [src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts)

---

## Critical Bug #2: workout_data.logs Structure Mismatch

### Symptoms
First workout session would fail to hydrate exercise list correctly.

### Root Cause
Type mismatch in [src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts):

* Interface defined `logs: Record<string, any>` (object)
* Code initialized as `{ logs: {}, timers: {} }` (empty object)
* [src/pages/ExercisePage.tsx](src/pages/ExercisePage.tsx) expected `logs` to be an array: `Array.isArray(logs)`

### The Fix

**Step 1**: Changed interface definition
```typescript
interface WorkoutData {
  [key: string]: any;
  logs: any[];  // Changed from Record<string, any> to any[]
  timers: Record<string, any>;
}
```

**Step 2**: Updated all initializations (3 occurrences)
```typescript
// BEFORE:
workout_data: { logs: {}, timers: {} }

// AFTER:
workout_data: { logs: [], timers: {} }
```

### Files Changed
* [src/hooks/useWorkoutStorage.ts](src/hooks/useWorkoutStorage.ts) - Interface and 3 initialization points

---

## Critical Bug #3: RPE Save Bypassing State Management

### Symptoms
RPE (Rate of Perceived Exertion) saves were not going through the central state management system, causing potential race conditions and inconsistent state.

### Root Cause
[src/pages/PostWorkoutPage.tsx](src/pages/PostWorkoutPage.tsx) was calling Supabase directly instead of using the `useWorkoutStorage` hook's state management:

```typescript
// BUGGY CODE:
const handleSaveRpe = async () => {
  if (!currentSession || sessionRpe === null) return;
  try {
    const updatedData = { ...(currentSession.workout_data || {}), rpe: sessionRpe };
    await supabase  // ❌ Direct Supabase call bypasses state management
      .from('workout_sessions')
      .update({ workout_data: updatedData, updated_at: new Date().toISOString() })
      .eq('id', currentSession.id);
    setRpeSubmitted(true);
    toast({ title: 'RPE saved', description: `Session rated ${sessionRpe}/10` });
  } catch {
    toast({ title: 'Failed to save RPE', variant: 'destructive' });
  }
};
```

### The Fix

**Step 1**: Added `updateSession` and `manualSave` to hook destructuring
```typescript
const {
  currentSession,
  initializeSession,
  resetSession,
  updateSession,    // Added
  manualSave        // Added
} = useWorkoutStorage(username || '');
```

**Step 2**: Updated `handleSaveRpe` to use state management
```typescript
const handleSaveRpe = async () => {
  if (!currentSession || sessionRpe === null) return;
  try {
    const updatedData = { ...(currentSession.workout_data || {}), rpe: sessionRpe };
    const updates = { workout_data: updatedData };
    updateSession(updates);      // ✅ Update local state
    await manualSave(updates);   // ✅ Save through state management
    setRpeSubmitted(true);
    toast({ title: 'RPE saved', description: `Session rated ${sessionRpe}/10` });
  } catch {
    toast({ title: 'Failed to save RPE', variant: 'destructive' });
  }
};
```

**Step 3**: Removed unused `supabase` import

### Files Changed
* [src/pages/PostWorkoutPage.tsx](src/pages/PostWorkoutPage.tsx)

---

## Critical Bug #4: Missing User Data (Two-Database Issue)

### Symptoms
Production site showed as completely empty - no workout history, no nutrition logs, appearing as a brand new installation.

### Investigation Process

**Step 1**: Checked git history for Supabase URL changes
```bash
git log --all --source --full-history -- .env index.html
```
Found evidence of two different Supabase project IDs in the codebase.

**Step 2**: Discovered the smoking gun
In [supabase/migration.sql](supabase/migration.sql) line 260:
```sql
-- OR go to: https://supabase.com/dashboard/project/yidrdfhiouaeybmrjwnd/auth/providers
```

This revealed a reference to an OLD Supabase database.

**Step 3**: Confirmed two databases existed
* **NEW database** (empty): `uklpunpsoirylrgegble` - configured in `.env`
* **OLD database** (with user data): `yidrdfhiouaeybmrjwnd` - referenced in migration.sql

**Step 4**: Retrieved old database credentials
User provided the correct anon key from the old Supabase project:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do
```

### The Fix

**Files Updated**:

**[.env](.env)**
```bash
# BEFORE (empty database):
VITE_SUPABASE_PROJECT_ID="uklpunpsoirylrgegble"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHB1bnBzb2lyeWxyZ2VnYmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODA5NTQsImV4cCI6MjA2ODg1Njk1NH0.dHsBC1v-p0y3M9aHswgxLCnBZQOrfewT8n_b9oRa880"
VITE_SUPABASE_URL="https://uklpunpsoirylrgegble.supabase.co"

# AFTER (database with all user data):
VITE_SUPABASE_PROJECT_ID="yidrdfhiouaeybmrjwnd"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do"
VITE_SUPABASE_URL="https://yidrdfhiouaeybmrjwnd.supabase.co"
```

**[index.html](index.html)** - Updated DNS preconnect
```html
<!-- BEFORE: -->
<link rel="preconnect" href="https://uklpunpsoirylrgegble.supabase.co">

<!-- AFTER: -->
<link rel="preconnect" href="https://yidrdfhiouaeybmrjwnd.supabase.co">
```

**[supabase/config.toml](supabase/config.toml)** - Updated project ID
```toml
# BEFORE:
project_id = "uklpunpsoirylrgegble"

# AFTER:
project_id = "yidrdfhiouaeybmrjwnd"
```

**Netlify Environment Variables**:
```bash
npx netlify env:set VITE_SUPABASE_URL "https://yidrdfhiouaeybmrjwnd.supabase.co"
npx netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do"
npx netlify env:set VITE_SUPABASE_PROJECT_ID "yidrdfhiouaeybmrjwnd"
```

**Deployment**:
```bash
# Build with correct env vars
VITE_SUPABASE_URL="https://yidrdfhiouaeybmrjwnd.supabase.co" \
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do" \
VITE_SUPABASE_PROJECT_ID="yidrdfhiouaeybmrjwnd" \
npm run build

# Deploy to production
npx netlify deploy --prod --dir=dist
```

### Outcome
All user data successfully recovered and accessible on production site.

---

## Other Issues Encountered

### Issue: check-data.js Security Risk
**File**: `check-data.js` (deleted)
**Problem**: Contained hardcoded Supabase credentials in plaintext
**Resolution**: File deleted entirely to prevent accidental commit of secrets

### Issue: Git "nul" File Error
**Error**: `error: short read while indexing nul`
**Cause**: Windows-specific issue with reserved filename
**Resolution**: Used selective git add instead of `git add -A`

---

## Verification Steps

After all fixes were applied:

1. ✅ Site loads without initialization errors
2. ✅ All historical workout data visible
3. ✅ Nutrition logs preserved
4. ✅ New workout sessions save correctly
5. ✅ RPE saves go through state management
6. ✅ Production deployment successful

---

## Lessons Learned

1. **useCallback Dependencies Matter**: Missing dependencies in React hooks can cause subtle initialization bugs
2. **Type Consistency**: Interface definitions must match actual usage patterns
3. **State Management Discipline**: All data mutations should flow through central state management
4. **Environment Variable Tracking**: Document which Supabase project is active to avoid data loss
5. **Vite Build-Time Vars**: Remember that Vite env vars are baked in at build time, not runtime

---

## Quick Reference: Current Supabase Configuration

**Active Database**: `yidrdfhiouaeybmrjwnd`
**URL**: `https://yidrdfhiouaeybmrjwnd.supabase.co`
**Dashboard**: https://supabase.com/dashboard/project/yidrdfhiouaeybmrjwnd

**Configuration Files**:
* [.env](.env) - Local development
* [index.html](index.html) - DNS preconnect
* [supabase/config.toml](supabase/config.toml) - Supabase CLI
* Netlify environment variables (set via CLI)
