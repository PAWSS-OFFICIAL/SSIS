import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { DashboardSkeleton } from "../components/ui/skeleton";
import { StreakSystem } from "../components/StreakSystem";
import {
  Trophy,
  Medal,
  Star,
  Flame,
  Target,
  Users,
  TrendingUp,
  Award,
  Zap,
  Clock,
  ChevronRight,
  Loader2,
  Calendar
} from "lucide-react";

export const GamificationPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsRes, leaderboardRes] = await Promise.all([
        apiClient.get("/gamification/my-rewards"),
        apiClient.get("/gamification/leaderboard?limit=10"),
      ]);
      setRewards(rewardsRes.data);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (error) {
      toast.error("Failed to load gamification data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Rewards & Achievements">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const getRankColor = (rank) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-slate-400";
    if (rank === 3) return "text-amber-600";
    return "text-slate-600";
  };

  const getRankBg = (rank) => {
    if (rank === 1) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (rank === 2) return "bg-slate-100 dark:bg-slate-800";
    if (rank === 3) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-slate-50 dark:bg-slate-800/50";
  };

  return (
    <DashboardLayout title="Rewards & Achievements">
      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-full">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Points</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {rewards?.total_points?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-full">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Streak</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {rewards?.streaks?.[0]?.current_streak || 0} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-full">
                <Medal className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Badges Earned</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {rewards?.badges?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["overview", "streaks", "leaderboard", "badges", "challenges"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab === "streaks" && <Flame className="w-4 h-4 mr-2" />}
            {tab}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "streaks" && <StreakSystem />}

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Recent Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewards?.badges?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {rewards.badges.slice(0, 6).map((badge, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="text-4xl mb-2">{badge.icon || "🏅"}</span>
                      <p className="text-sm font-medium text-center text-slate-900 dark:text-white">
                        {badge.name}
                      </p>
                      <p className="text-xs text-slate-500 text-center mt-1">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No badges earned yet. Keep learning!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewards?.active_challenges?.length > 0 ? (
                <div className="space-y-4">
                  {rewards.active_challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {challenge.title}
                          </h4>
                          <p className="text-sm text-slate-500">{challenge.description}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-600">
                          +{challenge.reward_points} pts
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-medium">{challenge.progress || 0}%</span>
                        </div>
                        <Progress value={challenge.progress || 0} className="h-2" />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Ends {new Date(challenge.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No active challenges</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top performers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-lg ${getRankBg(entry.rank)}`}
                >
                  <div className={`text-2xl font-bold w-8 ${getRankColor(entry.rank)}`}>
                    {entry.rank === 1 && "🥇"}
                    {entry.rank === 2 && "🥈"}
                    {entry.rank === 3 && "🥉"}
                    {entry.rank > 3 && entry.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {entry.user_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {entry.department} • {entry.badges?.length || 0} badges
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {entry.points?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "badges" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              All Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rewards?.badges?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {rewards.badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center p-6 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <span className="text-5xl mb-3">{badge.icon || "🏅"}</span>
                    <p className="font-medium text-center text-slate-900 dark:text-white">
                      {badge.name}
                    </p>
                    <p className="text-sm text-slate-500 text-center mt-1">
                      {badge.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No badges earned yet</p>
                <p className="text-sm">Complete assignments and maintain attendance to earn badges!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "challenges" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              All Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rewards?.active_challenges?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.active_challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {challenge.challenge_type}
                      </Badge>
                      <Badge variant="outline" className="text-amber-600">
                        +{challenge.reward_points} pts
                      </Badge>
                    </div>
                    <h4 className="font-medium text-lg text-slate-900 dark:text-white mb-2">
                      {challenge.title}
                    </h4>
                    <p className="text-sm text-slate-500 mb-4">{challenge.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium">{challenge.progress || 0}%</span>
                      </div>
                      <Progress value={challenge.progress || 0} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                      <span>Started {new Date(challenge.start_date).toLocaleDateString()}</span>
                      <span>Ends {new Date(challenge.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No active challenges</p>
                <p className="text-sm">Check back later for new challenges!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};
