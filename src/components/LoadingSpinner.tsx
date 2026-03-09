import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

export const LoadingSpinner = ({
  size = 'md',
  fullScreen = false,
  className,
}: LoadingSpinnerProps) => {
  const spinner = (
    <div
      className={cn(
        sizeClasses[size],
        'border-primary/30 border-t-primary rounded-full animate-spin',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};
