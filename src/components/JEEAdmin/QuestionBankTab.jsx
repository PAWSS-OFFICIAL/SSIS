import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "../../App";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { AlertCircle, CheckCircle2, Upload, Plus } from "lucide-react";

export function QuestionBankTab() {
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [questions, setQuestions] = useState([]);

  // Manual entry state
  const [manualData, setManualData] = useState({
    subject: "", question_text: "", option_a: "", option_b: "",
    option_c: "", option_d: "", correct_answer: "", justification: ""
  });

  // Bulk import state
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await apiClient.get("/jee/admin/banks");
      setBanks(res.data);
    } catch (err) {
      toast.error("Failed to load question banks");
    }
  };

  const createBank = async () => {
    if (!newBankName.trim()) return toast.error("Bank name required");
    try {
      await apiClient.post("/jee/admin/banks", { name: newBankName });
      toast.success("Bank created");
      setNewBankName("");
      fetchBanks();
    } catch (err) {
      toast.error("Failed to create bank");
    }
  };

  const fetchQuestions = async (bankId) => {
    if (!bankId) return setQuestions([]);
    try {
      // Actually we don't have an endpoint for this in our backend yet. 
      // But we can implement it later or just leave it out. The spec doesn't strictly ask for it.
      // We will skip viewing existing questions for brevity, as spec says:
      // "Admin QuestionBankTab (manual entry + docx bulk import ... preview/error screen)"
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBankId) return toast.error("Select a question bank first");
    try {
      await apiClient.post("/jee/admin/questions", {
        bank_id: selectedBankId,
        ...manualData
      });
      toast.success("Question added successfully");
      setManualData({
        subject: "", question_text: "", option_a: "", option_b: "",
        option_c: "", option_d: "", correct_answer: "", justification: ""
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add question");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData(null);
  };

  const handlePreview = async () => {
    if (!file) return toast.error("Please select a .docx file");
    
    const formData = new FormData();
    formData.append("file", file);
    setPreviewLoading(true);

    try {
      const res = await apiClient.post("/jee/admin/questions/bulk/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPreviewData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to preview file");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!selectedBankId) return toast.error("Select a question bank first");
    if (!previewData || previewData.questions.length === 0) return toast.error("No valid questions to import");

    try {
      await apiClient.post("/jee/admin/questions/bulk", {
        bank_id: selectedBankId,
        questions: previewData.questions
      });
      toast.success("Bulk import successful!");
      setFile(null);
      setPreviewData(null);
      fetchBanks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to import questions");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Banks</CardTitle>
          <CardDescription>Select an existing bank or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Select Bank</Label>
              <Select value={selectedBankId} onValueChange={(val) => { setSelectedBankId(val); fetchQuestions(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a Question Bank..." />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name} ({b.question_count} questions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Create New Bank</Label>
              <div className="flex gap-2">
                <Input value={newBankName} onChange={e => setNewBankName(e.target.value)} placeholder="e.g. JEE Main 2026 Set A" />
                <Button onClick={createBank}><Plus className="w-4 h-4 mr-2" /> Create</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBankId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={manualData.subject} onValueChange={v => setManualData({...manualData, subject: v})} required>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maths">Maths</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <textarea className="w-full p-2 border rounded-md" rows="3" required value={manualData.question_text} onChange={e => setManualData({...manualData, question_text: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option A</Label>
                    <Input required value={manualData.option_a} onChange={e => setManualData({...manualData, option_a: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Option B</Label>
                    <Input required value={manualData.option_b} onChange={e => setManualData({...manualData, option_b: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Option C</Label>
                    <Input required value={manualData.option_c} onChange={e => setManualData({...manualData, option_c: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Option D</Label>
                    <Input required value={manualData.option_d} onChange={e => setManualData({...manualData, option_d: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer (A/B/C/D or text)</Label>
                  <Input required value={manualData.correct_answer} onChange={e => setManualData({...manualData, correct_answer: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <Label>Justification (Optional)</Label>
                  <textarea className="w-full p-2 border rounded-md" rows="2" value={manualData.justification} onChange={e => setManualData({...manualData, justification: e.target.value})} />
                </div>

                <Button type="submit" className="w-full">Add Question</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Import (.docx)</CardTitle>
              <CardDescription>Upload a Word document matching the specified format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted text-sm rounded-md font-mono">
                Subject: Physics<br/>
                Q: Find max height...<br/>
                A: 10 m<br/>
                B: 20 m<br/>
                C: 40 m<br/>
                D: 15 m<br/>
                Answer: B<br/>
                Justification: Using v^2 = u^2 - 2gh...
              </div>

              <div className="flex gap-2">
                <Input type="file" accept=".docx" onChange={handleFileChange} />
                <Button variant="secondary" onClick={handlePreview} disabled={!file || previewLoading}>
                  {previewLoading ? 'Loading...' : 'Preview'}
                </Button>
              </div>

              {previewData && (
                <div className="space-y-4 mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg">Import Preview</h3>
                  
                  {previewData.errors.length > 0 && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-md space-y-2">
                      <div className="flex items-center font-bold"><AlertCircle className="w-4 h-4 mr-2" /> Issues Detected</div>
                      <ul className="list-disc pl-5 text-sm">
                        {previewData.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Badge variant={previewData.counts.Maths === 15 ? "default" : "destructive"}>Maths: {previewData.counts.Maths}</Badge>
                    <Badge variant={previewData.counts.Physics === 15 ? "default" : "destructive"}>Physics: {previewData.counts.Physics}</Badge>
                    <Badge variant={previewData.counts.Chemistry === 15 ? "default" : "destructive"}>Chemistry: {previewData.counts.Chemistry}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">Total parsed questions: {previewData.questions.length}</p>

                  <Button 
                    onClick={handleBulkSubmit} 
                    disabled={previewData.questions.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Confirm & Save to Bank
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
