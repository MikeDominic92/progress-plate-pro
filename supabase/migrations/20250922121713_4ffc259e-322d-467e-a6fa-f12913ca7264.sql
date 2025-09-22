-- Create exercise index table to store all exercises and videos for reuse
CREATE TABLE public.exercise_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'warmup', 'workout', 'substitute'
  subcategory TEXT, -- For warmup: 'Static Stretches', 'Activation Exercises', etc.
  tier TEXT, -- For workout exercises: 'S+ Tier', 'A Tier', etc.
  video_url TEXT NOT NULL,
  time_segment TEXT, -- For warmup exercises: '[00:00:03 - 00:00:05]'
  instructions TEXT, -- General instructions or notes
  exercise_data JSONB DEFAULT '{}'::jsonb, -- Store sets, substitute info, etc.
  tags TEXT[] DEFAULT '{}', -- For filtering/searching
  is_custom BOOLEAN DEFAULT false, -- User-created vs system exercises
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT -- Username who added this exercise
);

-- Enable Row Level Security
ALTER TABLE public.exercise_index ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise access
CREATE POLICY "Exercise index is viewable by everyone" 
ON public.exercise_index 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create exercises" 
ON public.exercise_index 
FOR INSERT 
WITH CHECK (created_by IS NOT NULL);

CREATE POLICY "Users can update their own exercises" 
ON public.exercise_index 
FOR UPDATE 
USING (created_by = auth.jwt() ->> 'username' OR created_by IS NULL);

CREATE POLICY "Users can delete their own exercises" 
ON public.exercise_index 
FOR DELETE 
USING (created_by = auth.jwt() ->> 'username');

-- Create indexes for better performance
CREATE INDEX idx_exercise_index_category ON public.exercise_index(category);
CREATE INDEX idx_exercise_index_subcategory ON public.exercise_index(subcategory);
CREATE INDEX idx_exercise_index_tags ON public.exercise_index USING GIN(tags);
CREATE INDEX idx_exercise_index_name ON public.exercise_index(name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exercise_index_updated_at
BEFORE UPDATE ON public.exercise_index
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing warmup exercises into the index
INSERT INTO public.exercise_index (name, category, subcategory, video_url, time_segment, created_by) VALUES
-- Static Stretches
('Deep Lunge (pushing knee outwards)', 'warmup', 'Static Stretches', 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=3s', '[00:00:03 - 00:00:05]', 'system'),
('90/90', 'warmup', 'Static Stretches', 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=9s', '[00:00:09 - 00:00:11]', 'system'),
('Frog', 'warmup', 'Static Stretches', 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=6s', '[00:00:06 - 00:00:08]', 'system'),
('Single Leg Groin Stretch', 'warmup', 'Static Stretches', 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=9s', '[00:00:09 - 00:00:11]', 'system'),

-- Activation Exercises  
('Deep Squat (pushing knees outwards)', 'warmup', 'Activation Exercises', 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=12s', '[00:00:12 - 00:00:14]', 'system'),
('Deep Squat w/ Knee Taps', 'warmup', 'Activation Exercises', 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=15s', '[00:00:15 - 00:00:17]', 'system'),
('Cossack Squat', 'warmup', 'Activation Exercises', 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=4s', '[00:00:04 - 00:00:06]', 'system'),
('Cossack Squat w/ Internal Rotation', 'warmup', 'Activation Exercises', 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=19s', '[00:00:19 - 00:00:22]', 'system'),
('ATG Split Squat', 'warmup', 'Activation Exercises', 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=6s', '[00:00:06 - 00:00:08]', 'system'),

-- Specific Warm-up Sets
('Warmup sets before working sets', 'warmup', 'Specific Warm-up Sets', 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=13s', '[00:00:13 - 00:00:15]', 'system');

-- Insert existing workout exercises into the index  
INSERT INTO public.exercise_index (name, category, tier, video_url, exercise_data, created_by) VALUES 
('Machine/Barbell Hip Thrust', 'workout', 'Great - A Tier', 'https://www.youtube.com/shorts/-1cAnwFNBLg', 
 '{"sets": [
   {"id": 0, "type": "Warm Up Set", "instructions": "15-20 reps (light weight, perfect form)"},
   {"id": 1, "type": "Medium/Primer Set", "instructions": "10-12 reps @ 3-4 RIR"},
   {"id": 2, "type": "Heavy/Top Set", "instructions": "8-10 reps @ 1 RIR"},
   {"id": 3, "type": "Failure/Back-Off Set", "instructions": "AMRAP @ 0 RIR (drop weight 25-30%)"}
 ]}', 'system'),

('Single Leg Dumbbell Hip Thrust', 'substitute', 'Substitute', 'https://www.youtube.com/shorts/KSeceTJh9m0',
 '{"sets": [
   {"id": 4, "type": "Warm Up Set", "instructions": "15-20 reps per leg (light weight)"},
   {"id": 5, "type": "Medium/Primer Set", "instructions": "10-12 reps per leg @ 3-4 RIR"},
   {"id": 6, "type": "Heavy/Top Set", "instructions": "8-10 reps per leg @ 1 RIR"},
   {"id": 7, "type": "Failure/Back-Off Set", "instructions": "AMRAP per leg @ 0 RIR (bodyweight or light)"}
 ]}', 'system'),

('Walking Lunge', 'workout', 'Best of the Best - S+ Tier', 'https://www.youtube.com/shorts/BhUpWmlKcJ8?feature=share',
 '{"sets": [
   {"id": 8, "type": "Warm Up Set", "instructions": "15-20 reps (light weight, perfect form)"},
   {"id": 9, "type": "Medium/Primer Set", "instructions": "12 reps per leg @ 3-4 RIR"},
   {"id": 10, "type": "Heavy/Top Set", "instructions": "10 reps per leg @ 1 RIR"},
   {"id": 11, "type": "Failure/Back-Off Set", "instructions": "AMRAP per leg @ 0 RIR (drop weight 25-30%)"}
 ]}', 'system');