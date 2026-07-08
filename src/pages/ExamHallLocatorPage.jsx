import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import { Calendar, Printer, School, UserCheck, Settings, Loader2 } from "lucide-react";

export const ExamHallLocatorPage = () => {
  const [exams, setExams] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedHallIds, setSelectedHallIds] = useState([]);
  const [seatingArrangement, setSeatingArrangement] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [examsRes, hallsRes] = await Promise.all([
        apiClient.get("/exams"),
        apiClient.get("/exams/halls")
      ]);
      setExams(examsRes.data);
      setHalls(hallsRes.data);
    } catch (e) {
      toast.error("Failed to load exams and halls setup data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchSeating = async () => {
    if (!selectedExamId) {
      setSeatingArrangement([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/exams/${selectedExamId}/seating`);
      setSeatingArrangement(res.data);
    } catch (e) {
      setSeatingArrangement([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeating();
  }, [selectedExamId]);

  const handleToggleHall = (hallId) => {
    setSelectedHallIds(prev => 
      prev.includes(hallId) ? prev.filter(id => id !== hallId) : [...prev, hallId]
    );
  };

  const handleGenerateSeating = async (e) => {
    e.preventDefault();
    if (!selectedExamId) {
      toast.error("Please select an exam first.");
      return;
    }
    if (selectedHallIds.length === 0) {
      toast.error("Please select at least one exam hall.");
      return;
    }

    setGenerating(true);
    try {
      const res = await apiClient.post(`/exams/${selectedExamId}/generate-seating`, {
        exam_id: parseInt(selectedExamId),
        hall_ids: selectedHallIds.map(id => parseInt(id))
      });
      toast.success(res.data.message || "Seating arrangement generated successfully.");
      fetchSeating();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate seating.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-seating-matrix").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Seating Arrangement - Exam ID ${selectedExamId}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; }
            h2 { text-align: center; font-size: 22px; color: #1e365d; margin-bottom: 20px; border-bottom: 2px solid #334155; padding-bottom: 10px; }
            .meta-info { display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; margin-bottom: 25px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 1cm; }
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

  const activeExam = exams.find(e => e.id.toString() === selectedExamId);

  return (
    <DashboardLayout role="Admin">
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Exam Hall Locator</h1>
          <p className="text-slate-500 mt-1">Configure seating arrangements, allocate halls, and print exam desk locators.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seating Allocation Setup Panel */}
          <div>
            <Card className="border border-slate-200 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Allocation Setup
                </CardTitle>
                <CardDescription>Select exam and rooms to distribute students with anti-cheating layout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>1. Choose Active Exam</Label>
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                    <SelectContent>
                      {exams.map(e => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.name} ({e.course_code || "Code"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Label className="font-semibold text-slate-700">2. Select Halls to Allocate</Label>
                  {halls.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border rounded-md p-3 bg-slate-50/50">
                      {halls.map(hall => (
                        <div key={hall.id} className="flex items-center gap-2.5">
                          <Checkbox
                            id={`hall-${hall.id}`}
                            checked={selectedHallIds.includes(hall.id)}
                            onCheckedChange={() => handleToggleHall(hall.id)}
                          />
                          <Label htmlFor={`hall-${hall.id}`} className="text-slate-700 text-sm font-medium cursor-pointer">
                            {hall.name} ({hall.building} - Capacity: {hall.capacity})
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No halls found. Setup rooms in Classrooms first.</p>
                  )}
                </div>

                <Button
                  onClick={handleGenerateSeating}
                  className="w-full bg-[#1a365d] hover:bg-[#102a43]"
                  disabled={generating || !selectedExamId || selectedHallIds.length === 0}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Allocate & Interleave"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Seating Arrangement Display */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <School className="w-5 h-5 text-slate-700" />
                    Seating Chart
                  </CardTitle>
                  <CardDescription>Alternating bench allocations for anti-cheating compliance.</CardDescription>
                </div>
                {seatingArrangement.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                    <Printer className="w-4 h-4" /> Print Seating
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                  </div>
                ) : seatingArrangement.length > 0 ? (
                  <div className="space-y-4" id="printable-seating-matrix">
                    {/* Print Only Header */}
                    <div className="hidden print:block">
                      <h2>Exam Seating Layout Plan</h2>
                      <div className="meta-info">
                        <span><strong>Exam:</strong> {activeExam?.name} ({activeExam?.course_code})</span>
                        <span><strong>Date:</strong> {activeExam?.exam_date}</span>
                        <span><strong>Time:</strong> {activeExam?.start_time} - {activeExam?.end_time}</span>
                      </div>
                    </div>

                    <Table className="border rounded-md overflow-hidden">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold">Desk/Seat</TableHead>
                          <TableHead className="font-bold">Row</TableHead>
                          <TableHead className="font-bold">Hall Room</TableHead>
                          <TableHead className="font-bold">Roll Number</TableHead>
                          <TableHead className="font-bold">Student Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seatingArrangement.map((seat, index) => (
                          <TableRow key={index} className="hover:bg-slate-50/50">
                            <TableCell className="font-bold text-[#1a365d]">Seat #{seat.seat_number}</TableCell>
                            <TableCell className="font-medium text-slate-600">Row {seat.row_number}</TableCell>
                            <TableCell className="font-medium text-slate-700">{seat.hall_name} ({seat.building})</TableCell>
                            <TableCell className="font-semibold text-slate-800">{seat.student_roll_no || seat.student_usn}</TableCell>
                            <TableCell className="font-medium text-slate-700">{seat.student_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Calendar className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No seating chart generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Select an exam and halls on the left to allocate seats.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
