import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { WeightTrendPoint } from '@/utils/progressionEngine';
import { format } from 'date-fns';

interface ExerciseProgressChartProps {
  data: WeightTrendPoint[];
  exerciseName: string;
  compact?: boolean;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as WeightTrendPoint;
  return (
    <div className="bg-black/90 border border-white/20 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/60 mb-1">{format(new Date(d.date), 'MMM d, yyyy')}</p>
      <p className="text-primary font-medium">{d.weight} lb x {d.reps} reps</p>
      <p className="text-success">e1RM: {d.estimated1RM} lb</p>
    </div>
  );
}

export function ExerciseProgressChart({ data, exerciseName, compact = false }: ExerciseProgressChartProps) {
  if (data.length < 2) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-4 text-center text-white/40 text-sm">
          Complete 2+ sessions to see your {exerciseName} progress chart
        </CardContent>
      </Card>
    );
  }

  const chartHeight = compact ? 160 : 250;

  // Format dates for X-axis
  const formatted = data.map(d => ({
    ...d,
    label: format(new Date(d.date), 'M/d'),
  }));

  return (
    <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
      {!compact && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white/80 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {exerciseName} Progress
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-2' : 'px-2 pb-4 pt-0'}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#F06292"
              strokeWidth={2}
              dot={{ fill: '#F06292', r: 3 }}
              activeDot={{ r: 5, fill: '#F06292' }}
              name="Weight"
            />
            <Line
              type="monotone"
              dataKey="estimated1RM"
              stroke="#69F0AE"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: '#69F0AE', r: 2 }}
              activeDot={{ r: 4, fill: '#69F0AE' }}
              name="Est. 1RM"
            />
          </LineChart>
        </ResponsiveContainer>
        {compact && (
          <div className="flex items-center justify-center gap-4 mt-1 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-primary inline-block" /> Weight
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success inline-block border-dashed" /> Est. 1RM
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
