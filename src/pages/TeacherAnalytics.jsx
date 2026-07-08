import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DashboardSkeleton, StatCardSkeleton } from "../components/ui/skeleton";
import { ProgressRing, BarChart, LineChart, StatsCard, Heatmap } from "../components/ui/charts";
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";

export const TeacherAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get("/analytics/teacher-dashboard");
      setAnalytics(response.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics Dashboard">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const courses = analytics?.courses_analytics || [];
  const selectedCourseData = selectedCourse === "all" 
    ? null 
    : courses.find(c => c.course_id.toString() === selectedCourse);

  const displayData = selectedCourseData || {
    enrolled_students: courses.reduce((acc, c) => acc + c.enrolled_students, 0),
    assignment_completion_rate: courses.reduce((acc, c) => acc + c.assignment_completion_rate, 0) / courses.length,
    average_grade: courses.reduce((acc, c) => acc + c.average_grade, 0) / courses.length,
    at_risk_count: courses.reduce((acc, c) => acc + c.at_risk_count, 0),
    at_risk_students: courses.flatMap(c => c.at_risk_students || []),
    quiz_performance: courses.flatMap(c => c.quiz_performance || []),
  };

  // Sample data for charts
  const gradeTrendData = [
    { label: "Week 1", value: 72 },
    { label: "Week 2", value: 75 },
    { label: "Week 3", value: 74 },
    { label: "Week 4", value: 78 },
    { label: "Week 5", value: 80 },
    { label: "Week 6", value: 82 },
  ];

  const attendanceData = [
    { label: "Mon", value: 85 },
    { label: "Tue", value: 90 },
    { label: "Wed", value: 88 },
    { label: "Thu", value: 92 },
    { label: "Fri", value: 87 },
  ];

  const courseComparisonData = courses.map(c => ({
    label: c.course_code || c.course_name.substring(0, 10),
    value: c.average_grade,
  }));

  return (
    <DashboardLayout title="Analytics Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Learning Analytics
          </h1>
          <p className="text-slate-500">
            Track student performance and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.course_id} value={course.course_id.toString()}>
                  {course.course_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Students"
          value={displayData.enrolled_students}
          change="+12%"
          changeType="positive"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Avg Grade"
          value={`${Math.round(displayData.average_grade)}%`}
          change="+5%"
          changeType="positive"
          icon={GraduationCap}
          color="green"
          chartData={gradeTrendData}
        />
        <StatsCard
          title="Assignment Completion"
          value={`${Math.round(displayData.assignment_completion_rate)}%`}
          change="-2%"
          changeType="negative"
          icon={BookOpen}
          color="amber"
        />
        <StatsCard
          title="At-Risk Students"
          value={displayData.at_risk_count}
          change="Needs attention"
          changeType="neutral"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grade Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Grade Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={gradeTrendData} height={200} />
          </CardContent>
        </Card>

        {/* Attendance by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Attendance by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={attendanceData} 
              maxValue={100} 
              height={200}
              barColor="#10b981"
            />
          </CardContent>
        </Card>
      </div>

      {/* Course Comparison & At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Course Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Average grades by course</CardDescription>
          </CardHeader>
          <CardContent>
            {courseComparisonData.length > 0 ? (
              <BarChart 
                data={courseComparisonData} 
                maxValue={100} 
                height={200}
                barColor="#3b82f6"
              />
            ) : (
              <p className="text-center text-slate-500 py-8">No course data available</p>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              At-Risk Students
            </CardTitle>
            <CardDescription>Students needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            {displayData.at_risk_students?.length > 0 ? (
              <div className="space-y-3">
                {displayData.at_risk_students.slice(0, 5).map((student, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-300 font-medium">
                          {student.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {student.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Avg: {Math.round(student.avg_grade || 0)}%
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">At Risk</Badge>
                  </div>
                ))}
                {displayData.at_risk_students.length > 5 && (
                  <Button variant="ghost" className="w-full">
                    View all {displayData.at_risk_students.length} students
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-medium">No at-risk students</p>
                <p className="text-sm">All students are performing well!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quiz Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quiz Performance</CardTitle>
          <CardDescription>Average scores by quiz</CardDescription>
        </CardHeader>
        <CardContent>
          {displayData.quiz_performance?.length > 0 ? (
            <div className="space-y-4">
              {displayData.quiz_performance.map((quiz, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{quiz.title}</span>
                    <span className="text-sm text-slate-500">
                      {quiz.attempts} attempts
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min((quiz.avg_score || 0) * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {Math.round(quiz.avg_score || 0)}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No quiz data available</p>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayData.at_risk_count > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900 dark:text-amber-300">
                    {displayData.at_risk_count} students are at risk
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Consider scheduling extra support sessions or providing additional resources.
                  </p>
                </div>
                <Button size="sm" variant="outline">View Details</Button>
              </div>
            )}
            {displayData.assignment_completion_rate < 80 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-300">
                    Low assignment completion rate
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Current rate is {Math.round(displayData.assignment_completion_rate)}%. Send reminders to students.
                  </p>
                </div>
                <Button size="sm" variant="outline">Send Reminders</Button>
              </div>
            )}
            {displayData.at_risk_count === 0 && displayData.assignment_completion_rate >= 80 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 dark:text-emerald-300">
                    Great job! Your class is performing well.
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                    Keep up the good work. Consider sharing best practices with other teachers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
