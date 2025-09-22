import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
  const storedUsername = (typeof window !== 'undefined' && localStorage.getItem('username')) || 'user';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cardio" element={<CardioPage username={storedUsername} />} />
            <Route path="/warmup" element={<WarmupPage username={storedUsername} />} />
            <Route path="/workout" element={<WorkoutOverviewPage username={storedUsername} />} />
            <Route path="/exercise/:exerciseIndex" element={<ExercisePage username={storedUsername} />} />
            <Route path="/exercise-index" element={<ExerciseIndexPage />} />
            <Route path="/post-workout" element={<PostWorkoutPage username={storedUsername} />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
