import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Trash2, Plus, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export const ClassesConfigPage = () => {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [sections, setSections] = useState([]);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get("/classes");
      setClasses(res.data);
    } catch (e) {
      toast.error("Failed to fetch classes");
    }
  };

  const fetchSections = async (classId) => {
    try {
      const res = await apiClient.get(`/classes/${classId}/sections`);
      setSections(res.data);
    } catch (e) {
      toast.error("Failed to fetch sections");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
    }
  }, [selectedClassId]);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await apiClient.post("/classes", { name: newClassName, sequence_order: classes.length });
      toast.success("Class added");
      setNewClassName("");
      fetchClasses();
    } catch (e) {
      toast.error("Failed to add class");
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Are you sure? This will delete all sections and related data.")) return;
    try {
      await apiClient.delete(`/classes/${id}`);
      toast.success("Class deleted");
      if (selectedClassId === id) setSelectedClassId(null);
      fetchClasses();
    } catch (e) {
      toast.error("Failed to delete class");
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName || !selectedClassId) return;
    try {
      await apiClient.post(`/classes/${selectedClassId}/sections`, { name: newSectionName });
      toast.success("Section added");
      setNewSectionName("");
      fetchSections(selectedClassId);
    } catch (e) {
      toast.error("Failed to add section");
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      await apiClient.delete(`/sections/${id}`);
      toast.success("Section deleted");
      fetchSections(selectedClassId);
    } catch (e) {
      toast.error("Failed to delete section");
    }
  };

  return (
    <DashboardLayout role="Admin">
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-800">Classes & Sections Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Classes Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Manage Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddClass} className="flex gap-2 mb-6">
                <Input
                  placeholder="E.g., LKG, 5, 12"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
                <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Add</Button>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(cls => (
                    <TableRow 
                      key={cls.id} 
                      className={`cursor-pointer hover:bg-slate-50 ${selectedClassId === cls.id ? "bg-blue-50" : ""}`}
                      onClick={() => setSelectedClassId(cls.id)}
                    >
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classes.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No classes found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sections Panel */}
          <Card className={!selectedClassId ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Sections for {classes.find(c => c.id === selectedClassId)?.name || "Selected Class"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSection} className="flex gap-2 mb-6">
                <Input
                  placeholder="E.g., A, B, C"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Add</Button>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section Name</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map(sec => (
                    <TableRow key={sec.id}>
                      <TableCell className="font-medium">{sec.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteSection(sec.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sections.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No sections found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
