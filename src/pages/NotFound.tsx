import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center pb-14">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-extrabold text-white/90">404</h1>
          <p className="mb-6 text-lg text-white/50">Page not found</p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-sm font-semibold text-primary hover:bg-primary/30 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NotFound;
