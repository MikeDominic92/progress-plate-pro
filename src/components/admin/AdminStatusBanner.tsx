import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ComplianceFlag } from '@/hooks/useAdminCompliance';

interface AdminStatusBannerProps {
  isOnTrack: boolean;
  overallScore: number;
  flags: ComplianceFlag[];
}

export function AdminStatusBanner({ isOnTrack, overallScore, flags }: AdminStatusBannerProps) {
  const topFlags = flags.slice(0, 3);

  return (
    <div
      className={`rounded-lg border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 ${
        isOnTrack
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnTrack ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        )}
        <span className="font-medium text-sm">
          {isOnTrack ? 'On Track' : 'Needs Attention'} - {overallScore}/100
        </span>
      </div>
      {topFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {topFlags.map((flag, i) => (
            <Badge
              key={i}
              variant="outline"
              className={
                flag.severity === 'danger'
                  ? 'border-red-500/40 text-red-400 text-xs'
                  : 'border-amber-500/40 text-amber-400 text-xs'
              }
            >
              {flag.message}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
