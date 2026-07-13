import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { apiClient, useAuth } from '../App';
import { Loader2, Star, Award, ChevronRight, Lock, Terminal, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const MODULE_INFOS = [
  { id: 1, title: 'Getting Started', desc: 'Introduction to Python syntax, basic output, comments, and structure.' },
  { id: 2, title: 'Variables & Data Types', desc: 'Learn variables, numbers, strings, booleans, and type conversion.' },
  { id: 3, title: 'Operators', desc: 'Master arithmetic, comparison, logical, membership, and bitwise operators.' },
  { id: 4, title: 'Control Flow', desc: 'Explore conditional statements, loops (for and while), and loop control.' },
  { id: 5, title: 'Functions', desc: 'Learn to define functions, pass arguments, return values, and write lambdas.' },
  { id: 6, title: 'Data Structures', desc: 'Work with core collections: Lists, Tuples, Dictionaries, and Sets.' },
  { id: 7, title: 'Object-Oriented Programming', desc: 'Understand classes, objects, standard methods, and dunder methods.' },
  { id: 8, title: 'Inheritance & OOP', desc: 'Master advanced OOP: inheritance, overriding, encapsulation, and polymorphism.' },
  { id: 9, title: 'Files & Exceptions', desc: 'Learn reading/writing files, handling errors with try-except, and context managers.' },
  { id: 10, title: 'Modules & Standard Library', desc: 'Import packages, use the standard library, write modules, and use pip.' },
  { id: 11, title: 'Advanced Python', desc: 'Understand comprehensions, iterators, generators, decorators, and type hints.' },
  { id: 12, title: 'Projects', desc: 'Build full projects including a guessing game, to-do list, and data summariser.' }
];

export const PyLearnDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState({ completions: [], stars: [], certAttempts: [], unlockedCertificate: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await apiClient.get('/student/pylearn/progress');
      setProgress(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load your progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="Student">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const earnedStars = progress.stars.length;
  const isCertUnlocked = earnedStars >= 12;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Custom Full-Width Header */}
      <div className="bg-[#1a365d] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded">
            <img src="/logo.jpg" alt="SSIS Logo" className="w-8 h-8 rounded-sm object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight">SSIS PyLearn</span>
            <span className="text-xs text-blue-200 font-medium">Complete Python Guide</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          &larr; Back to LMS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-8 px-4">
        {/* HERO SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Terminal className="w-3.5 h-3.5" />
              Python Interactive Course
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Master Python Programming
            </h1>
            <p className="text-slate-500 mt-3 text-sm max-w-xl leading-relaxed">
              Step-by-step interactive lessons, code-along tasks with real-time autograding, and a verified professional certificate on completion.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl w-full sm:w-64 flex flex-col items-center justify-center text-center shadow-sm h-48">
              <div className="text-4xl font-black text-slate-900">{earnedStars}</div>
              <div className="text-xs font-black text-amber-500 uppercase tracking-wider mt-1">Stars Awarded</div>
              
              <div className="w-full bg-slate-200 h-2.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(earnedStars / 12) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">
                {earnedStars === 12 ? 'ALL MODULES COMPLETE' : `${12 - earnedStars} more modules to unlock`}
              </div>
            </div>

            <div className="relative w-full sm:w-64 h-48 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm flex flex-col items-center justify-center p-4">
              {earnedStars < 12 ? (
                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-4 text-center z-10 border border-slate-200/50">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Certificate Locked</span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1 bg-slate-200 px-2 py-0.5 rounded-full">
                    Earn 12 stars to unlock
                  </span>
                </div>
              ) : (
                <div 
                  className="absolute inset-0 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer z-10 transition-colors" 
                  onClick={() => navigate('/student/pylearn/certificate')}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm mb-2">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Take Exam &rarr;
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODULES LIST */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Course Modules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODULE_INFOS.map((mod) => {
              const hasStar = progress.stars.includes(mod.id);
              return (
                <div 
                  key={mod.id}
                  onClick={() => navigate(`/student/pylearn/${mod.id}`)}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-sm hover:shadow transition cursor-pointer flex justify-between gap-4 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Module {mod.id}</span>
                      {hasStar && (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${hasStar ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                      <Star className={`w-5 h-5 ${hasStar ? 'fill-amber-500 stroke-amber-500' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 group-hover:text-blue-600 transition-colors mt-4">
                      Learn <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EXAM CALL TO ACTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-xl flex items-center justify-center ${isCertUnlocked ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Certification Exam
                {!isCertUnlocked && <Lock className="w-4 h-4 text-slate-400" />}
              </h3>
              <p className="text-slate-500 mt-1 text-xs max-w-lg leading-relaxed">
                Earn all 12 module stars to unlock the final 30-question certification exam. Pass the exam to receive your official verified Developer Certificate.
              </p>
            </div>
          </div>
          <div>
            {isCertUnlocked ? (
              <button 
                onClick={() => navigate('/student/pylearn/certificate')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-lg transition shadow-sm whitespace-nowrap"
              >
                Start Exam &rarr;
              </button>
            ) : (
              <button 
                disabled
                className="bg-slate-100 text-slate-400 font-bold text-sm px-6 py-3 rounded-lg cursor-not-allowed whitespace-nowrap border border-slate-200"
              >
                Locked
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
