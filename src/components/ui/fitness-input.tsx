import React from 'react';
import { cn } from '@/lib/utils';

interface FitnessInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success';
}

export const FitnessInput = React.forwardRef<HTMLInputElement, FitnessInputProps>(
  ({ className, label, icon, variant = 'default', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            className={cn(
              "w-full rounded-lg border border-border bg-card/50 backdrop-blur-sm",
              "px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
              "transition-all duration-200 ease-smooth",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              "hover:border-primary/50",
              icon && "pl-10",
              variant === 'success' && "border-success bg-success/5 focus:border-success focus:ring-success/20",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      </div>
    );
  }
);

FitnessInput.displayName = "FitnessInput";