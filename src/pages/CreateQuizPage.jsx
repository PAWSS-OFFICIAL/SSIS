import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Plus, Trash2, Save, FileText, Code, Loader2 } from "lucide-react";
import { Badge } from "../components/ui/badge";

export const CreateQuizPage = () => {
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState({
        title: "",
        description: "",
        quiz_type: "mcq", // mcq | coding
        time_limit: "30",
        due_date: "",
        due_time: "",
    });

    const [questions, setQuestions] = useState([
        {
            id: 1,
            text: "",
            type: "mcq", // mcq | coding
            marks: 1,
            options: ["", "", "", ""],
            correct: 0,
            // For coding questions
            language: "python",
            test_cases: [{ input: "", output: "" }]
        }
    ]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: questions.length + 1,
                text: "",
                type: quizData.quiz_type === "coding" ? "coding" : "mcq",
                marks: 1,
                options: ["", "", "", ""],
                correct: 0,
                language: "python",
                test_cases: [{ input: "", output: "" }]
            }
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const updated = [...questions];
        updated[qIndex].options[oIndex] = value;
        setQuestions(updated);
    };

    const updateTestCase = (qIndex, tcIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].test_cases[tcIndex][field] = value;
        setQuestions(updated);
    };

    const handleSave = async () => {
        if (!quizData.title || !quizData.due_date) {
            toast.error("Please fill in required quiz details");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Quiz Setup
            const quizRes = await apiClient.post("/quiz/create", {
                ...quizData,
                time_limit: parseInt(quizData.time_limit)
            });
            const quizId = quizRes.data.quiz_id;

            // 2. Add Questions
            const questionPromises = questions.map(q => {
                return apiClient.post("/quiz/question/add", {
                    quiz_id: quizId,
                    question_text: q.text,
                    type: q.type,
                    marks: q.marks,
                    options: q.type === 'mcq' ? {
                        choices: q.options,
                        correct_index: q.correct
                    } : null,
                    correct_option: q.type === 'mcq' ? q.options[q.correct] : null,
                    language: q.language,
                    test_cases: q.test_cases
                });
            });

            await Promise.all(questionPromises);

            toast.success("Quiz created successfully!");
            // Redirect or clear form
            window.location.href = '/teacher';

        } catch (error) {
            console.error(error);
            toast.error("Failed to create quiz");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Create Quiz">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">

                {/* Quiz Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quiz Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Quiz Title</Label>
                            <Input
                                value={quizData.title}
                                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                placeholder="e.g. Mid-Term Assessment"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={quizData.description}
                                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                                placeholder="Instructions for students..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Quiz Type</Label>
                                <Select
                                    value={quizData.quiz_type}
                                    onValueChange={(v) => {
                                        setQuizData({ ...quizData, quiz_type: v });
                                        // Reset questions types if quiz type changes
                                        const updatedQs = questions.map(q => ({ ...q, type: v === 'coding' ? 'coding' : 'mcq' }));
                                        setQuestions(updatedQs);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                                        <SelectItem value="coding">Coding Challenge</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Time Limit (Minutes)</Label>
                                <Input
                                    type="number"
                                    min="5"
                                    value={quizData.time_limit}
                                    onChange={(e) => setQuizData({ ...quizData, time_limit: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={quizData.due_date}
                                    onChange={(e) => setQuizData({ ...quizData, due_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Time</Label>
                                <Input
                                    type="time"
                                    value={quizData.due_time}
                                    onChange={(e) => setQuizData({ ...quizData, due_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Builder */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800">Questions</h3>
                        <Button variant="outline" onClick={addQuestion}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                        </Button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <Card key={qIndex} className="relative">
                            <button
                                onClick={() => removeQuestion(qIndex)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-sm font-medium">
                                        Q{qIndex + 1}
                                    </span>
                                    <Badge variant={q.type === 'coding' ? 'default' : 'secondary'}>
                                        {q.type === 'coding' ? <Code className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                        {q.type.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label>Question Text</Label>
                                    <Textarea
                                        value={q.text}
                                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                        placeholder="Enter question here..."
                                    />
                                </div>

                                {/* MCQ Options */}
                                {q.type === 'mcq' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={q.correct === oIndex}
                                                    onChange={() => updateQuestion(qIndex, 'correct', oIndex)}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <Input
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className={q.correct === oIndex ? "border-indigo-500 bg-indigo-50" : ""}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Coding Test Cases */}
                                {q.type === 'coding' && (
                                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Label>Language</Label>
                                            <Select
                                                value={q.language}
                                                onValueChange={(v) => updateQuestion(qIndex, 'language', v)}
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="python">Python</SelectItem>
                                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                                    <SelectItem value="java">Java</SelectItem>
                                                    <SelectItem value="cpp">C++</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Label>Test Cases (Hidden)</Label>
                                        {q.test_cases.map((tc, tcIndex) => (
                                            <div key={tcIndex} className="flex gap-2">
                                                <Input
                                                    placeholder="Input (e.g. 5, 2)"
                                                    value={tc.input}
                                                    onChange={(e) => updateTestCase(qIndex, tcIndex, 'input', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Expected Output (e.g. 7)"
                                                    value={tc.output}
                                                    onChange={(e) => updateTestCase(qIndex, tcIndex, 'output', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const updated = [...questions];
                                                updated[qIndex].test_cases.push({ input: "", output: "" });
                                                setQuestions(updated);
                                            }}
                                        >
                                            + Add Test Case
                                        </Button>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-4 z-40 lg:pl-64">
                    <Button variant="outline" onClick={() => window.location.href = '/teacher'}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Create Quiz
                    </Button>
                </div>

            </div>
        </DashboardLayout>
    );
};
