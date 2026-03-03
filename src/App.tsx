import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import SonnyDefs from "@/components/characters/SonnyDefs";
// import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";

const CardioPage = lazy(() => import("./pages/CardioPage"));
const WarmupPage = lazy(() => import("./pages/WarmupPage"));
const ExercisePage = lazy(() => import("./pages/ExercisePage"));
const PostWorkoutPage = lazy(() => import("./pages/PostWorkoutPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NutritionPage = lazy(() => import("./pages/NutritionPage"));
const CoachPage = lazy(() => import("./pages/CoachPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SonnyDefs />
          {/* <PWAUpdatePrompt /> */}
          {/* <Toaster /> */}
          {/* <Sonner /> */}
          <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            }>
            <Routes>
              {/* Redirect old routes */}
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/workout" element={<Navigate to="/exercise/0" replace />} />
              <Route path="/exercise-index" element={<Navigate to="/" replace />} />

              {/* App routes */}
              <Route path="/" element={
                <AuthGuard><Index /></AuthGuard>
              } />
              <Route path="/cardio" element={
                <AuthGuard><CardioPage /></AuthGuard>
              } />
              <Route path="/warmup" element={
                <AuthGuard><WarmupPage /></AuthGuard>
              } />
              <Route path="/exercise/:exerciseIndex" element={
                <AuthGuard><ExercisePage /></AuthGuard>
              } />
              <Route path="/post-workout" element={
                <AuthGuard><PostWorkoutPage /></AuthGuard>
              } />
              <Route path="/nutrition" element={
                <AuthGuard><NutritionPage /></AuthGuard>
              } />
              <Route path="/coach" element={
                <AuthGuard><CoachPage /></AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard><SettingsPage /></AuthGuard>
              } />
              <Route path="/progress" element={
                <AuthGuard><ProgressPage /></AuthGuard>
              } />

              {/* Admin - accessible via secret 5-tap on title */}
              <Route path="/admin" element={
                <AuthGuard requireAdmin={true}><AdminDashboard /></AuthGuard>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
