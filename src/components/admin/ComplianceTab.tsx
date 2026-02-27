import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from '@/components/CircularProgress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import { NutritionComplianceCard } from './NutritionComplianceCard';
import { ConsistencyCard } from './ConsistencyCard';
import type { ComplianceResult, ComplianceFlag } from '@/hooks/useAdminCompliance';
import type { DailyNutrition } from '@/hooks/useAdminNutrition';

interface ComplianceTabProps {
  compliance: ComplianceResult;
  dailyLogs: DailyNutrition[];
  daysLogged: number;
  daysOnTarget: number;
  avgCalories: number;
  avgProtein: number;
  sessions: { session_date: string }[];
  weightLogs: { date: string; weight: number }[];
  goalWeight: number | null;
}

export function ComplianceTab({
  compliance,
  dailyLogs,
  daysLogged,
  daysOnTarget,
  avgCalories,
  avgProtein,
  sessions,
  weightLogs,
  goalWeight,
}: ComplianceTabProps) {
  const { overallScore, isOnTrack, consistencyScore, nutritionScore, progressionScore, weightScore, flags, weeklySessionCount, currentStreak } = compliance;

  // Weight trend chart data
  const weightChartData = weightLogs
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: w.weight,
    }));

  return (
    <div className="space-y-4">
      {/* Composite score + sub-scores */}
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Main ring */}
            <div className="shrink-0">
              <CircularProgress percentage={overallScore} size={100} strokeWidth={10} />
            </div>

            {/* Sub-scores */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <SubScore label="Consistency" score={consistencyScore} weight="30%" />
              <SubScore label="Nutrition" score={nutritionScore} weight="30%" />
              <SubScore label="Progression" score={progressionScore} weight="30%" />
              <SubScore label="Body Weight" score={weightScore} weight="10%" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags checklist */}
      {flags.length > 0 && (
        <Card className="bg-black/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Criteria Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flags.map((flag, i) => (
              <FlagRow key={i} flag={flag} />
            ))}
            {isOnTrack && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Overall score {overallScore}/100 - On Track</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two-column layout for cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConsistencyCard
          sessions={sessions}
          weeklySessionCount={weeklySessionCount}
          currentStreak={currentStreak}
        />

        {/* Body weight trend */}
        <Card className="bg-black/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Body Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weightChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
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
                    formatter={(value: number) => [`${value} lb`, 'Weight']}
                  />
                  {goalWeight != null && (
                    <ReferenceLine
                      y={goalWeight}
                      stroke="#69F0AE"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: `Goal: ${goalWeight}`, position: 'right', fill: '#69F0AE', fontSize: 10 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#F06292"
                    strokeWidth={2}
                    dot={{ fill: '#F06292', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/30 text-sm text-center py-8">
                Log 2+ weigh-ins to see trend
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nutrition compliance - full width */}
      <NutritionComplianceCard
        dailyLogs={dailyLogs}
        daysLogged={daysLogged}
        daysOnTarget={daysOnTarget}
        avgCalories={avgCalories}
        avgProtein={avgProtein}
      />
    </div>
  );
}

function SubScore({ label, score, weight }: { label: string; score: number; weight: string }) {
  const color =
    score >= 80 ? 'text-green-400' :
    score >= 50 ? 'text-amber-400' :
    'text-red-400';

  return (
    <div className="text-center">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{score}</p>
      <p className="text-[10px] text-white/20">{weight}</p>
    </div>
  );
}

function FlagRow({ flag }: { flag: ComplianceFlag }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <XCircle
        className={`h-4 w-4 shrink-0 ${
          flag.severity === 'danger' ? 'text-red-400' : 'text-amber-400'
        }`}
      />
      <span className="text-white/70">{flag.message}</span>
      <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
        {flag.category}
      </Badge>
    </div>
  );
}
