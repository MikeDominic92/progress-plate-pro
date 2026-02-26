import { useState } from 'react';
import { Scale, Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface WeightTrackerProps {
  weightLogs: { date: string; weight: number }[];
  goalWeight: number | null;
  latestWeight: number | null;
  weightDelta: number | null;
  onLogWeight: (date: string, weight: number) => Promise<void>;
  onUpdateGoalWeight: (goal: number | null) => Promise<void>;
}

export function WeightTracker({
  weightLogs,
  goalWeight,
  latestWeight,
  weightDelta,
  onLogWeight,
  onUpdateGoalWeight,
}: WeightTrackerProps) {
  const [weightInput, setWeightInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLogToday = async () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await onLogWeight(today, val);
      setWeightInput('');
    } finally {
      setSaving(false);
    }
  };

  const handleSetGoal = async () => {
    const val = parseFloat(goalInput);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      await onUpdateGoalWeight(val);
      setEditingGoal(false);
      setGoalInput('');
    } finally {
      setSaving(false);
    }
  };

  const last7 = weightLogs.slice(-7).map(l => ({
    ...l,
    label: format(new Date(l.date + 'T00:00:00'), 'M/d'),
  }));

  const deltaIcon = weightDelta === null ? null
    : weightDelta > 0 ? <TrendingUp className="h-3 w-3" />
    : weightDelta < 0 ? <TrendingDown className="h-3 w-3" />
    : <Minus className="h-3 w-3" />;

  const deltaColor = weightDelta === null ? ''
    : weightDelta > 0 ? 'text-red-400'
    : weightDelta < 0 ? 'text-green-400'
    : 'text-white/40';

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-white/90">Body Weight</span>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Weight (lb)"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogToday()}
          className="flex-1 min-w-0 rounded-lg border border-primary/50 bg-black text-white placeholder:text-gray-400 px-3 py-2 text-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none hover:border-primary/70"
        />
        <Button
          onClick={handleLogToday}
          disabled={saving || !weightInput}
          size="sm"
          className="bg-gradient-primary hover:shadow-glow active:bg-primary/20 text-xs px-3"
        >
          {saving ? '...' : 'Log Today'}
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <div className="flex items-center gap-3">
          {latestWeight !== null && (
            <span className="text-white/70">
              Current: <span className="text-white font-medium">{latestWeight} lb</span>
            </span>
          )}
          {weightDelta !== null && (
            <span className={`flex items-center gap-0.5 ${deltaColor}`}>
              {deltaIcon}
              {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} lb
            </span>
          )}
        </div>
        {goalWeight !== null && !editingGoal && (
          <button
            onClick={() => { setEditingGoal(true); setGoalInput(String(goalWeight)); }}
            className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
          >
            <Target className="h-3 w-3" />
            Goal: {goalWeight} lb
          </button>
        )}
        {goalWeight === null && !editingGoal && (
          <button
            onClick={() => setEditingGoal(true)}
            className="text-primary/70 hover:text-primary transition-colors"
          >
            Set goal
          </button>
        )}
      </div>

      {/* Goal editing */}
      {editingGoal && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Goal weight (lb)"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetGoal()}
            className="flex-1 rounded-lg border border-white/20 bg-black text-white placeholder:text-gray-400 px-3 py-1.5 text-xs transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
          <Button onClick={handleSetGoal} disabled={saving} size="sm" variant="ghost" className="text-xs h-9 px-2 text-green-400 hover:text-green-300">
            Save
          </Button>
          <Button onClick={() => setEditingGoal(false)} size="sm" variant="ghost" className="text-xs h-9 px-2 text-white/40 hover:text-white/60">
            Cancel
          </Button>
        </div>
      )}

      {/* Sparkline */}
      {last7.length >= 2 && (
        <div className="pt-1">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={last7} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F06292" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F06292" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#F06292"
                strokeWidth={2}
                fill="url(#weightGrad)"
              />
              {goalWeight !== null && (
                <ReferenceLine
                  y={goalWeight}
                  stroke="#69F0AE"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
