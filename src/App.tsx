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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cardio" element={<CardioPage username="user" />} />
          <Route path="/warmup" element={<WarmupPage username="user" />} />
          <Route path="/workout" element={<WorkoutOverviewPage username="user" />} />
          <Route path="/exercise/:exerciseIndex" element={<ExercisePage username="user" />} />
          <Route path="/post-workout" element={<PostWorkoutPage username="user" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
