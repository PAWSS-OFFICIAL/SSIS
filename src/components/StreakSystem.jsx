import React, { useState, useEffect } from "react";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import {
  Flame,
  Zap,
  Trophy,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Gift,
  TrendingUp,
  Award,
  Target,
  Clock,
  ChevronRight,
  Loader2,
  Sparkles,
  Crown,
  Medal,
  Fire
} from "lucide-react";

// Streak Calendar Component
export const StreakCalendar = ({ data, currentStreak, longestStreak }) => {
  const weeks = [];
  const daysInWeek = 7;
  
  // Organize data into weeks
  for (let i = 0; i < data.length; i += daysInWeek) {
    weeks.push(data.slice(i, i + daysInWeek));
  }

  const getDayStatus = (day) => {
    if (day.isFuture) return "future";
    if (day.isToday) return "today";
    if (day.active) return "active";
    return "inactive";
  };

  const dayStyles = {
    future: "bg-slate-100 dark:bg-slate-800 opacity-30",
    today: "bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900 animate-pulse",
    active: "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30",
    inactive: "bg-slate-200 dark:bg-slate-700 text-slate-400"
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentStreak}</p>
              <p className="text-xs text-slate-500">day streak</p>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{longestStreak}</p>
            <p className="text-xs text-slate-500">best streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-400 to-red-500" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIdx) => {
                const status = getDayStatus(day);
                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer hover:scale-110",
                      dayStyles[status]
                    )}
                    title={day.date ? `${day.date}: ${day.activity || status}` : ""}
                  >
                    {day.dayNumber}
                    {status === "active" && (
                      <Flame className="w-3 h-3 absolute -top-1 -right-1 text-orange-500 fill-orange-500" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Streak Milestone Card
export const StreakMilestone = ({ days, reward, achieved, current, icon: Icon }) => {
  return (
    <div className={cn(
      "relative p-4 rounded-xl border-2 transition-all",
      achieved 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700"
        : current
        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          achieved 
            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30"
            : current
            ? "bg-blue-500 text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
        )}>
          {achieved ? <Trophy className="w-7 h-7" /> : <Icon className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-bold text-lg",
              achieved ? "text-amber-900 dark:text-amber-300" : "text-slate-900 dark:text-white"
            )}>
              {days} Day Streak
            </h4>
            {achieved && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Achieved
              </Badge>
            )}
            {current && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Zap className="w-3 h-3 mr-1" />
                In Progress
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">{reward}</p>
        </div>
      </div>
      
      {current && (
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-blue-600">Keep going!</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
      )}
      
      {achieved && (
        <div className="absolute -top-2 -right-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
      )}
    </div>
  );
};

// Daily Check-in Button
export const DailyCheckIn = ({ onCheckIn, checkedInToday, streak, loading }) => {
  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      checkedInToday 
        ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700"
        : "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              checkedInToday
                ? "bg-emerald-500 text-white"
                : "bg-gradient-to-br from-orange-400 to-red-500 text-white animate-pulse"
            )}>
              {checkedInToday ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Flame className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {checkedInToday ? "Checked In Today!" : "Daily Check-in"}
              </h3>
              <p className="text-slate-500">
                {checkedInToday 
                  ? `Come back tomorrow to keep your ${streak} day streak!`
                  : "Check in now to maintain your streak and earn points!"
                }
              </p>
            </div>
          </div>
          <Button
            onClick={onCheckIn}
            disabled={checkedInToday || loading}
            size="lg"
            className={cn(
              "min-w-[140px]",
              checkedInToday 
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : checkedInToday ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Done
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 mr-2" />
                Check In
              </>
            )}
          </Button>
        </div>
        
        {!checkedInToday && (
          <div className="mt-4 flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Don't break your streak! Check in before midnight.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Streak Types List
export const StreakTypesList = ({ streaks }) => {
  const streakTypes = [
    { 
      id: "daily_login", 
      name: "Daily Login", 
      icon: Flame, 
      color: "orange",
      description: "Login every day"
    },
    { 
      id: "attendance", 
      name: "Attendance Streak", 
      icon: CheckCircle2, 
      color: "emerald",
      description: "Mark attendance daily"
    },
    { 
      id: "assignment", 
      name: "Assignment Streak", 
      icon: Target, 
      color: "blue",
      description: "Submit assignments on time"
    },
    { 
      id: "quiz", 
      name: "Quiz Master", 
      icon: Trophy, 
      color: "purple",
      description: "Complete quizzes daily"
    },
    { 
      id: "study", 
      name: "Study Session", 
      icon: Clock, 
      color: "amber",
      description: "Study for 30+ minutes"
    },
  ];

  const getStreakData = (typeId) => {
    return streaks.find(s => s.streak_type === typeId) || { current_streak: 0, longest_streak: 0 };
  };

  const colorClasses = {
    orange: "from-orange-400 to-red-500",
    emerald: "from-emerald-400 to-teal-500",
    blue: "from-blue-400 to-indigo-500",
    purple: "from-purple-400 to-pink-500",
    amber: "from-amber-400 to-yellow-500"
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {streakTypes.map((type) => {
        const data = getStreakData(type.id);
        const Icon = type.icon;
        return (
          <Card key={type.id} className="group hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                  colorClasses[type.color]
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {data.current_streak > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {data.current_streak}
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mt-3">{type.name}</h4>
              <p className="text-sm text-slate-500">{type.description}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Current:</span>{" "}
                  <span className="font-medium">{data.current_streak} days</span>
                </div>
                <div>
                  <span className="text-slate-400">Best:</span>{" "}
                  <span className="font-medium">{data.longest_streak} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Streak Recovery Card
export const StreakRecovery = ({ streakLost, onRecover, recoveryCost }) => {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-300">
              Streak Lost!
            </h3>
            <p className="text-red-700 dark:text-red-400">
              You lost your {streakLost}-day streak. Don't worry, you can recover it!
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Gift className="w-4 h-4" />
            <span>Recovery cost: {recoveryCost} points</span>
          </div>
          <Button onClick={onRecover} variant="outline" className="border-red-300 dark:border-red-700">
            Recover Streak
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Streak System Component
export const StreakSystem = () => {
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      const response = await apiClient.get("/gamification/my-rewards");
      setStreakData(response.data);
      // Check if user checked in today
      const today = new Date().toISOString().split("T")[0];
      const loginStreak = response.data.streaks?.find(s => s.streak_type === "daily_login");
      setCheckedInToday(loginStreak?.last_activity?.startsWith(today) || false);
    } catch (error) {
      toast.error("Failed to load streak data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await apiClient.post("/gamification/check-in");
      toast.success("Checked in successfully! +10 points");
      setCheckedInToday(true);
      fetchStreakData();
    } catch (error) {
      toast.error("Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  // Generate calendar data
  const generateCalendarData = () => {
    const data = [];
    const today = new Date();
    const currentStreak = streakData?.streaks?.[0]?.current_streak || 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      data.push({
        date: dateStr,
        dayNumber: date.getDate(),
        active: i < currentStreak,
        isToday: i === 0,
        isFuture: i < 0
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const loginStreak = streakData?.streaks?.find(s => s.streak_type === "daily_login") || {};
  const calendarData = generateCalendarData();

  return (
    <div className="space-y-6">
      {/* Daily Check-in */}
      <DailyCheckIn
        onCheckIn={handleCheckIn}
        checkedInToday={checkedInToday}
        streak={loginStreak.current_streak || 0}
        loading={checkingIn}
      />

      {/* Streak Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Activity Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakCalendar
            data={calendarData}
            currentStreak={loginStreak.current_streak || 0}
            longestStreak={loginStreak.longest_streak || 0}
          />
        </CardContent>
      </Card>

      {/* Streak Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Streak Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StreakMilestone
            days={7}
            reward="7-Day Streak Badge + 50 Points"
            achieved={(loginStreak.longest_streak || 0) >= 7}
            current={(loginStreak.current_streak || 0) < 7 && (loginStreak.current_streak || 0) > 0}
            icon={Star}
          />
          <StreakMilestone
            days={30}
            reward="Monthly Master Badge + 200 Points"
            achieved={(loginStreak.longest_streak || 0) >= 30}
            current={(loginStreak.current_streak || 0) < 30 && (loginStreak.current_streak || 0) >= 7}
            icon={Medal}
          />
          <StreakMilestone
            days={100}
            reward="Century Champion Badge + 1000 Points"
            achieved={(loginStreak.longest_streak || 0) >= 100}
            current={(loginStreak.current_streak || 0) < 100 && (loginStreak.current_streak || 0) >= 30}
            icon={Crown}
          />
        </CardContent>
      </Card>

      {/* All Streak Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakTypesList streaks={streakData?.streaks || []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StreakSystem;
