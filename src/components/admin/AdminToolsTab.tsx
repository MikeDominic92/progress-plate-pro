import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';
import { extractUniqueExercises, getExerciseSyncStats } from '@/utils/exerciseSync';
import { useExerciseIndex } from '@/hooks/useExerciseIndex';
import { deleteAllData } from '@/utils/adminActions';
import { useToast } from '@/hooks/use-toast';

interface AdminToolsTabProps {
  onDataReset?: () => void;
}

export function AdminToolsTab({ onDataReset }: AdminToolsTabProps) {
  const { addExercise, updateExercise, exercises, fetchExercises } = useExerciseIndex();
  const { toast } = useToast();

  const handleSyncExercises = async () => {
    try {
      const exercisesToSync = extractUniqueExercises('JackyLove');
      let syncedCount = 0;
      let updatedCount = 0;

      for (const exerciseData of exercisesToSync) {
        const existingExercise = exercises.find(ex => ex.name === exerciseData.name);

        if (existingExercise) {
          await updateExercise(existingExercise.id, {
            tier: exerciseData.tier,
            video_url: exerciseData.video_url,
            instructions: exerciseData.instructions,
            subcategory: exerciseData.subcategory,
          });
          updatedCount++;
        } else {
          await addExercise(exerciseData);
          syncedCount++;
        }
      }

      await fetchExercises();

      toast({
        title: 'Exercise Sync Complete',
        description: `Updated ${updatedCount} exercises + added ${syncedCount} new ones with Jeff Nippard timestamped videos.`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync exercises. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleResetData = async () => {
    const confirmed = window.confirm(
      'This will permanently delete ALL workout sessions, profiles, and analytics data. This action cannot be undone. Are you sure?'
    );
    if (!confirmed) return;

    try {
      await deleteAllData();
      toast({
        title: 'Success',
        description: 'All data has been reset successfully.',
      });
      onDataReset?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Exercise Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sync all exercises from the 40-day workout plan with Jeff Nippard timestamped videos and glute region descriptions.
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <div>Exercises with videos: {getExerciseSyncStats('Admin').exercisesWithVideos}</div>
            <div>Current index size: {exercises.length}</div>
          </div>
          <Button
            onClick={handleSyncExercises}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All Exercises (Jeff Nippard Videos)
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Reset Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will permanently delete all workout sessions, profiles, and analytics data.
          </p>
          <Button
            variant="destructive"
            onClick={handleResetData}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
