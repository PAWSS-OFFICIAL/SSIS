import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Clock, Calendar, BookOpen, AlertCircle } from "lucide-react";

export function JEEMockStudent() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await apiClient.get("/jee/student/quizzes");
      setQuizzes(res.data);
    } catch (err) {
      toast.error("Failed to load mock tests");
    } finally {
      setLoading(false);
    }
  };

  const startTest = (quizId) => {
    // Open in new window for full screen
    const width = window.screen.availWidth;
    const height = window.screen.availHeight;
    window.open(`/student/jee-mock/runner/${quizId}`, "_blank", `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height}`);
  };

  if (loading) return <DashboardLayout><div className="p-8 text-center">Loading tests...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">JEE/NEET Mock Tests</h1>
          <p className="text-muted-foreground mt-1">Take proctored mock exams to prepare for your final.</p>
        </div>

        {quizzes.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">No active mock tests</h3>
              <p className="text-slate-500">You don't have any pending mock tests right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const isAttempted = quiz.attempt_status === 'SUBMITTED' || quiz.attempt_status === 'AUTO_SUBMITTED';
              const isExpired = quiz.deadline && new Date(quiz.deadline) < new Date();
              
              return (
                <Card key={quiz.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl leading-tight">{quiz.title}</CardTitle>
                      {isAttempted ? (
                        <Badge variant="default" className="bg-green-600">Attempted</Badge>
                      ) : isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="secondary">Not Attempted</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#1a365d]" />
                        <span>{quiz.duration_minutes} mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1a365d]" />
                        <span>{quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'No Deadline'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <BookOpen className="w-4 h-4 text-[#1a365d]" />
                        Subject Breakdown:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quiz.subject_breakdown ? (
                          Object.entries(quiz.subject_breakdown).map(([sub, cnt]) => (
                            <Badge key={sub} variant="outline" className="text-xs">
                              {sub}: {cnt}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Unknown subjects</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Button 
                      className="w-full bg-[#1a365d] hover:bg-[#2a4a7f]" 
                      disabled={isAttempted || isExpired}
                      onClick={() => startTest(quiz.id)}
                    >
                      {isAttempted ? "View Results" : "Start Test"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
