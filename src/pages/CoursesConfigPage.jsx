import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Trash2, Plus, BookOpen, GraduationCap, ShieldAlert } from "lucide-react";

export const CoursesConfigPage = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");

  const [courses, setCourses] = useState([]);
  const [classTeacher, setClassTeacher] = useState(null);

  // New course form
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTeacherId, setNewCourseTeacherId] = useState("");
  
  // Assign class teacher select
  const [newClassTeacherId, setNewClassTeacherId] = useState("");

  const fetchData = async () => {
    try {
      const [classesRes, teachersRes] = await Promise.all([
        apiClient.get(`/classes?t=${new Date().getTime()}`),
        apiClient.get("/users?role=Teacher")
      ]);
      setClasses(classesRes.data);
      setTeachers(teachersRes.data);
    } catch (e) {
      toast.error("Failed to load setup data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSections = async (classId) => {
    try {
      const res = await apiClient.get(`/classes/${classId}/sections`);
      setSections(res.data);
    } catch (e) {
      toast.error("Failed to load sections.");
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedClassId !== "all") {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
    }
    setCourses([]);
    setClassTeacher(null);
    setSelectedSectionId("all");
  }, [selectedClassId]);

  const fetchCoursesAndClassTeacher = async () => {
    if (selectedClassId === "all" || selectedSectionId === "all") return;
    try {
      const [coursesRes, ctRes] = await Promise.all([
        apiClient.get(`/courses?class_id=${selectedClassId}&section_id=${selectedSectionId}`),
        apiClient.get(`/courses/class-teacher?class_id=${selectedClassId}&section_id=${selectedSectionId}`)
      ]);
      setCourses(coursesRes.data);
      setClassTeacher(ctRes.data);
      if (ctRes.data) {
        setNewClassTeacherId(ctRes.data.teacher_id.toString());
      } else {
        setNewClassTeacherId("");
      }
    } catch (e) {
      toast.error("Failed to load courses data.");
    }
  };

  useEffect(() => {
    fetchCoursesAndClassTeacher();
  }, [selectedClassId, selectedSectionId]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName || !newCourseCode || !newCourseTeacherId) {
      toast.error("Please fill in all course fields.");
      return;
    }
    try {
      await apiClient.post("/courses", {
        name: newCourseName,
        code: newCourseCode,
        class_id: parseInt(selectedClassId),
        section_id: parseInt(selectedSectionId),
        teacher_id: parseInt(newCourseTeacherId),
        description: "",
        credits: 0
      });
      toast.success("Subject added successfully.");
      setNewCourseName("");
      setNewCourseCode("");
      setNewCourseTeacherId("");
      fetchCoursesAndClassTeacher();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add subject.");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to remove this subject?")) return;
    try {
      await apiClient.delete(`/courses/${courseId}`);
      toast.success("Subject removed.");
      fetchCoursesAndClassTeacher();
    } catch (e) {
      toast.error("Failed to remove subject.");
    }
  };

  const handleAssignClassTeacher = async (e) => {
    e.preventDefault();
    if (!newClassTeacherId) return;
    try {
      await apiClient.post("/courses/assign-class-teacher", {
        class_id: parseInt(selectedClassId),
        section_id: parseInt(selectedSectionId),
        teacher_id: parseInt(newClassTeacherId)
      });
      toast.success("Class Teacher assigned successfully.");
      fetchCoursesAndClassTeacher();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to assign Class Teacher.");
    }
  };

  return (
    <DashboardLayout role="Admin">
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Courses Config</h1>
            <p className="text-slate-500 mt-1">Assign subjects, subject teachers, and Class Teachers per class and section.</p>
          </div>
        </div>

        {/* Selection Card */}
        <Card className="border border-slate-200 shadow-sm mb-8">
          <CardContent className="pt-6 flex gap-4">
            <div className="flex-1 max-w-xs space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Choose Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select a Class</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 max-w-xs space-y-2">
              <Label>Select Section</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={selectedClassId === "all"}>
                <SelectTrigger><SelectValue placeholder="Choose Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select a Section</SelectItem>
                  {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>Section {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedClassId !== "all" && selectedSectionId !== "all" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column - Subjects management */}
            <div className="lg:col-span-2 space-y-8">
              {/* Subjects List */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Subjects Assigned
                  </CardTitle>
                  <CardDescription>All subjects scheduled for this specific class and section.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Code</TableHead>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Subject Teacher</TableHead>
                        <TableHead className="w-20 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map(course => (
                        <TableRow key={course.id}>
                          <TableCell className="font-semibold text-slate-800">{course.code}</TableCell>
                          <TableCell className="font-medium text-slate-700">{course.name}</TableCell>
                          <TableCell className="text-slate-600">{course.teacher_name || "Unassigned"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteCourse(course.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {courses.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">No subjects assigned yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Add Subject Card */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Subject Name</Label>
                      <Input placeholder="E.g. Mathematics" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Code</Label>
                      <Input placeholder="E.g. MATH101" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Teacher</Label>
                      <Select value={newCourseTeacherId} onValueChange={setNewCourseTeacherId}>
                        <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3 mt-2">
                      <Button type="submit" className="w-full bg-[#1a365d] hover:bg-[#102a43]"><Plus className="w-4 h-4 mr-2" /> Add Subject</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Class Teacher Assign */}
            <div>
              <Card className="border border-slate-200 shadow-sm sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#1a365d]" />
                    Class Teacher
                  </CardTitle>
                  <CardDescription>Every section must have one designated Class Teacher.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {classTeacher ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col items-center text-center">
                      <span className="p-3 bg-emerald-100 rounded-full mb-3 text-emerald-700">
                        <GraduationCap className="w-6 h-6" />
                      </span>
                      <h4 className="font-bold text-slate-800 text-lg">{classTeacher.teacher_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Assigned Class Teacher</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 flex gap-3">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm">Class Teacher Required</h4>
                        <p className="text-xs text-amber-700 mt-1">No teacher has been assigned to this section yet.</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleAssignClassTeacher} className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <Label>Assign New Class Teacher</Label>
                      <Select value={newClassTeacherId} onValueChange={setNewClassTeacherId}>
                        <SelectTrigger><SelectValue placeholder="Choose Teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-[#1a365d] hover:bg-[#102a43]" disabled={!newClassTeacherId}>
                      Save Assignment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 border border-dashed border-slate-300 rounded-lg text-slate-500">
            <BookOpen className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="font-semibold text-lg text-slate-700">Select Class & Section</h3>
            <p className="text-sm mt-1 text-slate-500">Please choose a class and section from the dropdowns above to manage courses.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
