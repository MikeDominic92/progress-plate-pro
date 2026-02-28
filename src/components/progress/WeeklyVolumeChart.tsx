import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ExplainTerm from '@/components/ExplainTerm';

interface WeeklyVolumeChartProps {
  data: { weekLabel: string; totalVolume: number }[];
}

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-4">
          <ExplainTerm term="Volume"><span className="text-sm font-semibold text-white/70">Weekly Volume</span></ExplainTerm>
          <p className="text-xs text-white/30 mt-2">No volume data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="p-4">
        <ExplainTerm term="Volume"><span className="text-sm font-semibold text-white/70">Weekly Volume (lb)</span></ExplainTerm>
        <div className="h-40 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}
                formatter={(value: number) => [`${value.toLocaleString()} lb`, 'Volume']}
              />
              <Bar dataKey="totalVolume" fill="hsl(340, 82%, 66%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
