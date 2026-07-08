import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Timer, Save, Play, CheckCircle2, AlertTriangle, Monitor } from "lucide-react";

export const AttemptQuizPage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState({}); // { [questionId]: answer }
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Load Quiz Data
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await apiClient.get(`/quiz/${quizId}`);
                const data = res.data;
                setQuiz(data);
                // Parse time limit
                setTimeLeft(parseInt(data.time_limit) * 60); // minutes to seconds

                // Restore drafts from LocalStorage (QuizMasterX Feature)
                const savedDrafts = localStorage.getItem(`quiz_draft_${quizId}`);
                if (savedDrafts) {
                    setAnswers(JSON.parse(savedDrafts));
                    toast.info("Restored your saved progress");
                }
            } catch (error) {
                toast.error("Failed to load quiz");
                navigate("/dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId, navigate]);

    // Timer Countdown
    useEffect(() => {
        if (!timeLeft) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    // Tab Switch Monitor (Hidden AI/Behavior Check)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount((prev) => {
                    const newCount = prev + 1;
                    // Silent log to backend
                    apiClient.post("/quiz/log-behavior", {
                        quiz_id: quizId,
                        type: "tab_switch",
                        timestamp: new Date().toISOString()
                    }).catch(() => { }); // silent fail
                    return newCount;
                });
                toast.warning("Warning: Tab switching is monitored.");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [quizId]);

    // Auto-Save to LocalStorage
    useEffect(() => {
        if (Object.keys(answers).length > 0) {
            localStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify(answers));
        }
    }, [answers, quizId]);

    const handleAnswerChange = (val) => {
        const currentQ = quiz.questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [currentQ.question_id]: val
        });
    };

    const handleRunCode = async () => {
        // Stub for running code against test cases
        // In a real app, send to /compile endpoint
        toast.success("Code compiled successfully (Simulation)");
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await apiClient.post("/quiz/submit", {
                quiz_id: quizId,
                answers: answers,
                tab_switches: tabSwitchCount,
                time_taken: (parseInt(quiz.time_limit || 30) * 60) - timeLeft
            });

            // Clear local storage on success
            localStorage.removeItem(`quiz_draft_${quizId}`);
            toast.success("Quiz submitted successfully!");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !quiz) {
        return (
            <DashboardLayout title="Loading Quiz...">
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    const currentQ = quiz.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header (Minimal for Focus) */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <h1 className="font-bold text-lg text-slate-800">{quiz.title}</h1>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-mono font-bold">
                        <Timer className="w-4 h-4" />
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                    <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                        {submitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Question Navigation */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((q, idx) => (
                                <button
                                    key={q.question_id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`p-2 rounded-lg text-sm font-medium transition-colors border
                                    ${currentQuestionIndex === idx
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : answers[q.question_id]
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Secure Mode Warning */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold">Proctored Session</p>
                                <p className="mt-1">Tab switching and copy-paste behavior is monitored. Irregularities will be flagged.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Active Question Area */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="border-b bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">Question {currentQuestionIndex + 1}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {currentQ.type === 'coding' ? 'Coding Challenge' : 'Multiple Choice'}
                                        </h2>
                                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                            {currentQ.marks} marks
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-slate-800 whitespace-pre-wrap leading-relaxed">{currentQ.question_text}</p>
                        </CardHeader>

                        <CardContent className="flex-1 p-6">
                            {currentQ.type === 'coding' ? (
                                <div className="h-[500px] border rounded-lg overflow-hidden flex flex-col">
                                    <div className="bg-slate-900 p-2 flex items-center justify-between text-white text-xs">
                                        <span>{currentQ.language || 'python'}</span>
                                        <div className="flex gap-2">
                                            <button onClick={handleRunCode} className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                                                <Play className="w-3 h-3" /> Run
                                            </button>
                                            <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                                <Save className="w-3 h-3" /> Save to Local
                                            </button>
                                        </div>
                                    </div>
                                    <Editor
                                        height="100%"
                                        defaultLanguage={currentQ.language || 'python'}
                                        theme="vs-dark"
                                        value={answers[currentQ.question_id] || ""}
                                        onChange={handleAnswerChange}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            scrollBeyondLastLine: false
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentQ.options && JSON.parse(currentQ.options).choices.map((opt, idx) => (
                                        <label
                                            key={idx}
                                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all
                                            ${answers[currentQ.question_id] === opt
                                                    ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                                    : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${currentQ.question_id}`}
                                                value={opt}
                                                checked={answers[currentQ.question_id] === opt}
                                                onChange={() => handleAnswerChange(opt)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                                            />
                                            <span className="ml-3 text-slate-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        <div className="p-4 border-t flex justify-between bg-slate-50/50">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                                disabled={currentQuestionIndex === quiz.questions.length - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};
