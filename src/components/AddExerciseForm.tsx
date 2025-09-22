import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useExerciseIndex } from '@/hooks/useExerciseIndex';
import { useToast } from '@/hooks/use-toast';

interface AddExerciseFormProps {
  username: string;
  onSuccess?: () => void;
  defaultValues?: {
    name?: string;
    category?: 'warmup' | 'workout' | 'substitute';
    video_url?: string;
    tier?: string;
    instructions?: string;
  };
}

interface FormData {
  name: string;
  category: 'warmup' | 'workout' | 'substitute';
  subcategory?: string;
  tier?: string;
  video_url: string;
  time_segment?: string;
  instructions?: string;
  tags?: string;
  is_custom: boolean;
}

export const AddExerciseForm: React.FC<AddExerciseFormProps> = ({ 
  username, 
  onSuccess,
  defaultValues 
}) => {
  const { addExercise } = useExerciseIndex();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      name: defaultValues?.name || '',
      category: defaultValues?.category || 'workout',
      video_url: defaultValues?.video_url || '',
      tier: defaultValues?.tier || '',
      instructions: defaultValues?.instructions || '',
      is_custom: true
    }
  });

  const category = watch('category');

  const onSubmit = async (data: FormData) => {
    try {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const exerciseData = {
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || undefined,
        tier: data.tier || undefined,
        video_url: data.video_url,
        time_segment: data.time_segment || undefined,
        instructions: data.instructions || undefined,
        exercise_data: {},
        tags: tagsArray,
        is_custom: data.is_custom,
        created_by: username
      };

      await addExercise(exerciseData);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise. Please try again.",
        variant: "destructive",
      });
    }
  };

  const subcategoryOptions = {
    warmup: [
      'Static Stretches',
      'Dynamic Stretches', 
      'Activation Exercises',
      'Specific Warm-up Sets',
      'Mobility',
      'Other'
    ],
    workout: [
      'Upper Body',
      'Lower Body', 
      'Core',
      'Compound',
      'Isolation',
      'Other'
    ],
    substitute: [
      'Upper Body Alternative',
      'Lower Body Alternative',
      'Equipment Alternative',
      'Other'
    ]
  };

  const tierOptions = [
    'Best of the Best - S+ Tier',
    'Great - A Tier',
    'Good - B Tier',
    'Okay - C Tier',
    'Substitute'
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Exercise Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">Exercise Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Exercise name is required' })}
          className="bg-black/50 border-orange-400/50 text-white placeholder:text-white/50"
          placeholder="e.g., Machine Hip Thrust"
        />
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-white">Category *</Label>
        <Select 
          value={category} 
          onValueChange={(value: 'warmup' | 'workout' | 'substitute') => setValue('category', value)}
        >
          <SelectTrigger className="bg-black/50 border-orange-400/50 text-white">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-black border-orange-400/50">
            <SelectItem value="warmup" className="text-white hover:bg-orange-500/10">Warmup</SelectItem>
            <SelectItem value="workout" className="text-white hover:bg-orange-500/10">Workout</SelectItem>
            <SelectItem value="substitute" className="text-white hover:bg-orange-500/10">Substitute</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory */}
      {category && (
        <div className="space-y-2">
          <Label className="text-white">Subcategory</Label>
          <Select onValueChange={(value) => setValue('subcategory', value)}>
            <SelectTrigger className="bg-black/50 border-orange-400/50 text-white">
              <SelectValue placeholder="Select subcategory (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-black border-orange-400/50">
              {subcategoryOptions[category].map((option) => (
                <SelectItem key={option} value={option} className="text-white hover:bg-orange-500/10">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tier (for workout exercises) */}
      {category === 'workout' && (
        <div className="space-y-2">
          <Label className="text-white">Tier</Label>
          <Select onValueChange={(value) => setValue('tier', value)}>
            <SelectTrigger className="bg-black/50 border-orange-400/50 text-white">
              <SelectValue placeholder="Select tier (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-black border-orange-400/50">
              {tierOptions.map((tier) => (
                <SelectItem key={tier} value={tier} className="text-white hover:bg-orange-500/10">
                  {tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Video URL */}
      <div className="space-y-2">
        <Label htmlFor="video_url" className="text-white">Video URL *</Label>
        <Input
          id="video_url"
          {...register('video_url', { 
            required: 'Video URL is required',
            pattern: {
              value: /^https?:\/\/.+/,
              message: 'Please enter a valid URL'
            }
          })}
          className="bg-black/50 border-orange-400/50 text-white placeholder:text-white/50"
          placeholder="https://www.youtube.com/watch?v=..."
        />
        {errors.video_url && (
          <p className="text-sm text-red-400">{errors.video_url.message}</p>
        )}
      </div>

      {/* Time Segment (for warmup exercises) */}
      {category === 'warmup' && (
        <div className="space-y-2">
          <Label htmlFor="time_segment" className="text-white">Time Segment</Label>
          <Input
            id="time_segment"
            {...register('time_segment')}
            className="bg-black/50 border-orange-400/50 text-white placeholder:text-white/50"
            placeholder="e.g., [00:00:03 - 00:00:05]"
          />
        </div>
      )}

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions" className="text-white">Instructions</Label>
        <Textarea
          id="instructions"
          {...register('instructions')}
          className="bg-black/50 border-orange-400/50 text-white placeholder:text-white/50 min-h-20"
          placeholder="Exercise instructions, form cues, etc."
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags" className="text-white">Tags</Label>
        <Input
          id="tags"
          {...register('tags')}
          className="bg-black/50 border-orange-400/50 text-white placeholder:text-white/50"
          placeholder="e.g., compound, glutes, beginner (comma separated)"
        />
      </div>

      {/* Custom Exercise Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_custom"
          checked={watch('is_custom')}
          onCheckedChange={(checked) => setValue('is_custom', checked)}
        />
        <Label htmlFor="is_custom" className="text-white">Mark as custom exercise</Label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-primary hover:bg-gradient-primary/80"
      >
        {isSubmitting ? 'Adding Exercise...' : 'Add Exercise'}
      </Button>
    </form>
  );
};