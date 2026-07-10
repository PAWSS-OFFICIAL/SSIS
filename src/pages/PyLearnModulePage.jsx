import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { apiClient, useAuth } from '../App';
import Editor from '@monaco-editor/react';
import { Loader2, Play, RotateCcw, CheckCircle2, ChevronLeft, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export const PyLearnModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pyodide, setPyodide] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  useEffect(() => {
    fetchModule();
  }, [moduleId]);

  useEffect(() => {
    const initPyodide = async () => {
      setPyodideLoading(true);
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
          document.head.appendChild(script);
          script.onload = async () => {
            // Mask AMD define to prevent conflicts with Monaco Editor
            const oldDefine = window.define;
            window.define = null;
            const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
            window.define = oldDefine;
            setPyodide(py);
            setPyodideLoading(false);
          };
        } else {
          const oldDefine = window.define;
          window.define = null;
          const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
          window.define = oldDefine;
          setPyodide(py);
          setPyodideLoading(false);
        }
      } catch (err) {
        console.error("Pyodide error", err);
        setPyodideLoading(false);
      }
    };
    initPyodide();
  }, []);

  const fetchModule = async () => {
    try {
      const res = await apiClient.get(`/student/pylearn/module/${moduleId}`);
      setModuleData(res.data);
      if (res.data.tasks && res.data.tasks.length > 0) {
        setCode(res.data.tasks[0].starter || '');
      }
    } catch (err) {
      toast.error('Failed to load module');
      navigate('/student/pylearn');
    } finally {
      setLoading(false);
    }
  };

  const runCode = async () => {
    if (!pyodide) {
      toast.error("Python environment is still loading.");
      return;
    }
    
    setIsRunning(true);
    setOutput([]);
    
    let stdoutStr = "";
    
    try {
      pyodide.setStdout({ batched: (msg) => { stdoutStr += msg + "\\n"; }});
      await pyodide.runPythonAsync(code);
      
      setOutput([{ type: 'stdout', msg: stdoutStr }]);
      verifyTask(stdoutStr);
      
    } catch (err) {
      setOutput([{ type: 'error', msg: err.toString() }]);
    } finally {
      setIsRunning(false);
    }
  };

  const verifyTask = async (stdout) => {
    if (!moduleData || !moduleData.tasks || moduleData.tasks.length === 0) return;
    
    const task = moduleData.tasks[currentTaskIndex];
    try {
      const res = await apiClient.post('/student/pylearn/submit', {
        taskId: task.id,
        stdout: stdout
      });
      
      if (res.data.success) {
        toast.success("Correct! Well done.");
        if (res.data.starAwarded) {
          toast.success("You earned a new Star!", { icon: "⭐" });
        }
      } else {
        toast.error("Output didn't match expected. Try again.");
        setOutput(prev => [...prev, { type: 'system', msg: `Expected: ${res.data.expectedOutput}\\nGot: ${res.data.userOutput}` }]);
      }
    } catch (err) {
      console.error(err);
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

  const task = moduleData?.tasks?.[currentTaskIndex];

  return (
    <DashboardLayout role="Student">
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)]">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/student/pylearn')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{moduleData?.title}</h1>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Lesson Panel */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Current Task</h2>
            <div className="prose prose-sm text-slate-600">
              {task?.prompt}
            </div>
          </div>

          {/* IDE Panel */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            {/* Editor */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  main.py
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCode(task?.starter || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                  <button 
                    onClick={runCode}
                    disabled={pyodideLoading || isRunning}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition"
                  >
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run Code
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language="python"
                  theme="vs-light"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on'
                  }}
                />
              </div>
            </div>

            {/* Terminal */}
            <div className="h-48 bg-slate-900 rounded-xl shadow-sm p-4 overflow-y-auto font-mono text-sm text-slate-300">
              <div className="text-slate-500 mb-2">Python 3.11 (WebAssembly)</div>
              {pyodideLoading && <div className="text-blue-400 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Initializing environment...</div>}
              {output.map((out, i) => (
                <div key={i} className={`whitespace-pre-wrap ${out.type === 'error' ? 'text-red-400' : out.type === 'system' ? 'text-yellow-400' : 'text-slate-100'}`}>
                  {out.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
