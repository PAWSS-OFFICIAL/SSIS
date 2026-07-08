import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Save,
  Calendar,
  Search
} from "lucide-react";

export const AttendancePage = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "Teacher";
  const isAdmin = user?.role === "Admin";
  const isStaff = isAdmin || isTeacher;

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Selection States
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Students & Existing Attendance Status
  const [roster, setRoster] = useState([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);

  // Student/Parent specific states
  const [studentHistory, setStudentHistory] = useState([]);

  // Load classes initially
  useEffect(() => {
    if (isStaff) {
      const fetchClasses = async () => {
        try {
          const res = await apiClient.get(`/classes?t=${new Date().getTime()}`);
          setClasses(res.data);
        } catch (e) {
          toast.error("Failed to load classes.");
        }
      };
      fetchClasses();
    } else {
      // Student / Parent history
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await apiClient.get("/attendance");
          setStudentHistory(res.data);
        } catch (e) {
          toast.error("Failed to fetch attendance history.");
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isStaff]);

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const fetchSections = async () => {
        try {
          const res = await apiClient.get(`/classes/${selectedClassId}/sections`);
          setSections(res.data);
        } catch (e) {
          toast.error("Failed to load sections.");
        }
      };
      fetchSections();
    } else {
      setSections([]);
    }
    setSelectedSectionId("");
    setSelectedCourseId("");
    setRoster([]);
    setAttendanceLoaded(false);
    setExistingRecord(null);
  }, [selectedClassId]);

  // Fetch courses when class + section changes
  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      const fetchCourses = async () => {
        try {
          const res = await apiClient.get(`/courses?class_id=${selectedClassId}&section_id=${selectedSectionId}`);
          setCourses(res.data);
        } catch (e) {
          toast.error("Failed to load subjects.");
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
    }
    setSelectedCourseId("");
    setRoster([]);
    setAttendanceLoaded(false);
    setExistingRecord(null);
  }, [selectedClassId, selectedSectionId]);

  const handleLoadRoster = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedCourseId || !selectedDate) {
      toast.error("Please select all filters.");
      return;
    }
    setLoading(true);
    setRoster([]);
    setExistingRecord(null);
    setAttendanceLoaded(false);

    try {
      // 1. Fetch Students
      const studentsRes = await apiClient.get(`/users?role=Student&class_id=${selectedClassId}&section_id=${selectedSectionId}`);
      const students = studentsRes.data;

      if (students.length === 0) {
        toast.warning("No students enrolled in this section.");
        setLoading(false);
        return;
      }

      // 2. Check if attendance already exists
      const checkRes = await apiClient.get(`/attendance/check`, {
        params: {
          class_id: selectedClassId,
          section_id: selectedSectionId,
          course_id: selectedCourseId,
          date: selectedDate
        }
      });

      if (checkRes.data.exists) {
        const record = checkRes.data.record;
        setExistingRecord(record);
        
        let parsedRecords = record.records;
        if (typeof parsedRecords === "string") {
          parsedRecords = JSON.parse(parsedRecords);
        }

        // Map existing statuses to roster
        const mappedRoster = students.map(s => {
          const prev = parsedRecords.find(pr => pr.student_id === s.id);
          return {
            id: s.id,
            name: s.name,
            roll_number: s.roll_number || s.idno,
            present: prev ? prev.status.toLowerCase() === "present" : true
          };
        });
        setRoster(mappedRoster);
        toast.info("Attendance already taken. Editing mode active.");
      } else {
        // Default to present
        const mappedRoster = students.map(s => ({
          id: s.id,
          name: s.name,
          roll_number: s.roll_number || s.idno,
          present: true // Default to Present for easy entry
        }));
        setRoster(mappedRoster);
        toast.success("Roster loaded. Mark attendance below.");
      }
      setAttendanceLoaded(true);
    } catch (e) {
      toast.error("Failed to load roster.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (studentId) => {
    setRoster(prev => prev.map(s => s.id === studentId ? { ...s, present: !s.present } : s));
  };

  const handleToggleAll = (val) => {
    setRoster(prev => prev.map(s => ({ ...s, present: val })));
  };

  const handleSaveAttendance = async () => {
    if (roster.length === 0) return;
    setLoading(true);
    try {
      const activeCourse = courses.find(c => c.id.toString() === selectedCourseId);
      
      const payload = {
        course_id: parseInt(selectedCourseId),
        course_name: activeCourse?.name || "Subject",
        class_id: parseInt(selectedClassId),
        section_id: parseInt(selectedSectionId),
        date: selectedDate,
        records: roster.map(s => ({
          student_id: s.id,
          status: s.present ? "Present" : "Absent"
        }))
      };

      await apiClient.post("/attendance", payload);
      toast.success(existingRecord ? "Attendance updated & audited successfully." : "Attendance marked successfully.");
      handleLoadRoster(); // Reload state
    } catch (e) {
      toast.error("Failed to save attendance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Attendance Register</h1>
          <p className="text-slate-500 mt-1">
            {isStaff ? "Track daily student presence, log attendance, and audit overrides." : "View your logged attendance record calendar."}
          </p>
        </div>

        {isStaff ? (
          <div className="space-y-6">
            {/* Filter Card */}
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
                <div className="flex-1 min-w-[150px] space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <Button onClick={handleLoadRoster} className="bg-[#1a365d] hover:bg-[#102a43] gap-1.5" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Load Sheet
                </Button>
              </CardContent>
            </Card>

            {/* Roster & Checkbox Sheet */}
            {attendanceLoaded && (
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Attendance Sheet
                    </CardTitle>
                    <CardDescription>Mark Present / Absent. Default is set to Present.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleAll(true)}>Select All</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleAll(false)}>Deselect All</Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {existingRecord && (
                    <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm">Attendance Already Taken</h4>
                        <p className="text-xs text-amber-700 mt-1">
                          This register has already been marked. Any changes will overwrite the previous record.
                          {existingRecord.editor_name && ` Last edited by Teacher ${existingRecord.editor_name}.`}
                        </p>
                      </div>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="w-28 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map(student => (
                        <TableRow key={student.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-slate-800">{student.roll_number || "-"}</TableCell>
                          <TableCell className="font-medium text-slate-700">{student.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={student.present}
                                onCheckedChange={() => handleToggleStatus(student.id)}
                                className="w-5 h-5 border-2"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <Button onClick={handleSaveAttendance} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {existingRecord ? "Save Changes (Audit)" : "Submit Attendance"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        ) : (
          /* STUDENT / PARENT HISTORIC LIST VIEW */
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Logged History
              </CardTitle>
              <CardDescription>
                {user.role === "Parent" ? `Attendance records for child: ${user.student_name}` : "Your daily attendance log records."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" /></div>
              ) : studentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-32 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentHistory.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-slate-800">{item.date}</TableCell>
                        <TableCell className="font-medium text-slate-700">{item.course_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.status.toLowerCase() === "present" ? "success" : "destructive"}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-slate-400">No attendance logs registered yet.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
