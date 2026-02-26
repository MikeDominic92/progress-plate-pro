import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import CardioPage from "./pages/CardioPage";
import WarmupPage from "./pages/WarmupPage";
import ExercisePage from "./pages/ExercisePage";
import PostWorkoutPage from "./pages/PostWorkoutPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import SonnyDefs from "@/components/characters/SonnyDefs";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SonnyDefs />
          <Toaster />
          <Sonner />
          <BrowserRouter>
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

              {/* Admin only */}
              <Route path="/admin" element={
                <AuthGuard requireAdmin={true}><AdminDashboard /></AuthGuard>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
