import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResetSessionButtonProps {
  onClearSession: () => void;
}

export const ResetSessionButton = ({ onClearSession }: ResetSessionButtonProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleReset = () => {
    onClearSession();
    navigate('/');
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-destructive/10 backdrop-blur-glass border-destructive/30 shadow-xl max-w-xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Clear Session?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              This will clear all workout data and return to the landing page.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleReset}
                className="flex-1"
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      size="sm"
      variant="outline"
      className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all duration-200"
      title="Reset session and start fresh"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
};