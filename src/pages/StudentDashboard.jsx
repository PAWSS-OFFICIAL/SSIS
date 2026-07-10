import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { DashboardSkeleton } from "../components/ui/skeleton";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  Flame
} from "lucide-react";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [upcomingClasswork, setUpcomingClasswork] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [todayDay, setTodayDay] = useState("");
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, coursesRes, gradesRes, classworkRes, todayRes, streakRes] = await Promise.all([
        apiClient.get("/dashboard/stats"),
        apiClient.get("/courses"),
        apiClient.get("/grades"),
        apiClient.get("/classwork"),
        apiClient.get("/timetable/today").catch(() => ({ data: { slots: [] } })),
        apiClient.get("/gamification/my-rewards").catch(() => ({ data: { streaks: [] } }))
      ]);
      setStats(statsRes.data);
      setCourses(coursesRes.data);
      setRecentGrades(gradesRes.data.slice(0, 5));

      // Filter and enhance assignments with days left
      const now = new Date();
      const assignments = classworkRes.data
        .filter(c => c.type === "Assignment" && c.due_date)
        .map(a => {
          const due = new Date(a.due_date);
          const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
          return { ...a, daysLeft };
        })
        .filter(a => a.daysLeft >= 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

      setUpcomingClasswork(assignments);
      setTodayClasses(todayRes.data.slots || []);
      setTodayDay(todayRes.data.today || "");
      setCurrentTime(todayRes.data.current_time || "");
      setStreakData(streakRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] rounded-xl p-6 mb-8 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
        <p className="text-slate-200 mb-4">
          {user?.roll_no && <span className="bg-white/20 px-3 py-1 rounded-full text-sm mr-3">{user.roll_no}</span>}
          {(user?.class_name || user?.section_name) && <span className="text-slate-300">{user.class_name} - Section {user.section_name}</span>}
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300">Enrolled Courses</p>
            <p className="text-2xl font-bold">{stats.enrolled_courses || 0}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300">Average Grade</p>
            <p className="text-2xl font-bold">{stats.average_grade || 0}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300">Attendance</p>
            <p className="text-2xl font-bold">{stats.attendance_rate || 100}%</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <Card className="mb-8 border-l-4 border-l-[#1d3557] bg-[#f7f8fa] hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/student/pylearn'}>
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1d3557] rounded-xl flex items-center justify-center text-white">
              <span className="font-bold text-xl">Py</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Interactive Python Course</h3>
              <p className="text-slate-500 text-sm">Learn Python, complete interactive tasks, and earn a verified certificate!</p>
            </div>
          </div>
          <div className="bg-[#e53e4e] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
            Start Learning <TrendingUp className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Enrolled Courses</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.enrolled_courses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Average Grade</p>
                <div className="flex items-end gap-2">
                  <p className={`text-2xl font-bold ${getGradeColor(stats.average_grade || 0)}`}>
                    {stats.average_grade || 0}%
                  </p>
                </div>
              </div>
            </div>
            <Progress value={stats.average_grade || 0} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Attendance Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.attendance_rate || 100}%</p>
              </div>
            </div>
            <Progress value={stats.attendance_rate || 100} className="mt-4 h-2" />
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="card-hover bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">Daily Streak</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {streakData?.streaks?.find(s => s.streak_type === "daily_login")?.current_streak || 0} days
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              Best: {streakData?.streaks?.find(s => s.streak_type === "daily_login")?.longest_streak || 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Classes & Pending Assignments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Classes */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Today's Classes
              <Badge variant="outline" className="ml-auto">{todayDay}</Badge>
            </CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${slot.is_current
                        ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                        : slot.is_next
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-slate-500">Slot {slot.slot_number}</p>
                      <p className="text-sm font-medium">{slot.start_time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{slot.course_code || slot.course_name}</p>
                      <p className="text-sm text-slate-500">{slot.teacher_name}</p>
                    </div>
                    {slot.is_current && (
                      <Badge className="bg-green-500 text-white">Now</Badge>
                    )}
                    {slot.is_next && (
                      <Badge variant="outline" className="border-blue-400 text-blue-600">Next</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No classes scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Pending Assignments
              {upcomingClasswork.length > 0 && (
                <Badge className="ml-auto bg-amber-500">{upcomingClasswork.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Upcoming assignments with deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingClasswork.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasswork.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${assignment.daysLeft <= 1
                        ? 'bg-red-50 border-red-200'
                        : assignment.daysLeft <= 3
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{assignment.title}</p>
                      <p className="text-sm text-slate-500">{assignment.course_name}</p>
                    </div>
                    <Badge
                      variant={assignment.daysLeft <= 1 ? "destructive" : assignment.daysLeft <= 3 ? "warning" : "secondary"}
                      className={
                        assignment.daysLeft <= 1
                          ? 'bg-red-500'
                          : assignment.daysLeft <= 3
                            ? 'bg-amber-500 text-white'
                            : ''
                      }
                    >
                      {assignment.daysLeft === 0
                        ? 'Due Today!'
                        : assignment.daysLeft === 1
                          ? '1 day left'
                          : `${assignment.daysLeft} days left`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No pending assignments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1a365d]" />
              My Courses
            </CardTitle>
            <CardDescription>Courses you are enrolled in this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.length > 0 ? courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#1a365d]/10 rounded-lg">
                      <BookOpen className="w-5 h-5 text-[#1a365d]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{course.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{course.code}</Badge>
                        <span className="text-xs text-slate-500">{course.credits} Credits</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{course.teacher_name || "TBA"}</span>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-8">No courses enrolled yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#1a365d]" />
              Recent Grades
            </CardTitle>
            <CardDescription>Your latest graded assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrades.length > 0 ? recentGrades.map((grade) => {
                const percentage = (grade.score / grade.max_score) * 100;
                return (
                  <div key={grade.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{grade.assignment_name}</p>
                      <p className="text-sm text-slate-500">{grade.course_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                        {grade.score}/{grade.max_score}
                      </p>
                      <p className="text-xs text-slate-500">{percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-center py-8">No grades yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1a365d]" />
            Upcoming Assignments
          </CardTitle>
          <CardDescription>Assignments due soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingClasswork.length > 0 ? upcomingClasswork.map((work) => (
              <Card key={work.id} className="card-hover border-l-4 border-l-[#f59e0b]">
                <CardContent className="pt-4">
                  <Badge className="bg-amber-100 text-amber-700 mb-2">{work.type}</Badge>
                  <h4 className="font-medium text-slate-900">{work.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{work.course_name}</p>
                  {work.due_date && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(work.due_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <p className="text-slate-500 col-span-full text-center py-8">No upcoming assignments</p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
