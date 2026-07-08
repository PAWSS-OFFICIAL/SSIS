
import React, { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  QrCode,
  Scan,
  Users,
  Download,
  Save,
  RefreshCcw,
  Maximize2
} from "lucide-react";
import QRCode from "react-qr-code";
import { QrReader } from "react-qr-reader";
import * as XLSX from 'xlsx';

// Helper: Countdown Timer
const CountdownTimer = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(targetDate);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  return <span className="font-mono text-xl font-bold text-red-600">{timeLeft}</span>;
};

export const AttendancePage = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "Teacher";
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  // Teacher State: Session
  const [sessionForm, setSessionForm] = useState({
    department: "",
    year: "",
    course_id: "",
    radius: "50" // Default radius, though logic relies on QR mostly
  });
  const [activeSession, setActiveSession] = useState(null);
  const [liveStudents, setLiveStudents] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, distinct_present: 0 });

  // Student State: Marking
  const [scanResult, setScanResult] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [marking, setMarking] = useState(false);

  // Initial Data Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const coursesRes = await apiClient.get("/courses");
        setCourses(coursesRes.data);

        // Check for existing active session
        const sessionRes = await apiClient.get("/attendance/active-sessions");
        if (sessionRes.data && sessionRes.data.length > 0) {
          // Resume the first active session
          const session = sessionRes.data[0];
          setActiveSession(session);
          setSessionForm(prev => ({
            ...prev,
            department: "", // We might not have dept in session object directly, simplistic resume
            year: "",
            course_id: session.course_id.toString()
          }));
          toast.info("Resumed active session: " + session.course_name);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live Status Polling (Teacher)
  useEffect(() => {
    let interval;
    if (activeSession && isTeacher) {
      const fetchLiveStatus = async () => {
        try {
          const res = await apiClient.get(`/attendance/session/${activeSession.session_id || activeSession.id}/live-status`);
          setLiveStudents(res.data);

          // Calculate stats
          const present = res.data.filter(s => s.status === 'present').length;
          const total = res.data.length;
          setStats({ present, absent: total - present, total });
        } catch (e) {
          console.error("Live status error", e);
        }
      };

      fetchLiveStatus(); // Immediate
      interval = setInterval(fetchLiveStatus, 3000); // Pulse every 3s
    }
    return () => clearInterval(interval);
  }, [activeSession, isTeacher]);

  const handleStartSession = async () => {
    if (!sessionForm.course_id) {
      toast.error("Please select a course");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location required for session init");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await apiClient.post("/attendance/start-session", {
          course_id: parseInt(sessionForm.course_id),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radius: parseInt(sessionForm.radius)
        });
        setActiveSession(res.data);
        toast.success("QR Session Started!");
      } catch (e) {
        toast.error(e.response?.data?.detail || "Start Failed");
      }
    }, (err) => toast.error("Location access denied"));
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("End session? All unmarked students will be marked ABSENT.")) return;

    try {
      const id = activeSession.session_id || activeSession.id;
      const res = await apiClient.post(`/attendance/session/${id}/close`);
      toast.success(res.data.message);
      setActiveSession(null);
      setLiveStudents([]);
      setSessionForm({ ...sessionForm, course_id: "" });
    } catch (e) {
      toast.error("Failed to close session");
    }
  };

  const toggleStudentStatus = async (studentId, currentStatus) => {
    if (!activeSession) return;
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    const id = activeSession.session_id || activeSession.id;

    try {
      await apiClient.post("/attendance/manual-mark", {
        session_id: id,
        student_id: studentId,
        status: newStatus
      });
      toast.success(`Marked as ${newStatus}`);
      // Optimistic update
      setLiveStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleExport = () => {
    if (!liveStudents.length) return;

    const ws = XLSX.utils.json_to_sheet(liveStudents.map(s => ({
      "Roll Number": s.roll_no,
      Name: s.name,
      Section: s.section,
      Status: s.status.toUpperCase(),
      Time: s.marked_at ? new Date(s.marked_at).toLocaleTimeString() : '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${activeSession?.course_name || 'Report'}_${new Date().toLocaleDateString()}.xlsx`);
  };

  // Student Actions
  const handleScan = async (result, error) => {
    if (!!result) {
      setScanResult(result?.text);
      submitAttendance(result?.text);
    }
    if (!!error) {
      // console.info(error);
    }
  };

  const submitAttendance = async (code) => {
    if (marking) return;
    setMarking(true);

    if (!navigator.geolocation) {
      toast.error("Location access required");
      setMarking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await apiClient.post("/attendance/mark", {
          code: code,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        toast.success("Attendance Marked Successfully! ≡ƒÄë");
        setScanResult(""); // Reset
      } catch (e) {
        toast.error(e.response?.data?.detail || "Marking Failed");
      } finally {
        setMarking(false);
      }
    }, (err) => {
      toast.error("Location needed to verify presence");
      setMarking(false);
    });
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <DashboardLayout title="Smart Attendance">

      {/* TEACHER VIEW */}
      {isTeacher && (
        <div className="space-y-6">
          {!activeSession ? (
            <Card className="max-w-xl mx-auto border-blue-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex gap-2"><QrCode className="text-blue-600" /> Start QR Session</CardTitle>
                <CardDescription>Generate a secure QR code for students to scan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Select value={sessionForm.department} onValueChange={v => setSessionForm({ ...sessionForm, department: v, course_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(courses.map(c => c.department))).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Select value={sessionForm.year} onValueChange={v => setSessionForm({ ...sessionForm, year: v, course_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(courses.filter(c => c.department === sessionForm.department).map(c => c.year))).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Course</Label>
                  <Select value={sessionForm.course_id} onValueChange={v => setSessionForm({ ...sessionForm, course_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                    <SelectContent>
                      {courses.filter(c => c.department === sessionForm.department && c.year === sessionForm.year).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.code} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex justify-between">
                    <span>Geo-Fence Radius</span>
                    <span className="font-bold text-blue-600">{sessionForm.radius} meters</span>
                  </Label>
                  <Input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={sessionForm.radius}
                    onChange={(e) => setSessionForm({ ...sessionForm, radius: e.target.value })}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Students must be within this range to mark attendance.</p>
                </div>
                <Button onClick={handleStartSession} className="w-full bg-blue-600 hover:bg-blue-700">Generate QR Code</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: QR Display */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-emerald-100 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-emerald-800">Scan to Mark</CardTitle>
                    <CardDescription className="text-center flex justify-center items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {activeSession.expires_at && <CountdownTimer targetDate={activeSession.expires_at} onExpire={handleEndSession} />}
                    </CardDescription>
                    <div className="text-center text-xs mt-1">OTP: <span className="font-mono font-bold text-lg text-black">{activeSession.otp}</span></div>
                  </CardHeader>
                  <CardContent className="flex justify-center py-6 bg-white">
                    <div className="p-4 bg-white border-2 border-black rounded-lg">
                      <QRCode value={activeSession.qr_code || "error"} size={200} />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <div className="flex justify-between w-full text-sm font-medium">
                      <span className="text-emerald-600">Present: {stats.present}</span>
                      <span className="text-red-500">Pending: {stats.absent}</span>
                    </div>
                    <Button variant="destructive" className="w-full" onClick={handleEndSession}>
                      <Save className="w-4 h-4 mr-2" /> End & Save Attendance
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* RIGHT: Live List */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Live Student Status</CardTitle>
                      <CardDescription>Click a student to toggle status manually</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" /> Excel
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {liveStudents.map(student => (
                        <div
                          key={student.id}
                          onClick={() => toggleStudentStatus(student.id, student.status)}
                          className={`
                            p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] select-none
                            flex flex-col items-center justify-center text-center gap-1 shadow-sm
                            ${student.status === 'present'
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : student.status === 'absent'
                                ? 'bg-red-600 border-red-700 text-white'
                                : 'bg-white border-gray-200 text-gray-800 shadow-none'
                            }
                          `}
                        >
                          <div className={`font-bold text-sm truncate w-full ${student.status === 'pending' ? 'text-gray-900' : 'text-white'}`}>
                            {student.name}
                          </div>
                          <div className={`text-xs font-mono ${student.status === 'pending' ? 'text-gray-400' : 'text-white/70'}`}>
                            {student.roll_no}
                          </div>
                          <div className={`text-[10px] font-black mt-1 px-2 py-0.5 rounded-full ${student.status === 'pending' ? 'bg-gray-100 text-gray-600' : 'bg-black/20 text-white'}`}>
                            {student.attendance_percentage}% ATD
                          </div>
                          {student.status === 'present' && <CheckCircle2 className="w-4 h-4 mt-1 text-white" />}
                        </div>
                      ))}
                      {liveStudents.length === 0 && (
                        <div className="col-span-full text-center py-10">
                          <div className="text-gray-400 mb-2">Waiting for students...</div>
                          <div className="text-[10px] text-gray-300 font-mono space-y-1">
                            <div>Debug ID: {activeSession?.session_id || activeSession?.id || 'None'}</div>
                            <div>Status: {activeSession?.status || 'Active'}</div>
                            <div>Role: {isTeacher ? 'Teacher' : 'Student'}</div>
                            <div>Raw Count: {liveStudents.length}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENT VIEW */}
      {!isTeacher && (
        <Card className="max-w-md mx-auto mt-10">
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Scan the QR code shown by your teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scan">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan"><Scan className="w-4 h-4 mr-2" /> Scan QR</TabsTrigger>
                <TabsTrigger value="code"><QrCode className="w-4 h-4 mr-2" /> Enter Code</TabsTrigger>
              </TabsList>

              <TabsContent value="scan" className="space-y-4 pt-4">
                <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
                  {/* Note: React-Qr-Reader usage varies by version, strict mode issue might occur */}
                  <QrReader
                    onResult={handleScan}
                    constraints={{ facingMode: 'environment' }}
                    style={{ width: '100%' }}
                    ViewFinder={() => <div className="absolute inset-0 border-2 border-white/50 m-10 rounded-xl pointer-events-none" />}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">Point your camera at the screen</p>
              </TabsContent>

              <TabsContent value="code" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Backup Session Code (OTP)</Label>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest uppercase"
                  />
                </div>
                <Button className="w-full" onClick={() => submitAttendance(manualCode)} disabled={marking || manualCode.length < 6}>
                  {marking ? <Loader2 className="animate-spin" /> : "Submit Attendance"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

    </DashboardLayout>
  );
};
