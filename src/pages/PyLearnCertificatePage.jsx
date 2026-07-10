import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { apiClient, useAuth } from '../App';
import { Loader2, Award, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const PyLearnCertificatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [starsCount, setStarsCount] = useState(0);
  const [certName, setCertName] = useState('');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    checkExamUnlock();
  }, []);

  const checkExamUnlock = async () => {
    try {
      const res = await apiClient.get('/student/pylearn/progress');
      setStarsCount(res.data.stars.length);

      const passedAttempt = res.data.certAttempts?.find(a => a.passed === 1 || a.passed === true);
      if (passedAttempt) {
        setResult({
          score: passedAttempt.score,
          passed: true,
          correctAnswersCount: passedAttempt.score,
          totalQuestions: 30
        });
        setCertName(passedAttempt.certificate_name);
      } else if (res.data.stars.length < 12) {
        toast.error('Exam is locked. Earn all 12 stars first!');
        navigate('/student/pylearn');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not verify progress');
      navigate('/student/pylearn');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!certName.trim()) {
      toast.error('Please enter your preferred printed name.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get('/student/pylearn/certificate/questions');
      setQuestions(res.data);
      setStarted(true);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmitExam = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      if (!window.confirm(`You answered ${answeredCount} of ${questions.length}. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId, selectedAnswer
      }));

      const res = await apiClient.post('/student/pylearn/certificate/submit', {
        certificateName: certName,
        answers: formattedAnswers
      });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="Student">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="Student">
      <div className="max-w-3xl mx-auto pb-12">
        <button 
          onClick={() => navigate('/student/pylearn')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </button>

        {result && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
            {result.passed ? (
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Congratulations! You Passed!</h1>
                <p className="text-sm text-slate-500">
                  You scored <strong className="text-emerald-600">{result.score} / {result.totalQuestions}</strong>.
                </p>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl mt-6">
                  <h3 className="text-xl font-serif text-slate-900 mb-2">Certificate of Completion</h3>
                  <p className="text-slate-500 text-sm">Presented to</p>
                  <p className="text-2xl font-bold text-slate-900 my-4">{certName}</p>
                  <p className="text-slate-500 text-sm">For mastering Python Programming</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600">
                  <AlertCircle className="w-12 h-12" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Exam Not Passed</h1>
                <p className="text-sm text-slate-500">
                  You scored <strong className="text-red-600">{result.score} / {result.totalQuestions}</strong>.
                </p>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                  <span className="font-bold text-amber-800 text-sm">Warning:</span>
                  <p className="text-amber-700 text-xs mt-1">
                    Your module progress has been reset. You must try again and re-earn your module stars to unlock this exam.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/student/pylearn')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-lg w-full"
                >
                  Return to Modules
                </button>
              </div>
            )}
          </div>
        )}

        {!result && !started && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
            <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Python Certification</h2>
            <p className="text-slate-500 text-sm mb-8">You have unlocked the final assessment.</p>
            
            <div className="max-w-sm mx-auto space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Certificate Name</label>
                <input 
                  type="text"
                  placeholder="Enter your full name..."
                  value={certName}
                  onChange={e => setCertName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                />
              </div>
              <button 
                onClick={handleStartExam}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-lg"
              >
                Begin Exam
              </button>
            </div>
          </div>
        )}

        {!result && started && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
              <span className="font-bold text-slate-900">Final Assessment</span>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="font-semibold text-slate-900 mb-4">{idx + 1}. {q.text}</p>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                          isSelected ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {q[`option${opt}`]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button 
              disabled={submitting}
              onClick={handleSubmitExam}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              Submit Assessment
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
