import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { GraduationCap, Printer, Share2, Search, FileText, Loader2 } from "lucide-react";

export const ReportCardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isParent = user?.role === "Parent";
  const isStudent = user?.role === "Student";
  const isStaff = isAdmin;

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get(`/classes?t=${new Date().getTime()}`);
      setClasses(res.data);
    } catch (e) {
      toast.error("Failed to load classes");
    }
  };

  useEffect(() => {
    if (isStaff) {
      fetchClasses();
    } else {
      // Parent / Student directly loads their own report card
      const loadOwnReport = async () => {
        setLoading(true);
        try {
          const studentId = isParent ? user.linked_student_id : user.id;
          const res = await apiClient.get(`/report-card/${studentId}`);
          setReportData(res.data);
        } catch (e) {
          toast.error("Failed to load report card.");
        } finally {
          setLoading(false);
        }
      };
      loadOwnReport();
    }
  }, [isStaff, isParent, isStudent, user]);

  const fetchSections = async (classId) => {
    try {
      const res = await apiClient.get(`/classes/${classId}/sections`);
      setSections(res.data);
    } catch (e) {
      toast.error("Failed to load sections");
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
    }
    setSelectedSectionId("");
    setStudents([]);
  }, [selectedClassId]);

  const fetchStudents = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    try {
      const res = await apiClient.get(`/users?role=Student&class_id=${selectedClassId}&section_id=${selectedSectionId}`);
      setStudents(res.data);
    } catch (e) {
      toast.error("Failed to load students");
    }
  };

  useEffect(() => {
    if (isStaff) {
      fetchStudents();
    }
  }, [selectedClassId, selectedSectionId]);

  const handleViewReportCard = async (student) => {
    try {
      const res = await apiClient.get(`/report-card/${student.id}`);
      setReportData(res.data);
      setSelectedStudent(student);
    } catch (e) {
      toast.error("Failed to fetch report card details.");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report-card").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Report Card</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #1e365d; }
            .sub-title { font-size: 14px; color: #64748b; margin-top: 5px; }
            .student-info { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-item { font-size: 14px; }
            .info-label { font-weight: 600; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .summary { margin-top: 40px; display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 20px; }
            .totals { font-size: 16px; font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
            .sig-line { width: 200px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; font-size: 13px; font-weight: 500; color: #475569; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareWhatsApp = async () => {
    if (!reportData) return;
    
    const primaryParent = reportData.student.parents?.find(p => p.is_primary_contact === 1) || reportData.student.parents?.[0];
    const parentPhone = primaryParent?.phone;
    
    if (!parentPhone) {
      toast.error("No linked parent phone number found.");
      return;
    }

    try {
      const gList = reportData.grades;
      const averagePercentage = gList.length > 0 
        ? (gList.reduce((acc, curr) => acc + (curr.score / curr.max_score), 0) / gList.length) * 100 
        : 0;

      const message = `Hello ${primaryParent.name},\n\nHere is the report card summary for ${reportData.student.full_name} (Roll No: ${reportData.student.roll_no}):\nAverage Marks: ${averagePercentage.toFixed(1)}%\n\nPlease log in to the Parent Portal to view complete grades.`;

      await apiClient.post("/report-card/send-whatsapp", {
        student_id: reportData.student.id,
        phone: parentPhone,
        message: message
      });
      toast.success(`Report Card shared successfully with Parent ${primaryParent.name} via WhatsApp.`);
    } catch (e) {
      toast.error("Failed to share report card.");
    }
  };

  const gradesList = reportData?.grades || [];
  const totalScore = gradesList.reduce((sum, g) => sum + g.score, 0);
  const totalMax = gradesList.reduce((sum, g) => sum + g.max_score, 0);
  const avgPercentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

  return (
    <DashboardLayout role={user?.role}>
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Report Cards</h1>
            <p className="text-slate-500 mt-1">
              {isStaff ? "Review student performance reports, export files, or share report cards directly with parents." : "View complete evaluation grades and term performance summaries."}
            </p>
          </div>
          {!isStaff && reportData && (
            <Button onClick={handlePrint} className="bg-[#1a365d] hover:bg-[#102a43] gap-1.5">
              <Printer className="w-4 h-4" /> Print Report Card
            </Button>
          )}
        </div>

        {isStaff ? (
          <div className="space-y-6">
            {/* Filters */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="pt-6 flex gap-4">
                <div className="flex-1 max-w-xs space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 max-w-xs space-y-2">
                  <Label>Section</Label>
                  <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                    <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                    <SelectContent>
                      {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>Section {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Student list */}
            {selectedClassId && selectedSectionId ? (
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Class Roster
                  </CardTitle>
                  <CardDescription>Select a student to generate and view their report card.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Parent Name</TableHead>
                        <TableHead className="w-32 text-right">Report Card</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold text-slate-800">{s.roll_number || "-"}</TableCell>
                          <TableCell className="font-medium text-slate-700">{s.name}</TableCell>
                          <TableCell className="text-slate-600">{s.parent_name || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleViewReportCard(s)}>
                              <FileText className="w-4 h-4 mr-1.5" /> View Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {students.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">No students found in this section.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 border border-dashed border-slate-300 rounded-lg text-slate-500">
                <Search className="w-12 h-12 text-slate-400 mb-3" />
                <h3 className="font-semibold text-lg text-slate-700">Select Class & Section</h3>
                <p className="text-sm mt-1 text-slate-500">Please choose a class and section from the dropdowns above to review report cards.</p>
              </div>
            )}

            {/* Admin Dialog Modal */}
            <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                  <div className="flex justify-between items-center pr-6">
                    <DialogTitle className="text-2xl font-bold text-slate-800">Academic Report Card</DialogTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5"><Printer className="w-4 h-4" /> Print</Button>
                      <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Share2 className="w-4 h-4" /> Share with Parent</Button>
                    </div>
                  </div>
                </DialogHeader>

                {reportData && (
                  <div className="mt-4 p-6 border rounded-lg bg-white shadow-sm" id="printable-report-card">
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                      <h2 className="text-3xl font-extrabold text-[#1a365d] tracking-wide">SRI SWAMY INTERNATIONAL SCHOOL</h2>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Affiliated to SSIS.edu.in • Academic Year 2026</p>
                      <p className="text-sm font-semibold text-slate-600 mt-2">STUDENT EVALUATION REPORT CARD</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/60 mb-6 text-sm">
                      <div>
                        <span className="font-semibold text-slate-500">Student Name:</span> <span className="font-bold text-slate-800 text-base">{reportData.student.full_name || selectedStudent?.name}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Roll Number:</span> <span className="font-semibold text-slate-800">{reportData.student.roll_no}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Class & Section:</span> <span className="font-semibold text-slate-800">{reportData.student.class_name} - Section {reportData.student.section_name}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Date of Birth:</span> <span className="font-semibold text-slate-800">{reportData.student.date_of_birth || "—"}</span>
                      </div>
                    </div>

                    <Table className="border border-slate-200">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold">Subject Code</TableHead>
                          <TableHead className="font-bold">Subject Name</TableHead>
                          <TableHead className="font-bold text-right">Marks Obtained</TableHead>
                          <TableHead className="font-bold text-right">Maximum Marks</TableHead>
                          <TableHead className="font-bold text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.subjects.map(sub => {
                          const grade = gradesList.find(g => g.course_id === sub.course_id);
                          return (
                            <TableRow key={sub.course_id}>
                              <TableCell className="font-semibold text-slate-800">{sub.course_code}</TableCell>
                              <TableCell className="font-medium text-slate-700">{sub.course_name}</TableCell>
                              <TableCell className="text-right font-bold text-slate-800">{grade ? grade.score : "—"}</TableCell>
                              <TableCell className="text-right text-slate-600">{grade ? grade.max_score : "—"}</TableCell>
                              <TableCell className="text-right font-medium text-blue-600">
                                {grade ? `${((grade.score / grade.max_score) * 100).toFixed(1)}%` : "N/A"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {gradesList.length > 0 && (
                      <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-4 text-slate-800">
                        <div>
                          <p className="text-sm font-semibold">Total Subjects Evaluated: <span className="font-bold">{gradesList.length}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-semibold">Aggregate Marks: <span className="font-bold text-slate-900">{totalScore} / {totalMax}</span></p>
                          <p className="text-base font-bold text-[#1a365d]">Average Percentage: <span>{avgPercentage.toFixed(1)}%</span></p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-end mt-16 pt-8 border-t border-dashed border-slate-300">
                      <div className="text-center w-48 border-t border-slate-400 pt-2 text-xs font-semibold text-slate-600 uppercase">
                        Class Teacher
                      </div>
                      <div className="text-center w-48 border-t border-slate-400 pt-2 text-xs font-semibold text-slate-600 uppercase">
                        Principal / Coordinator
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          /* Student / Parent Scoped Report Card Direct View */
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" /></div>
            ) : reportData ? (
              <Card className="border border-slate-200 shadow-sm max-w-4xl mx-auto">
                <CardContent className="pt-6">
                  <div className="p-6 border rounded-lg bg-white shadow-sm" id="printable-report-card">
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                      <h2 className="text-3xl font-extrabold text-[#1a365d] tracking-wide">SRI SWAMY INTERNATIONAL SCHOOL</h2>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Affiliated to SSIS.edu.in • Academic Year 2026</p>
                      <p className="text-sm font-semibold text-slate-600 mt-2">STUDENT EVALUATION REPORT CARD</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/60 mb-6 text-sm">
                      <div>
                        <span className="font-semibold text-slate-500">Student Name:</span> <span className="font-bold text-slate-800 text-base">{reportData.student.full_name}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Roll Number:</span> <span className="font-semibold text-slate-800">{reportData.student.roll_no}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Class & Section:</span> <span className="font-semibold text-slate-800">{reportData.student.class_name} - Section {reportData.student.section_name}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Date of Birth:</span> <span className="font-semibold text-slate-800">{reportData.student.date_of_birth || "—"}</span>
                      </div>
                    </div>

                    <Table className="border border-slate-200">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold">Subject Code</TableHead>
                          <TableHead className="font-bold">Subject Name</TableHead>
                          <TableHead className="font-bold text-right">Marks Obtained</TableHead>
                          <TableHead className="font-bold text-right">Maximum Marks</TableHead>
                          <TableHead className="font-bold text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.subjects.map(sub => {
                          const grade = gradesList.find(g => g.course_id === sub.course_id);
                          return (
                            <TableRow key={sub.course_id}>
                              <TableCell className="font-semibold text-slate-800">{sub.course_code}</TableCell>
                              <TableCell className="font-medium text-slate-700">{sub.course_name}</TableCell>
                              <TableCell className="text-right font-bold text-slate-800">{grade ? grade.score : "—"}</TableCell>
                              <TableCell className="text-right text-slate-600">{grade ? grade.max_score : "—"}</TableCell>
                              <TableCell className="text-right font-medium text-blue-600">
                                {grade ? `${((grade.score / grade.max_score) * 100).toFixed(1)}%` : "N/A"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {gradesList.length > 0 && (
                      <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-4 text-slate-800">
                        <div>
                          <p className="text-sm font-semibold">Total Subjects Evaluated: <span className="font-bold">{gradesList.length}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-semibold">Aggregate Marks: <span className="font-bold text-slate-900">{totalScore} / {totalMax}</span></p>
                          <p className="text-base font-bold text-[#1a365d]">Average Percentage: <span>{avgPercentage.toFixed(1)}%</span></p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-end mt-16 pt-8 border-t border-dashed border-slate-300">
                      <div className="text-center w-48 border-t border-slate-400 pt-2 text-xs font-semibold text-slate-600 uppercase">
                        Class Teacher
                      </div>
                      <div className="text-center w-48 border-t border-slate-400 pt-2 text-xs font-semibold text-slate-600 uppercase">
                        Principal / Coordinator
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-slate-400">No report card generated yet.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
