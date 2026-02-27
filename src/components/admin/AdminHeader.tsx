import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  lastPolled: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function AdminHeader({ lastPolled, onRefresh, refreshing }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Kara's Training Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {lastPolled
            ? `Last updated ${lastPolled.toLocaleTimeString()}`
            : 'Loading...'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="self-start sm:self-auto"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}
