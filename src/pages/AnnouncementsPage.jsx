import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Bell, Send, Users, ShieldAlert, Clock } from "lucide-react";

export const AnnouncementsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isTeacher = user?.role === "Teacher";

  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [targetType, setTargetType] = useState("all"); // all or class
  const [targetClassId, setTargetClassId] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/announcements");
      setAnnouncements(res.data);
    } catch (e) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const fetchSetupData = async () => {
    try {
      const res = await apiClient.get(`/classes?t=${new Date().getTime()}`);
      setClasses(res.data);
    } catch (e) {
      console.error("Failed to fetch classes list", e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    if (isAdmin || isTeacher) {
      fetchSetupData();
    }
  }, [isAdmin, isTeacher]);

  const fetchSections = async (classId) => {
    try {
      const res = await apiClient.get(`/classes/${classId}/sections`);
      setSections(res.data);
    } catch (e) {
      console.error("Failed to fetch sections list", e);
    }
  };

  useEffect(() => {
    if (targetClassId) {
      fetchSections(targetClassId);
    } else {
      setSections([]);
    }
    setTargetSectionId("");
  }, [targetClassId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setSending(true);
    try {
      await apiClient.post("/announcements", {
        message: message,
        target_class_id: targetType === "class" && targetClassId ? parseInt(targetClassId) : null,
        target_section_id: targetType === "class" && targetSectionId ? parseInt(targetSectionId) : null
      });
      toast.success("Announcement broadcast successfully.");
      setMessage("");
      setTargetType("all");
      setTargetClassId("");
      setTargetSectionId("");
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to broadcast announcement.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Announcements</h1>
          <p className="text-slate-500 mt-1">Broadcast general updates or class-specific notifications to students and parents.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Compose Announcement (Admins and Teachers only) */}
          {(isAdmin || isTeacher) && (
            <div>
              <Card className="border border-slate-200 shadow-sm sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Compose Broadcast
                  </CardTitle>
                  <CardDescription>Draft updates to send via school portal and mock WhatsApp notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSend} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Recipients Scope</Label>
                      <Select value={targetType} onValueChange={setTargetType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">School-Wide (All)</SelectItem>
                          <SelectItem value="class">Targeted Class/Section</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {targetType === "class" && (
                      <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Class</Label>
                          <Select value={targetClassId} onValueChange={setTargetClassId}>
                            <SelectTrigger><SelectValue placeholder="Choose Class" /></SelectTrigger>
                            <SelectContent>
                              {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Section (Optional)</Label>
                          <Select value={targetSectionId} onValueChange={setTargetSectionId} disabled={!targetClassId}>
                            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Sections</SelectItem>
                              {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>Section {s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="message">Message Body</Label>
                      <Textarea
                        id="message"
                        placeholder="Type your notice here..."
                        className="min-h-[120px]"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-[#1a365d] hover:bg-[#102a43]" disabled={sending}>
                      {sending ? "Broadcasting..." : "Broadcast Notice"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Announcements Feed */}
          <div className={(isAdmin || isTeacher) ? "lg:col-span-2 space-y-4" : "col-span-3 space-y-4"}>
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-slate-700 animate-pulse" />
                  Notice Board
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                  </div>
                ) : announcements.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {announcements.map(ann => (
                      <div key={ann.id} className="py-4 first:pt-0 last:pb-0 space-y-2 animate-fadeIn">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm">{ann.sender_name || "School Office"}</span>
                            <span className="text-xs text-slate-400 font-medium">•</span>
                            <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(ann.sent_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          
                          {/* Scope Target Badges */}
                          {ann.class_name ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-150 inline-flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {ann.class_name} {ann.section_name ? `- Section ${ann.section_name}` : "(All)"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150">
                              School-Wide
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    <Bell className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Notice Board is empty.</p>
                    <p className="text-xs text-slate-400 mt-1">No announcements have been broadcasted yet.</p>
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
