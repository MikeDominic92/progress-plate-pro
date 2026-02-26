import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function DateTimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center px-3 py-1.5 bg-black/50 border border-white/10 rounded-full text-xs sm:text-sm text-white/80 font-mono backdrop-blur-sm">
      {format(now, "EEEE, MMMM d, yyyy")} &bull; {format(now, "h:mm:ss a")}
    </div>
  );
}
