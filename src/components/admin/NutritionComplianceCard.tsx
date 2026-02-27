import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DAILY_TARGETS } from '@/hooks/useNutritionTracker';
import type { DailyNutrition } from '@/hooks/useAdminNutrition';

interface NutritionComplianceCardProps {
  dailyLogs: DailyNutrition[];
  daysLogged: number;
  daysOnTarget: number;
  avgCalories: number;
  avgProtein: number;
}

export function NutritionComplianceCard({
  dailyLogs,
  daysLogged,
  daysOnTarget,
  avgCalories,
  avgProtein,
}: NutritionComplianceCardProps) {
  // Last 7 days of data for the chart
  const chartData = useMemo(() => {
    const last7 = dailyLogs.slice(-7);
    return last7.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      protein: d.protein,
      calories: d.calories,
      carbs: d.carbs,
      fat: d.fat,
    }));
  }, [dailyLogs]);

  return (
    <Card className="bg-black/50 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/70">7-Day Nutrition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xs text-white/40">Days Logged</p>
            <p className="text-lg font-bold">{daysLogged}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">On Target</p>
            <p className="text-lg font-bold text-green-400">{daysOnTarget}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Avg Cal</p>
            <p className={`text-lg font-bold ${avgCalories > DAILY_TARGETS.calories + 150 ? 'text-red-400' : ''}`}>
              {avgCalories}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40">Avg Protein</p>
            <p className={`text-lg font-bold ${avgProtein < DAILY_TARGETS.protein ? 'text-amber-400' : 'text-green-400'}`}>
              {avgProtein}g
            </p>
          </div>
        </div>

        {/* Protein bar chart with target line */}
        {chartData.length > 0 ? (
          <div>
            <p className="text-xs text-white/40 mb-1">Daily Protein (g) vs Target ({DAILY_TARGETS.protein}g)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}${name === 'calories' ? ' cal' : 'g'}`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <ReferenceLine
                  y={DAILY_TARGETS.protein}
                  stroke="#69F0AE"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar dataKey="protein" fill="#F06292" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center py-4">No nutrition data to display</p>
        )}

        {/* Calorie chart */}
        {chartData.length > 0 && (
          <div>
            <p className="text-xs text-white/40 mb-1">Daily Calories vs Target ({DAILY_TARGETS.calories})</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} cal`, 'Calories']}
                />
                <ReferenceLine
                  y={DAILY_TARGETS.calories}
                  stroke="#69F0AE"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar dataKey="calories" fill="#8884d8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
