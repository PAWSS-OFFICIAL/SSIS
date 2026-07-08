import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Trash2, Plus, School } from "lucide-react";

export const ClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newBenchCount, setNewBenchCount] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const res = await apiClient.get("/classrooms");
      setClassrooms(res.data);
    } catch (e) {
      toast.error("Failed to fetch classrooms");
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleAddClassroom = async (e) => {
    e.preventDefault();
    if (!newRoomName || !newCapacity || !newBenchCount) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/classrooms", {
        name: newRoomName,
        capacity: parseInt(newCapacity),
        bench_count: parseInt(newBenchCount)
      });
      toast.success("Classroom added successfully.");
      setNewRoomName("");
      setNewCapacity("");
      setNewBenchCount("");
      fetchClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add classroom.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) return;
    try {
      await apiClient.delete(`/classrooms/${roomId}`);
      toast.success("Classroom deleted successfully.");
      fetchClassrooms();
    } catch (e) {
      toast.error("Failed to delete classroom.");
    }
  };

  return (
    <DashboardLayout role="Admin">
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Classrooms Management</h1>
          <p className="text-slate-500 mt-1">Configure physical classrooms, exam halls, capacities, and bench layouts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Classroom Form */}
          <div>
            <Card className="border border-slate-200 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Add Classroom
                </CardTitle>
                <CardDescription>Create a physical room for classes or exam seating.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddClassroom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name / Number</Label>
                    <Input id="roomName" placeholder="E.g. Room 101, Lab A" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Total Capacity (Students)</Label>
                    <Input id="capacity" type="number" placeholder="E.g. 40" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="benchCount">Bench Count</Label>
                    <Input id="benchCount" type="number" placeholder="E.g. 20" value={newBenchCount} onChange={e => setNewBenchCount(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full bg-[#1a365d] hover:bg-[#102a43]" disabled={loading}>
                    {loading ? "Adding..." : "Create Classroom"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Classroom List Table */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5 text-slate-700" />
                  Active Classrooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Name</TableHead>
                      <TableHead className="text-center">Total Capacity</TableHead>
                      <TableHead className="text-center">Bench Count</TableHead>
                      <TableHead className="w-20 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classrooms.map(room => (
                      <TableRow key={room.id}>
                        <TableCell className="font-semibold text-slate-800">{room.name}</TableCell>
                        <TableCell className="text-center font-medium text-slate-700">{room.capacity} students</TableCell>
                        <TableCell className="text-center text-slate-600">{room.bench_count} benches</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteClassroom(room.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {classrooms.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">No classrooms configured yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
