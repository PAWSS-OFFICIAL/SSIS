import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  GraduationCap,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plus,
  Save,
  Search,
  FileSpreadsheet
} from "lucide-react";

export const GradesPage = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "Teacher";
  const isAdmin = user?.role === "Admin";
  const isStaff = isAdmin || isTeacher;

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Marks Entry setup states
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  const [roster, setRoster] = useState([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchGrades = useCallback(async () => {
    try {
      const res = await apiClient.get("/grades");
      setGrades(res.data);
    } catch (error) {
      toast.error("Failed to fetch grades");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get(`/classes?t=${new Date().getTime()}`);
      setClasses(res.data);
    } catch (e) {
      console.error("Failed to load classes", e);
    }
  };

  useEffect(() => {
    fetchGrades();
    if (isStaff) {
      fetchClasses();
    }
  }, [fetchGrades, isStaff]);

  useEffect(() => {
    if (selectedClassId) {
      const fetchSections = async () => {
        try {
          const res = await apiClient.get(`/classes/${selectedClassId}/sections`);
          setSections(res.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchSections();
    } else {
      setSections([]);
    }
    setSelectedSectionId("");
    setSelectedCourseId("");
    setRoster([]);
    setRosterLoaded(false);
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      const fetchCourses = async () => {
        try {
          const res = await apiClient.get(`/courses?class_id=${selectedClassId}&section_id=${selectedSectionId}`);
          setCourses(res.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
    }
    setSelectedCourseId("");
    setRoster([]);
    setRosterLoaded(false);
  }, [selectedClassId, selectedSectionId]);

  const handleLoadRoster = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedCourseId) {
      toast.error("Please select class, section, and subject.");
      return;
    }
    setLoading(true);
    setRoster([]);
    setRosterLoaded(false);
    try {
      const res = await apiClient.get(`/users?role=Student&class_id=${selectedClassId}&section_id=${selectedSectionId}`);
      if (res.data.length === 0) {
        toast.warning("No students found in this section.");
      } else {
        setRoster(res.data.map(s => ({
          student_id: s.id,
          name: s.name,
          roll_number: s.roll_number || s.idno,
          marks: ""
        })));
        setRosterLoaded(true);
      }
    } catch (e) {
      toast.error("Failed to load student roster.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, marks: value } : s));
  };

  const handleSubmitGrades = async (e) => {
    e.preventDefault();
    if (!testTitle.trim() || !maxMarks || roster.length === 0) {
      toast.error("Please fill in test title and maximum marks.");
      return;
    }
    
    // Validate grades input
    if (roster.some(s => s.marks === "" || isNaN(parseFloat(s.marks)))) {
      toast.error("Please enter a numeric score for all students.");
      return;
    }

    const limit = parseFloat(maxMarks);
    if (roster.some(s => parseFloat(s.marks) < 0 || parseFloat(s.marks) > limit)) {
      toast.error(`Scores cannot be negative or exceed maximum marks (${limit}).`);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/grades/bulk", {
        course_id: parseInt(selectedCourseId),
        title: testTitle,
        max_marks: limit,
        marks: roster.map(s => ({
          student_id: s.student_id,
          marks: parseFloat(s.marks)
        }))
      });
      toast.success("Marks submitted successfully!");
      setTestTitle("");
      setRoster([]);
      setRosterLoaded(false);
      fetchGrades(); // Refresh feed
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit marks.");
    } finally {
      setSubmitting(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "bg-emerald-100 text-emerald-700";
    if (percentage >= 75) return "bg-blue-100 text-blue-700";
    if (percentage >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const average = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / grades.length
    : 0;

  const gradesByCourse = grades.reduce((acc, grade) => {
    const key = grade.course_name || grade.course_code;
    if (!acc[key]) acc[key] = [];
    acc[key].push(grade);
    return acc;
  }, {});

  if (loading && !rosterLoaded) {
    return (
      <DashboardLayout title="Grades">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Grades">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Grades & Marks</h1>
          <p className="text-slate-500 mt-1">Manage tests, assignment scores, and student academic performance reports.</p>
        </div>

        {/* Student/Parent View */}
        {(user?.role === "Student" || user?.role === "Parent") && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {grades.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Overall Average</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{average.toFixed(1)}%</p>
                      </div>
                      <div className={`p-3 rounded-full ${average >= 75 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                        {average >= 75 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 font-medium font-medium">Evaluations Graded</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{grades.length}</p>
                      </div>
                      <div className="p-3 bg-purple-50 text-purple-600 border border-purple-100 rounded-full">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Letter Grade Equivalent</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{getGradeLetter(average)}</p>
                      </div>
                      <Badge className={`text-sm px-3 py-1.5 ${getGradeColor(average)}`}>
                        {average >= 60 ? "Passing Status" : "Needs Review"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">No grades recorded yet.</div>
            )}

            {/* Historic grades by Course */}
            {Object.entries(gradesByCourse).map(([courseName, courseGrades]) => {
              const courseAvg = courseGrades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / courseGrades.length;
              return (
                <Card key={courseName} className="border border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div>
                      <CardTitle>{courseName}</CardTitle>
                      <CardDescription>{courseGrades.length} evaluations recorded</CardDescription>
                    </div>
                    <Badge className={`${getGradeColor(courseAvg)} text-base px-3 py-1`}>
                      Course Avg: {courseAvg.toFixed(1)}%
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test / Assignment Name</TableHead>
                          <TableHead className="text-right">Marks Secured</TableHead>
                          <TableHead className="text-right">Max Marks</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseGrades.map((grade) => {
                          const percentage = (grade.score / grade.max_score) * 100;
                          return (
                            <TableRow key={grade.id}>
                              <TableCell className="font-semibold text-slate-800">{grade.assignment_name}</TableCell>
                              <TableCell className="text-right font-bold text-slate-850">{grade.score}</TableCell>
                              <TableCell className="text-right text-slate-500">{grade.max_score}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={getGradeColor(percentage)}>
                                  {percentage.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Admin / Teacher View */}
        {isStaff && (
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="list"><FileSpreadsheet className="w-4 h-4 mr-2" /> Grades Roster</TabsTrigger>
              <TabsTrigger value="entry"><Plus className="w-4 h-4 mr-2" /> Marks Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Graded Registry</CardTitle>
                  <CardDescription>Master roster of all subject evaluations entered in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Test Title</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade) => {
                        const percentage = (grade.score / grade.max_score) * 100;
                        return (
                          <TableRow key={grade.id}>
                            <TableCell className="font-semibold text-slate-850">{grade.student_name}</TableCell>
                            <TableCell className="font-medium text-slate-500">{grade.roll_no || "-"}</TableCell>
                            <TableCell className="font-medium text-slate-700">{grade.course_name}</TableCell>
                            <TableCell className="text-slate-600">{grade.assignment_name}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={getGradeColor(percentage)}>
                                {grade.score} / {grade.max_score}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {grades.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400">No grades registered yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entry" className="space-y-6">
              {/* filters selection card */}
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[150px] space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger><SelectValue placeholder="Choose Class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px] space-y-2">
                    <Label>Section</Label>
                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                      <SelectTrigger><SelectValue placeholder="Choose Section" /></SelectTrigger>
                      <SelectContent>
                        {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>Section {s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={!selectedSectionId}>
                      <SelectTrigger><SelectValue placeholder="Choose Subject" /></SelectTrigger>
                      <SelectContent>
                        {courses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.code} - {c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleLoadRoster} className="bg-[#1a365d] hover:bg-[#102a43] gap-1.5" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Load Class
                  </Button>
                </CardContent>
              </Card>

              {/* roster table */}
              {rosterLoaded && (
                <Card className="border border-slate-200 shadow-sm">
                  <form onSubmit={handleSubmitGrades}>
                    <CardHeader className="border-b">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="testTitle">Evaluation Title</Label>
                          <Input
                            id="testTitle"
                            placeholder="E.g. Unit Test I, Term Examination"
                            value={testTitle}
                            onChange={e => setTestTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxMarks">Maximum Marks</Label>
                          <Input
                            id="maxMarks"
                            type="number"
                            placeholder="100"
                            value={maxMarks}
                            onChange={e => setMaxMarks(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="w-40">Obtained Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roster.map((student) => (
                            <TableRow key={student.student_id}>
                              <TableCell className="font-semibold text-slate-800">{student.roll_number || "-"}</TableCell>
                              <TableCell className="font-medium text-slate-700">{student.name}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.5"
                                  placeholder={`Max: ${maxMarks}`}
                                  value={student.marks}
                                  onChange={e => handleMarkChange(student.student_id, e.target.value)}
                                  required
                                  className="w-full text-center"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-end">
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Submit Marks Sheet
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};
