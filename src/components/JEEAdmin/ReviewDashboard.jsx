import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "../../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function ReviewDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get("/jee/admin/reviews");
      setReviews(res.data);
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proctoring Review Dashboard</CardTitle>
        <CardDescription>Review student attempts and flag violations</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Quiz</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags Count</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No attempts found.</TableCell>
              </TableRow>
            ) : reviews.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell className="font-medium">{attempt.student_name}</TableCell>
                <TableCell>{attempt.quiz_title}</TableCell>
                <TableCell>{attempt.score}</TableCell>
                <TableCell>
                  {attempt.status === 'AUTO_SUBMITTED' ? (
                    <Badge variant="destructive">Auto-Submitted</Badge>
                  ) : attempt.status === 'SUBMITTED' ? (
                    <Badge variant="default" className="bg-green-600">Submitted</Badge>
                  ) : (
                    <Badge variant="secondary">In Progress</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {attempt.flags.length > 0 ? (
                      <><AlertTriangle className="w-4 h-4 text-amber-500" /> {attempt.flags.length}</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 text-green-500" /> 0</>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={attempt.flags.length === 0}>
                        View Flags
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Review Flags for {attempt.student_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 mt-4">
                        {attempt.flags.map((flag, idx) => (
                          <Card key={flag.id} className="border-red-100 bg-red-50/30">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm text-red-800 flex justify-between">
                                <span>Flag #{idx + 1}: {flag.flag_type}</span>
                                <span className="text-xs font-normal text-slate-500">{new Date(flag.timestamp).toLocaleString()}</span>
                              </CardTitle>
                            </CardHeader>
                            {flag.webcam_snapshot && (
                              <CardContent>
                                <img src={flag.webcam_snapshot} alt="Proctoring Snapshot" className="rounded-md border border-slate-200 max-h-64 object-contain" />
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
