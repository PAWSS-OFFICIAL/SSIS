import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [loading, setLoading] = useState(true);

  // Detail View State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedClassId !== "all") {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
    }
    fetchUsers();
  }, [selectedClassId, selectedSectionId]);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get(`/classes?t=${new Date().getTime()}`);
      setClasses(res.data);
    } catch (e) {
      toast.error("Failed to load classes");
    }
  };

  const fetchSections = async (classId) => {
    try {
      const res = await apiClient.get(`/classes/${classId}/sections`);
      setSections(res.data);
    } catch (e) {
      toast.error("Failed to load sections");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClassId !== "all") params.class_id = selectedClassId;
      if (selectedSectionId !== "all") params.section_id = selectedSectionId;
      
      const res = await apiClient.get("/users", { params });
      setUsers(res.data);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (studentId) => {
    try {
      const [studentRes, gradesRes] = await Promise.all([
        apiClient.get(`/users/${studentId}`),
        apiClient.get(`/grades?student_id=${studentId}`)
      ]);
      const studentData = studentRes.data;
      studentData.grades = gradesRes.data;
      setSelectedStudent(studentData);
    } catch (e) {
      toast.error("Failed to load student details");
    }
  };

  const handleSelectTeacher = async (teacherId) => {
    try {
      const [teacherRes, timetableRes] = await Promise.all([
        apiClient.get(`/users/${teacherId}`),
        apiClient.get(`/timetable/teacher/${teacherId}`)
      ]);
      const teacherData = teacherRes.data;
      teacherData.timetable = timetableRes.data;
      setSelectedTeacher(teacherData);
    } catch (e) {
      toast.error("Failed to load teacher details");
    }
  };

  const students = users.filter(u => u.role === "Student");
  const teachers = users.filter(u => u.role === "Teacher");

  return (
    <DashboardLayout role="Admin">
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <h1 className="text-3xl font-bold mb-8 text-slate-800">User Management</h1>
        
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="students" className="px-6 py-2.5">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="teachers" className="px-6 py-2.5">Teachers ({teachers.length})</TabsTrigger>
          </TabsList>
 
          <TabsContent value="students">
            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-6">
                  <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedSectionId("all"); }}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
 
                  <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={selectedClassId === "all"}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Sections" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>Section {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
 
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Parent Contact (Primary)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-slate-50/80 transition-colors" onClick={() => handleSelectStudent(s.id)}>
                        <TableCell className="font-medium text-slate-900">{s.roll_number || "-"}</TableCell>
                        <TableCell className="text-slate-700 font-medium">{s.name}</TableCell>
                        <TableCell className="text-slate-600">{s.class_name || "-"}</TableCell>
                        <TableCell className="text-slate-600">{s.section_name || "-"}</TableCell>
                        <TableCell className="text-slate-600">
                          {s.parent_name ? (
                            <span className="inline-flex flex-col">
                              <span className="font-medium text-slate-800">{s.parent_name}</span>
                              <span className="text-xs text-slate-500">{s.parent_phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Unlinked</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {students.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400">No students found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
 
          <TabsContent value="teachers">
            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subjects Taught</TableHead>
                      <TableHead>Class Teacher Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(t => (
                      <TableRow key={t.id} className="cursor-pointer hover:bg-slate-50/80 transition-colors" onClick={() => handleSelectTeacher(t.id)}>
                        <TableCell className="font-medium text-slate-900">{t.name}</TableCell>
                        <TableCell className="text-slate-600">{t.email}</TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">{t.subjects_taught || <span className="text-slate-400">None assigned</span>}</TableCell>
                        <TableCell>
                          {t.class_teacher_for ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Class Teacher ({t.class_teacher_for})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Subject Teacher
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {teachers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">No teachers found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
 
        {/* Student Detail Modal */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800 border-b pb-2">Student Details: {selectedStudent?.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              {/* General Student Info */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Roll Number</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedStudent?.roll_no || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Class & Section</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedStudent?.class_name ? `${selectedStudent.class_name} - ${selectedStudent.section_name}` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gender</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedStudent?.gender || "-"}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Date of Birth</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedStudent?.date_of_birth || "-"}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Blood Group</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedStudent?.blood_group || "-"}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Date of Admission</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedStudent?.date_of_admission || "-"}</p>
                </div>
                <div className="mt-3 col-span-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Address</p>
                  <p className="text-sm text-slate-800 mt-0.5">{selectedStudent?.address || "-"}</p>
                </div>
              </div>

              {/* Parent/Guardian Contacts */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b pb-1">Parent & Guardian Contacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedStudent?.parents && selectedStudent.parents.map(p => (
                    <div key={p.id} className="bg-slate-50/60 border border-slate-200/80 p-3 rounded-lg relative">
                      {p.is_primary_contact === 1 && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-semibold bg-[#1a365d] text-white rounded">Primary</span>
                      )}
                      <p className="text-xs font-semibold text-[#1a365d]">{p.relationship}</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{p.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Phone: {p.phone || "-"}</p>
                      <p className="text-xs text-slate-600">Email: {p.email || "-"}</p>
                    </div>
                  ))}
                  {(!selectedStudent?.parents || selectedStudent.parents.length === 0) && (
                    <p className="text-sm text-slate-400 italic col-span-3">No parent contacts registered.</p>
                  )}
                </div>
              </div>
              
              {/* Last Exam Results */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b pb-1">Last Exam Results</h3>
                {selectedStudent?.grades && selectedStudent.grades.length > 0 ? (
                  <Table className="border rounded-md overflow-hidden">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Exam/Assignment</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Marks Obtained</TableHead>
                        <TableHead className="text-right">Max Marks</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.grades.map(g => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.assignment_name}</TableCell>
                          <TableCell>{g.course_name}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-800">{g.score}</TableCell>
                          <TableCell className="text-right">{g.max_score}</TableCell>
                          <TableCell className="text-right font-medium text-blue-600">
                            {((g.score / g.max_score) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-slate-400 italic">No exams recorded yet for this student.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
 
        {/* Teacher Detail Modal */}
        <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800 border-b pb-2">Teacher Details: {selectedTeacher?.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedTeacher?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Class Teacher Status</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {selectedTeacher?.class_teacher_for ? `Class Teacher for ${selectedTeacher.class_teacher_for}` : "Subject Teacher"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b pb-1">Weekly Teaching Load</h3>
                {selectedTeacher?.timetable && selectedTeacher.timetable.length > 0 ? (
                  <Table className="border rounded-md overflow-hidden">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Class & Section</TableHead>
                        <TableHead>Subject</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTeacher.timetable.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold text-slate-700">{t.day_of_week}</TableCell>
                          <TableCell>Period {t.period_number}</TableCell>
                          <TableCell className="font-medium">{t.class_name} - {t.section_name}</TableCell>
                          <TableCell className="text-blue-600 font-medium">{t.subject_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-slate-400 italic">No timetable entries assigned to this teacher yet.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
 
      </div>
    </DashboardLayout>
  );
};
