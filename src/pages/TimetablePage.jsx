import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Loader2, Calendar, Clock, Plus, Trash2, User, ChevronRight } from "lucide-react";

const GenerateTimetableDialog = ({ classId, sectionId, onGenerated }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [pairings, setPairings] = useState([{ course_id: "", teacher_id: "", slots: 4 }]);

    const fetchPairs = async () => {
        try {
            const res = await apiClient.get(`/courses?class_id=${classId}&section_id=${sectionId}`);
            setAvailableCourses(res.data);
            const teachersRes = await apiClient.get("/users?role=Teacher");
            setAvailableTeachers(teachersRes.data);
        } catch (e) {
            toast.error("Failed to fetch subjects/teachers");
        }
    };

    const handleAddPair = () => setPairings([...pairings, { course_id: "", teacher_id: "", slots: 4 }]);
    const handleRemovePair = (index) => setPairings(pairings.filter((_, i) => i !== index));
    const updatePair = (index, field, value) => {
        const newPairs = [...pairings];
        newPairs[index][field] = value;
        setPairings(newPairs);
    };

    const handleGenerate = async () => {
        if (pairings.some(p => !p.course_id || !p.teacher_id)) {
            toast.error("Please select a subject and teacher for all rows.");
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post("/timetable/generate", {
                class_id: parseInt(classId),
                section_id: parseInt(sectionId),
                pairings: pairings.map(p => ({
                    course_id: parseInt(p.course_id),
                    teacher_id: parseInt(p.teacher_id),
                    slots_per_week: parseInt(p.slots)
                }))
            });

            if (res.data.status === "success") {
                toast.success("Timetable generated successfully!");
            } else {
                toast.warning(res.data.message);
            }
            setOpen(false);
            onGenerated();
        } catch (e) {
            toast.error(e.response?.data?.detail || "Generation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (val) fetchPairs(); }}>
            <DialogTrigger asChild>
                <Button className="bg-[#1a365d] gap-2">
                    <Plus className="w-4 h-4" />
                    Auto-Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Timetable</DialogTitle>
                    <DialogDescription>
                        Set weekly periods targets for each subject in this section.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {pairings.map((p, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-4 last:border-0">
                            <div className="col-span-4 space-y-2">
                                <Label>Subject</Label>
                                <Select value={p.course_id} onValueChange={(v) => updatePair(index, 'course_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCourses.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.code} - {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-4 space-y-2">
                                <Label>Teacher</Label>
                                <Select value={p.teacher_id} onValueChange={(v) => updatePair(index, 'teacher_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose Teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeachers.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label>Periods/Week</Label>
                                <Input
                                    type="number"
                                    value={p.slots}
                                    onChange={(e) => updatePair(index, 'slots', e.target.value)}
                                    min={1}
                                    max={10}
                                />
                            </div>
                            <div className="col-span-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleRemovePair(index)}
                                    disabled={pairings.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" onClick={handleAddPair} className="w-full dashed border-2 border-slate-200">
                        <Plus className="w-4 h-4 mr-2" /> Add Course/Teacher
                    </Button>
                </div>

                <DialogFooter>
                    <Button onClick={handleGenerate} className="bg-[#1a365d] w-full" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Generate Collision-Free Timetable
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const TimetablePage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";
    const isTeacher = user?.role === "Teacher";

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ slots: [], days: [] });
    const [timetable, setTimetable] = useState([]);
    
    // Admin selection filters
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");

    // Setup lists for modal
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classTeacher, setClassTeacher] = useState(null);

    // Add slot dialog state
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [selectedDay, setSelectedDay] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotForm, setSlotForm] = useState({
        course_id: "",
        teacher_id: "",
        room: ""
    });

    const fetchConfig = useCallback(async () => {
        try {
            const configRes = await apiClient.get("/timetable/slots-config");
            setConfig(configRes.data);
            
            if (isAdmin) {
                const classesRes = await apiClient.get(`/classes?t=${new Date().getTime()}`);
                setClasses(classesRes.data);
            }
        } catch (error) {
            console.error("Failed to load config:", error);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const fetchSections = async (classId) => {
        try {
            const res = await apiClient.get(`/classes/${classId}/sections`);
            setSections(res.data);
        } catch (e) {
            toast.error("Failed to fetch sections");
        }
    };

    useEffect(() => {
        if (selectedClassId) {
            fetchSections(selectedClassId);
        } else {
            setSections([]);
        }
        setSelectedSectionId("");
        setTimetable([]);
        setClassTeacher(null);
    }, [selectedClassId]);

    const fetchTimetable = useCallback(async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                if (!selectedClassId || !selectedSectionId) {
                    setTimetable([]);
                    setLoading(false);
                    return;
                }
                const [timetableRes, coursesRes, teachersRes, ctRes] = await Promise.all([
                    apiClient.get(`/timetable?class_id=${selectedClassId}&section_id=${selectedSectionId}`),
                    apiClient.get(`/courses?class_id=${selectedClassId}&section_id=${selectedSectionId}`),
                    apiClient.get("/users?role=Teacher"),
                    apiClient.get(`/courses/class-teacher?class_id=${selectedClassId}&section_id=${selectedSectionId}`)
                ]);
                setTimetable(timetableRes.data || []);
                setCourses(coursesRes.data || []);
                setTeachers(teachersRes.data || []);
                setClassTeacher(ctRes.data);
            } else if (isTeacher) {
                const res = await apiClient.get(`/timetable/teacher/${user.id}`);
                setTimetable(res.data || []);
            } else {
                // Student / Parent
                const classId = user.role === "Parent" ? user.class_id : user.class_id;
                const sectionId = user.role === "Parent" ? user.section_id : user.section_id;
                const [timetableRes, ctRes] = await Promise.all([
                    apiClient.get(`/timetable?class_id=${classId}&section_id=${sectionId}`),
                    apiClient.get(`/courses/class-teacher?class_id=${classId}&section_id=${sectionId}`)
                ]);
                setTimetable(timetableRes.data || []);
                setClassTeacher(ctRes.data);
            }
        } catch (error) {
            toast.error("Failed to load timetable");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, isTeacher, selectedClassId, selectedSectionId, user]);

    useEffect(() => {
        if (!isAdmin || (selectedClassId && selectedSectionId)) {
            fetchTimetable();
        } else {
            setLoading(false);
        }
    }, [fetchTimetable, selectedClassId, selectedSectionId, isAdmin]);

    const getSlotForCell = (day, slotNum) => {
        if (isTeacher) {
            return timetable.find(
                s => s.day_of_week === day && s.period_number === slotNum
            );
        }
        return timetable.find(
            s => s.day_of_week === day && s.period_number === slotNum
        );
    };

    const handleAddSlot = async () => {
        try {
            // Conflict validation first
            const valRes = await apiClient.post("/timetable/validate", {
                teacher_id: parseInt(slotForm.teacher_id),
                day_of_week: selectedDay,
                period_number: selectedSlot,
                class_id: parseInt(selectedClassId),
                section_id: parseInt(selectedSectionId)
            });

            if (!valRes.data.valid) {
                toast.error(valRes.data.reason);
                return;
            }

            await apiClient.post("/timetable/slot", {
                class_id: parseInt(selectedClassId),
                section_id: parseInt(selectedSectionId),
                subject_id: parseInt(slotForm.course_id),
                teacher_id: parseInt(slotForm.teacher_id),
                day_of_week: selectedDay,
                period_number: selectedSlot
            });
            
            toast.success("Timetable slot added successfully.");
            setShowAddSlot(false);
            setSlotForm({ course_id: "", teacher_id: "", room: "" });
            fetchTimetable();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to add slot");
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Are you sure you want to clear this period?")) return;
        try {
            await apiClient.delete(`/timetable/slot/${slotId}`);
            toast.success("Period cleared.");
            fetchTimetable();
        } catch (error) {
            toast.error("Failed to delete slot");
        }
    };

    const openAddSlotDialog = (day, slotNum) => {
        setSelectedDay(day);
        setSelectedSlot(slotNum);
        setSlotForm({ course_id: "", teacher_id: "", room: "" });
        setShowAddSlot(true);
    };

    return (
        <DashboardLayout role={user?.role}>
            <div className="p-6 max-w-7xl mx-auto animate-fadeIn space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Weekly Timetable</h1>
                        <p className="text-slate-500 mt-1">
                            {isTeacher ? "Your personal teaching load schedule." : "Academic schedule for classes and sections."}
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <Card className="border border-slate-200 shadow-sm">
                        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label className="text-slate-500">Class:</Label>
                                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Choose Class" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <ChevronRight className="w-4 h-4 text-slate-400" />

                                <div className="flex items-center gap-2">
                                    <Label className="text-slate-500">Section:</Label>
                                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Choose Section" /></SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>Section {s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {classTeacher ? (
                                    <Badge variant="outline" className="gap-2 py-1.5 bg-emerald-50 text-emerald-800 border-emerald-200">
                                        <User className="w-3.5 h-3.5" />
                                        Class Teacher: {classTeacher.teacher_name}
                                    </Badge>
                                ) : selectedClassId && selectedSectionId ? (
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 border">No Class Teacher Assigned</Badge>
                                ) : null}

                                {selectedClassId && selectedSectionId && (
                                    <GenerateTimetableDialog
                                        classId={selectedClassId}
                                        sectionId={selectedSectionId}
                                        onGenerated={fetchTimetable}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(!isAdmin || (selectedClassId && selectedSectionId)) && (
                    <Card className="border border-slate-200 shadow-sm">
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#1a365d]" />
                                Timetable Matrix
                            </CardTitle>
                            <CardDescription>
                                {isTeacher ? "Scheduled teaching periods" : `${classes.find(c=>c.id.toString()===selectedClassId)?.name || user.class_name || ""} - Section ${sections.find(s=>s.id.toString()===selectedSectionId)?.name || user.section_name || ""}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-slate-200 text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-3 font-semibold text-slate-700 w-[140px] border-r border-slate-200">
                                                    <Clock className="w-4 h-4 inline mr-1 text-slate-400" /> Period
                                                </th>
                                                {config.days?.map(day => (
                                                    <th key={day} className="p-3 font-semibold text-slate-700 text-center border-r border-slate-200 last:border-r-0">
                                                        {day}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {config.slots?.map(slotConfig => (
                                                <tr key={slotConfig.slot} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/40">
                                                    <td className="p-3 bg-slate-50 border-r border-slate-200">
                                                        <div className="font-semibold text-sm text-slate-900">Period {slotConfig.slot}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {slotConfig.start} - {slotConfig.end}
                                                        </div>
                                                    </td>
                                                    {config.days?.map(day => {
                                                        const slot = getSlotForCell(day, slotConfig.slot);
                                                        return (
                                                            <td key={day} className="p-2 border-r border-slate-200 last:border-r-0 text-center min-w-[150px]">
                                                                {slot ? (
                                                                    <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2.5 relative group text-left">
                                                                        <div className="font-bold text-sm text-[#1a365d]">
                                                                            {slot.subject_name || slot.course_code}
                                                                        </div>
                                                                        <div className="text-xs font-medium text-blue-700 mt-0.5">
                                                                            {isTeacher ? `${slot.class_name} - ${slot.section_name}` : slot.teacher_name}
                                                                        </div>
                                                                        {isAdmin && (
                                                                            <button
                                                                                onClick={() => handleDeleteSlot(slot.id)}
                                                                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border rounded shadow-sm text-red-500 hover:text-red-700"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : isAdmin ? (
                                                                    <button
                                                                        onClick={() => openAddSlotDialog(day, slotConfig.slot)}
                                                                        className="w-full h-full min-h-[64px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/20 transition-all"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-slate-400 text-sm italic">—</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Add Slot Dialog */}
                <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Timetable Slot</DialogTitle>
                            <DialogDescription>
                                {selectedDay} • Period {selectedSlot} ({config.slots?.find(s => s.slot === selectedSlot)?.start} - {config.slots?.find(s => s.slot === selectedSlot)?.end})
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={slotForm.course_id} onValueChange={(v) => {
                                    const selectedCourse = courses.find(c => c.id.toString() === v);
                                    setSlotForm({ 
                                        ...slotForm, 
                                        course_id: v, 
                                        teacher_id: selectedCourse?.teacher_id?.toString() || "" 
                                    });
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.code} - {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned Teacher</Label>
                                <Select value={slotForm.teacher_id} onValueChange={(v) => setSlotForm({ ...slotForm, teacher_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select teacher..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
                            <Button
                                onClick={handleAddSlot}
                                className="bg-[#1a365d]"
                                disabled={!slotForm.course_id || !slotForm.teacher_id}
                            >
                                Add Slot
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
