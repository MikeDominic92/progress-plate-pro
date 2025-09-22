import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Search, Plus, BookOpen, Target, Zap } from 'lucide-react';
import { useExerciseIndex, ExerciseIndexItem } from '@/hooks/useExerciseIndex';
import { AddExerciseForm } from './AddExerciseForm';

interface ExerciseIndexBrowserProps {
  onSelectExercise?: (exercise: ExerciseIndexItem) => void;
  username: string;
}

export const ExerciseIndexBrowser: React.FC<ExerciseIndexBrowserProps> = ({ 
  onSelectExercise, 
  username 
}) => {
  const { exercises, loading, fetchExercises, getGroupedExercises } = useExerciseIndex();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchExercises({ 
      search: term || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined 
    });
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    fetchExercises({ 
      category: category !== 'all' ? category : undefined,
      search: searchTerm || undefined 
    });
  };

  const openVideoSafely = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open video:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'warmup': return <Zap className="h-4 w-4" />;
      case 'workout': return <Target className="h-4 w-4" />;
      case 'substitute': return <BookOpen className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier?: string) => {
    if (!tier) return 'secondary';
    if (tier.includes('S+')) return 'default';
    if (tier.includes('A')) return 'outline';
    return 'secondary';
  };

  const groupedExercises = getGroupedExercises();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Exercise Index</h2>
          <p className="text-white/70">Browse and manage your exercise library</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/80">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-black border-orange-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Exercise</DialogTitle>
            </DialogHeader>
            <AddExerciseForm 
              username={username} 
              onSuccess={() => {
                setShowAddForm(false);
                fetchExercises();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-black/50 border-orange-400/50 text-white placeholder:text-white/50 focus:border-orange-500"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={handleCategoryFilter} className="w-auto">
          <TabsList className="bg-black/50 border border-orange-400/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              All
            </TabsTrigger>
            <TabsTrigger value="warmup" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              Warmup
            </TabsTrigger>
            <TabsTrigger value="workout" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              Workout
            </TabsTrigger>
            <TabsTrigger value="substitute" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              Substitute
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/70">Loading exercises...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExercises).map(([category, subcategories]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(category)}
                <h3 className="text-xl font-semibold text-white capitalize">{category} Exercises</h3>
                <Badge variant="outline" className="border-orange-400/50 text-orange-400">
                  {Object.values(subcategories).flat().length}
                </Badge>
              </div>

              {Object.entries(subcategories).map(([subcategory, exercises]) => (
                <div key={subcategory} className="space-y-3">
                  {subcategory !== 'Other' && (
                    <h4 className="text-lg font-medium text-white/80">{subcategory}</h4>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {exercises.map((exercise) => (
                      <Card key={exercise.id} className="bg-black/50 border-orange-400/50 hover:border-orange-500/70 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-medium text-white leading-tight">
                              {exercise.name}
                            </CardTitle>
                            {exercise.tier && (
                              <Badge variant={getTierColor(exercise.tier)} className="text-xs ml-2 shrink-0">
                                {exercise.tier}
                              </Badge>
                            )}
                          </div>
                          {exercise.time_segment && (
                            <p className="text-xs text-white/60">{exercise.time_segment}</p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {exercise.instructions && (
                            <p className="text-xs text-white/70 line-clamp-2">
                              {exercise.instructions}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openVideoSafely(exercise.video_url)}
                              className="flex-1 border-orange-400/50 text-orange-400 hover:bg-orange-500/10"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Watch
                            </Button>
                            
                            {onSelectExercise && (
                              <Button
                                size="sm"
                                onClick={() => onSelectExercise(exercise)}
                                className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80"
                              >
                                Select
                              </Button>
                            )}
                          </div>

                          {exercise.is_custom && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {exercises.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-white/70 mb-4">No exercises found</div>
              <Button onClick={() => setShowAddForm(true)} className="bg-gradient-primary hover:bg-gradient-primary/80">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Exercise
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};