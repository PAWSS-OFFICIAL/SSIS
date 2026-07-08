import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  Printer,
  AlertCircle,
  FileText,
  Loader2
} from "lucide-react";

export const HallTicketPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get("/exams/my-seat");
      setTickets(res.data);
      if (res.data.length > 0) {
        setSelectedTicket(res.data[0]);
      }
    } catch (error) {
      toast.error("Failed to load hall tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById("printable-hall-ticket").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Exam Hall Ticket - ${user?.full_name || "Student"}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .ticket-card { border: 2px solid #1e365d; border-radius: 8px; overflow: hidden; max-width: 650px; margin: 0 auto; }
            .header { background-color: #1e365d; color: #ffffff; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
            .header h2 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 3px 0 0 0; font-size: 13px; color: #cbd5e1; }
            .ticket-id { text-align: right; }
            .ticket-id p { margin: 0; font-size: 11px; color: #cbd5e1; text-transform: uppercase; }
            .ticket-id h3 { margin: 2px 0 0 0; font-family: monospace; font-size: 15px; font-weight: bold; }
            .content { padding: 25px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .section-title { font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; }
            .info-item { margin-bottom: 10px; font-size: 13px; }
            .info-label { font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 1px; }
            .info-value { font-weight: bold; color: #0f172a; }
            .seating-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 15px; }
            .seat-num { font-size: 24px; font-weight: 800; color: #1e365d; line-height: 1; margin-top: 2px; }
            .qr-sec { text-align: center; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            .instructions { margin-top: 20px; font-size: 11px; color: #64748b; line-height: 1.5; }
            .instructions h4 { margin: 0 0 5px 0; color: #334155; font-size: 12px; }
            @media print {
              body { padding: 0; }
              .ticket-card { border: 2px solid #000; box-shadow: none; }
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

  if (loading) {
    return (
      <DashboardLayout role="Student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="Student">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Exam Hall Tickets</h1>
            <p className="text-slate-500 mt-1">View and print your examination seating desk locator ticket.</p>
          </div>
          {selectedTicket && (
            <Button onClick={handlePrint} className="bg-[#1a365d] hover:bg-[#102a43] gap-1.5">
              <Printer className="w-4 h-4" />
              Print Ticket
            </Button>
          )}
        </div>

        {tickets.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Hall Tickets Available</h3>
              <p className="text-slate-500 text-sm">
                Your seating arrangement has not been allocated or published yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-semibold text-slate-700">Scheduled Exams</h3>
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTicket?.id === ticket.id
                      ? "border-[#1a365d] bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{ticket.exam_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ticket.course_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {ticket.exam_date}
                  </div>
                </button>
              ))}
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-2">
              {selectedTicket && (
                <div id="printable-hall-ticket">
                  <div className="border-2 border-[#1a365d] rounded-lg overflow-hidden bg-white shadow-sm">
                    {/* Header */}
                    <div className="bg-[#1a365d] text-white p-6 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold tracking-wide">SHANTI SHIKSHA INTERNATIONAL SCHOOL</h2>
                        <p className="text-xs text-slate-300 uppercase tracking-widest mt-1">Seating Hall Ticket</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-300 uppercase">Ticket Reference</p>
                        <p className="font-mono font-bold text-sm tracking-widest">HT{selectedTicket.exam_id}S{selectedTicket.student_id}</p>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Student Info */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-1.5 mb-3">Student Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                              <User className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-450 uppercase font-medium">Name</p>
                                <p className="text-sm font-bold text-slate-800">{user?.full_name || user?.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Building className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-450 uppercase font-medium">Class & Section</p>
                                <p className="text-sm font-bold text-slate-800">{user?.class_name} - Section {user?.section_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-450 uppercase font-medium">Roll Number</p>
                                <p className="text-sm font-bold text-slate-800">{user?.roll_no || user?.idno}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Exam Details */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-1.5 mb-3">Examination Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-450 uppercase font-medium">Subject</p>
                                <p className="text-sm font-bold text-slate-800">{selectedTicket.course_name}</p>
                                <p className="text-xs text-slate-500">({selectedTicket.course_code})</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-450 uppercase font-medium">Date</p>
                                <p className="text-sm font-bold text-slate-800">{selectedTicket.exam_date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-450 uppercase font-medium">Time</p>
                                <p className="text-sm font-bold text-slate-800">{selectedTicket.start_time} - {selectedTicket.end_time}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seating Allocated Block */}
                      <div className="bg-slate-50 border rounded-lg p-4 grid grid-cols-3 gap-4 items-center">
                        <div className="flex items-center gap-2.5 border-r pr-2">
                          <Building className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Building</p>
                            <p className="text-sm font-bold text-slate-800">{selectedTicket.building}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 border-r pr-2">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Hall Room</p>
                            <p className="text-sm font-bold text-slate-800">{selectedTicket.hall_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-[#1a365d] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                            {selectedTicket.seat_number}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Seat Number</p>
                            <p className="text-sm font-bold text-slate-800">Seat {selectedTicket.seat_number} (Row {selectedTicket.row_number})</p>
                          </div>
                        </div>
                      </div>

                      {/* QR Verification */}
                      <div className="border-t border-dashed pt-4 flex flex-col items-center justify-center text-center">
                        <div className="p-2.5 bg-slate-50 border rounded-lg">
                          <QrCode className="w-20 h-20 text-slate-500" />
                        </div>
                        <p className="text-[10px] text-slate-450 mt-1 uppercase font-medium">Verify seat allocation at building main gates</p>
                      </div>

                      {/* Instructions */}
                      <div className="bg-amber-50/50 border border-amber-250 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Candidate Instructions
                        </h4>
                        <ul className="text-[11px] text-amber-800 mt-2 space-y-1.5 list-disc list-inside">
                          <li>Report to the exam hall 30 minutes before the scheduled start time.</li>
                          <li>Produce this hall ticket and official School ID for verification.</li>
                          <li>No mobile phones, calculators, or smartwatches are permitted in halls.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
