import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminLiveSession } from '@/hooks/useAdminLiveSession';
import { useAdminSessionHistory } from '@/hooks/useAdminSessionHistory';
import { useAdminNutrition } from '@/hooks/useAdminNutrition';
import { useAdminCompliance } from '@/hooks/useAdminCompliance';
import { useProgression } from '@/hooks/useProgression';
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatusBanner } from '@/components/admin/AdminStatusBanner';
import { LiveSessionTab } from '@/components/admin/LiveSessionTab';
import { SessionHistoryTab } from '@/components/admin/SessionHistoryTab';
import { ProgressTab } from '@/components/admin/ProgressTab';
import { ComplianceTab } from '@/components/admin/ComplianceTab';
import { AdminToolsTab } from '@/components/admin/AdminToolsTab';

const USERNAME = 'Kara';

const AdminDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Data hooks
  const liveSession = useAdminLiveSession(USERNAME);
  const sessionHistory = useAdminSessionHistory(USERNAME);
  const nutrition = useAdminNutrition(USERNAME);
  const progression = useProgression(USERNAME);
  const weightTracker = useWeightTracker(USERNAME);

  // Compliance score (derived from other hooks)
  const compliance = useAdminCompliance({
    sessions: sessionHistory.sessions,
    allHistory: progression.allHistory,
    getPlateauStatus: progression.getPlateauStatus,
    dailyLogs: nutrition.dailyLogs,
    weightLogs: weightTracker.weightLogs,
    goalWeight: weightTracker.goalWeight,
  });

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      liveSession.refresh(),
      sessionHistory.refresh(),
      nutrition.refresh(),
      progression.refreshHistory(),
    ]);
    setRefreshing(false);
  }, [liveSession, sessionHistory, nutrition, progression]);

  const loading = liveSession.loading || sessionHistory.loading || progression.loading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading training dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4">
        <AdminHeader
          lastPolled={liveSession.lastPolled}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <AdminStatusBanner
          isOnTrack={compliance.isOnTrack}
          overallScore={compliance.overallScore}
          flags={compliance.flags}
        />

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="live" className="whitespace-nowrap flex-shrink-0">Live</TabsTrigger>
            <TabsTrigger value="sessions" className="whitespace-nowrap flex-shrink-0">Sessions</TabsTrigger>
            <TabsTrigger value="progress" className="whitespace-nowrap flex-shrink-0">Progress</TabsTrigger>
            <TabsTrigger value="compliance" className="whitespace-nowrap flex-shrink-0">Compliance</TabsTrigger>
            <TabsTrigger value="tools" className="whitespace-nowrap flex-shrink-0">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <LiveSessionTab
              activeSession={liveSession.activeSession}
              liveEvents={liveSession.liveEvents}
              currentExercise={liveSession.currentExercise}
              currentPhase={liveSession.currentPhase}
              sessionDuration={liveSession.sessionDuration}
              exerciseCount={liveSession.exerciseCount}
              setsCompleted={liveSession.setsCompleted}
              lastPolled={liveSession.lastPolled}
            />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionHistoryTab
              sessions={sessionHistory.sessions}
              stats={sessionHistory.stats}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTab
              allHistory={progression.allHistory}
              allPRs={progression.allPRs}
              getWeightTrend={progression.getWeightTrend}
              getPlateauStatus={progression.getPlateauStatus}
            />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceTab
              compliance={compliance}
              dailyLogs={nutrition.dailyLogs}
              daysLogged={nutrition.daysLogged}
              daysOnTarget={nutrition.daysOnTarget}
              avgCalories={nutrition.avgCalories}
              avgProtein={nutrition.avgProtein}
              sessions={sessionHistory.sessions}
              weightLogs={weightTracker.weightLogs}
              goalWeight={weightTracker.goalWeight}
            />
          </TabsContent>

          <TabsContent value="tools">
            <AdminToolsTab onDataReset={handleRefresh} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
