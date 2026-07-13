import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "../../App";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export function PostQuizTab() {
  const [banks, setBanks] = useState([]);
  const [deployData, setDeployData] = useState({
    title: "",
    duration_minutes: 180,
    deadline: "",
    target_type: "All",
    target_id: "",
    bank_ids: []
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deployData.title || deployData.bank_ids.length === 0) {
      return toast.error("Title and at least one question bank are required");
    }
    
    // Convert target_id to number if it exists
    const payload = { ...deployData };
    if (payload.target_id) {
      payload.target_id = parseInt(payload.target_id, 10);
    } else {
      payload.target_id = null;
    }

    try {
      await apiClient.post("/jee/admin/deploy", payload);
      toast.success("Quiz Deployed successfully!");
      setDeployData({
        title: "", duration_minutes: 180, deadline: "", target_type: "All", target_id: "", bank_ids: []
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to deploy quiz");
    }
  };

  const handleBankSelect = (e) => {
    // Collect all selected options
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value, 10));
      }
    }
    setDeployData({...deployData, bank_ids: selected});
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Deploy JEE Mock Test</CardTitle>
        <CardDescription>Configure and deploy a quiz to students</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Quiz Title</Label>
            <Input required value={deployData.title} onChange={e => setDeployData({...deployData, title: e.target.value})} placeholder="e.g. Weekly JEE Mock - Set 1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" required min="1" value={deployData.duration_minutes} onChange={e => setDeployData({...deployData, duration_minutes: parseInt(e.target.value)})} />
              <p className="text-xs text-muted-foreground">Default recommended is 180 (3 hours)</p>
            </div>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Input type="datetime-local" value={deployData.deadline} onChange={e => setDeployData({...deployData, deadline: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Question Banks (Hold Ctrl/Cmd to select multiple)</Label>
            <select 
              multiple 
              className="w-full p-2 border rounded-md min-h-[120px] focus:outline-none focus:ring-2 focus:ring-slate-900" 
              value={deployData.bank_ids.map(String)} 
              onChange={handleBankSelect}
            >
              {banks.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.question_count} Qs)</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <Label>Assign To</Label>
            <RadioGroup value={deployData.target_type} onValueChange={v => setDeployData({...deployData, target_type: v})} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="All" id="r1" />
                <Label htmlFor="r1">All Students</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Class" id="r2" />
                <Label htmlFor="r2">Specific Class</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Section" id="r3" />
                <Label htmlFor="r3">Specific Section</Label>
              </div>
            </RadioGroup>
          </div>

          {deployData.target_type !== "All" && (
            <div className="space-y-2 border-l-2 pl-4 ml-2 border-slate-300">
              <Label>{deployData.target_type} ID</Label>
              <Input type="number" required placeholder={`Enter ${deployData.target_type} ID...`} value={deployData.target_id} onChange={e => setDeployData({...deployData, target_id: e.target.value})} />
              <p className="text-xs text-muted-foreground">For simplicity in this demo, enter the raw ID.</p>
            </div>
          )}

          <Button type="submit" className="w-full">Confirm Deployment</Button>
        </form>
      </CardContent>
    </Card>
  );
}
