import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

interface BodyWeightSparklineProps {
  data: { date: string; weight: number }[];
  weightUnit: 'lb' | 'kg';
}

const LB_TO_KG = 0.453592;

export function BodyWeightSparkline({ data, weightUnit }: BodyWeightSparklineProps) {
  if (data.length < 2) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-4">
          <span className="text-sm font-semibold text-white/70">Body Weight</span>
          <p className="text-xs text-white/30 mt-2">Need 2+ weigh-ins to show trend</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    date: d.date,
    weight: weightUnit === 'kg' ? +(d.weight * LB_TO_KG).toFixed(1) : d.weight,
  }));

  const first = chartData[0].weight;
  const last = chartData[chartData.length - 1].weight;
  const delta = last - first;

  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-white/70">Body Weight</span>
          <span className={`text-xs font-medium ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-white/40'}`}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)} {weightUnit}
          </span>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'white',
                }}
                formatter={(value: number) => [`${value} ${weightUnit}`, 'Weight']}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={delta < 0 ? '#4ade80' : '#f87171'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
