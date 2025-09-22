import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CardioPage from "./pages/CardioPage";
import WarmupPage from "./pages/WarmupPage";
import WorkoutPage from "./pages/WorkoutPage";
import WorkoutOverviewPage from "./pages/WorkoutOverviewPage";
import ExercisePage from "./pages/ExercisePage";
import PostWorkoutPage from "./pages/PostWorkoutPage";
import { ExerciseIndexPage } from "./pages/ExerciseIndexPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={
                <AuthGuard requireAuth={false}>
                  <AuthPage />
                </AuthGuard>
              } />
              
              {/* Protected routes - require authentication */}
              <Route path="/" element={
                <AuthGuard requireAuth={true}>
                  <Index />
                </AuthGuard>
              } />
              <Route path="/cardio" element={
                <AuthGuard requireAuth={true}>
                  <CardioPage />
                </AuthGuard>
              } />
              <Route path="/warmup" element={
                <AuthGuard requireAuth={true}>
                  <WarmupPage />
                </AuthGuard>
              } />
              <Route path="/workout" element={
                <AuthGuard requireAuth={true}>
                  <WorkoutOverviewPage />
                </AuthGuard>
              } />
              <Route path="/exercise/:exerciseIndex" element={
                <AuthGuard requireAuth={true}>
                  <ExercisePage />
                </AuthGuard>
              } />
              <Route path="/exercise-index" element={
                <AuthGuard requireAuth={true}>
                  <ExerciseIndexPage />
                </AuthGuard>
              } />
              <Route path="/post-workout" element={
                <AuthGuard requireAuth={true}>
                  <PostWorkoutPage />
                </AuthGuard>
              } />
              
              {/* Admin only routes */}
              <Route path="/admin" element={
                <AuthGuard requireAuth={true} requireAdmin={true}>
                  <AdminDashboard />
                </AuthGuard>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
