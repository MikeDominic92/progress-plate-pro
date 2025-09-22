import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExerciseIndexItem {
  id: string;
  name: string;
  category: 'warmup' | 'workout' | 'substitute' | 'core';
  subcategory?: string;
  tier?: string;
  video_url: string;
  time_segment?: string;
  instructions?: string;
  exercise_data?: any;
  tags?: string[];
  is_custom: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useExerciseIndex = () => {
  const [exercises, setExercises] = useState<ExerciseIndexItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all exercises
  const fetchExercises = async (filters?: {
    category?: string;
    subcategory?: string;
    search?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('exercise_index')
        .select('*')
        .order('category', { ascending: true })
        .order('subcategory', { ascending: true })
        .order('name', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,instructions.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setExercises((data || []) as ExerciseIndexItem[]);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load exercise index.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add exercise to index
  const addExercise = async (exercise: Omit<ExerciseIndexItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('exercise_index')
        .insert({
          name: exercise.name,
          category: exercise.category,
          subcategory: exercise.subcategory,
          tier: exercise.tier,
          video_url: exercise.video_url,
          time_segment: exercise.time_segment,
          instructions: exercise.instructions,
          exercise_data: exercise.exercise_data,
          tags: exercise.tags,
          is_custom: exercise.is_custom,
          created_by: exercise.created_by
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setExercises(prev => [...prev, data as ExerciseIndexItem]);
        toast({
          title: "Success",
          description: "Exercise added to index!",
        });
      }

      return data;
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise to index.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update exercise in index
  const updateExercise = async (id: string, updates: Partial<ExerciseIndexItem>) => {
    try {
      const { data, error } = await supabase
        .from('exercise_index')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setExercises(prev => prev.map(ex => ex.id === id ? data as ExerciseIndexItem : ex));
        toast({
          title: "Success",
          description: "Exercise updated!",
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete exercise from index
  const deleteExercise = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exercise_index')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExercises(prev => prev.filter(ex => ex.id !== id));
      toast({
        title: "Success",
        description: "Exercise deleted from index.",
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise.",
        variant: "destructive",
      });
    }
  };

  // Get exercises grouped by category/subcategory
  const getGroupedExercises = () => {
    const grouped: Record<string, Record<string, ExerciseIndexItem[]>> = {};

    exercises.forEach(exercise => {
      const category = exercise.category;
      const subcategory = exercise.subcategory || 'Other';

      if (!grouped[category]) {
        grouped[category] = {};
      }

      if (!grouped[category][subcategory]) {
        grouped[category][subcategory] = [];
      }

      grouped[category][subcategory].push(exercise);
    });

    return grouped;
  };

  // Load exercises on mount
  useEffect(() => {
    fetchExercises();
  }, []);

  return {
    exercises,
    loading,
    fetchExercises,
    addExercise,
    updateExercise,
    deleteExercise,
    getGroupedExercises
  };
};