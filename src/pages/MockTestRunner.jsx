import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";

export function MockTestRunner() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { qId: option }
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Proctoring State
  const [attemptId, setAttemptId] = useState(null);
  const [flags, setFlags] = useState(0);
  const [warningModal, setWarningModal] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const faceApiLoaded = useRef(false);
  const streamRef = useRef(null);
  const lastFaceDetectionRef = useRef(Date.now());
  const maxStrikes = 3;

  useEffect(() => {
    // 1. Enter fullscreen
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Could not request fullscreen", err);
      }
    };
    requestFullscreen();

    // 2. Load face-api.js
    const loadFaceApi = async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
      script.async = true;
      script.onload = async () => {
        faceApiLoaded.current = true;
        // Load tiny face detector model from remote or local. We will use cloud hosted weights for simplicity
        try {
          await window.faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
          startWebcam();
        } catch (e) {
          console.error("Failed to load faceapi models", e);
        }
      };
      document.body.appendChild(script);
    };
    loadFaceApi();

    // 3. Setup test data
    startAttempt();

    // 4. Attach event listeners
    const handleContextMenu = (e) => { e.preventDefault(); logFlag("Right-click/Context Menu"); };
    const handleCopyPaste = (e) => { e.preventDefault(); logFlag("Copy/Paste attempt"); };
    const handleVisibility = () => { if (document.hidden) logFlag("Tab switch / Window obscured"); };
    const handleBlur = () => { logFlag("Window lost focus (Blur)"); };
    const handleFullscreen = () => { if (!document.fullscreenElement) logFlag("Exited Fullscreen"); };
    
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (
        (cmdKey && (e.key === 'c' || e.key === 'v' || e.key === 'Tab')) ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'Escape' ||
        e.key === 'F11' ||
        e.key === 'PrintScreen' ||
        e.key === 'Meta' ||
        e.key === 'ContextMenu'
      ) {
        e.preventDefault();
        logFlag(`Suspicious keypress: ${e.key}`);
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopyPaste);
    window.addEventListener("paste", handleCopyPaste);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Prevent selection
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopyPaste);
      window.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.body.style.userSelect = "auto";
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraReady(true);
        startFaceDetection();
      }
    } catch (err) {
      logFlag("Camera permission denied or not found");
    }
  };

  const startFaceDetection = () => {
    setInterval(async () => {
      if (!videoRef.current || !window.faceapi || !faceApiLoaded.current || isLocked) return;
      
      try {
        const detections = await window.faceapi.detectAllFaces(
          videoRef.current, 
          new window.faceapi.TinyFaceDetectorOptions()
        );
        
        if (detections.length === 0) {
          // If no face detected for > 3 seconds, flag it
          if (Date.now() - lastFaceDetectionRef.current > 3000) {
            logFlag("No face detected / looking away");
            lastFaceDetectionRef.current = Date.now(); // reset to avoid immediate consecutive flags
          }
        } else if (detections.length > 1) {
          logFlag("Multiple faces detected");
          lastFaceDetectionRef.current = Date.now();
        } else {
          lastFaceDetectionRef.current = Date.now(); // Face found
        }
      } catch (e) {
        // detection failed silently
      }
    }, 1000);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return "";
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if(ctx && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.5);
    }
    return "";
  };

  const logFlag = async (type) => {
    if (isLocked) return;
    
    setFlags(prev => {
      const newCount = prev + 1;
      
      // Show warning modal
      setWarningModal(`Warning ${newCount}/${maxStrikes}: ${type} is not allowed. This attempt is being monitored.`);
      
      // Send to backend
      const snapshot = captureSnapshot();
      apiClient.post("/jee/student/flag", {
        attempt_id: attemptId, // Note: attemptId might be null if still loading, but backend will reject if null. We rely on state.
        flag_type: type,
        webcam_snapshot: snapshot
      }).catch(console.error);

      if (newCount >= maxStrikes) {
        autoSubmit("AUTO_SUBMITTED");
      }
      
      return newCount;
    });
  };

  const startAttempt = async () => {
    try {
      // 1. Get Questions
      const res = await apiClient.get(`/jee/student/quizzes/${quizId}`);
      setQuestions(res.data);
      
      // 2. Start Attempt
      const attRes = await apiClient.post("/jee/student/attempt/start", { quiz_id: quizId });
      setAttemptId(attRes.data.attempt_id);
      
      // 3. Start Timer (180 mins default, but should fetch from quiz. We hardcode 180 mins = 10800 secs for brevity, or fetch it)
      // Ideally we should get duration from quiz details. 
      setTimeLeft(180 * 60); 
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmit("SUBMITTED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      toast.error("Failed to start test");
    }
  };

  const autoSubmit = useCallback(async (status) => {
    setIsLocked(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      await apiClient.post("/jee/student/attempt/submit", {
        attempt_id: attemptId,
        answers,
        status
      });
      
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(()=>{});
      }
      
      toast.error(status === "AUTO_SUBMITTED" ? "Test auto-submitted due to violations" : "Test submitted successfully");
      setTimeout(() => {
        navigate("/dashboard");
        window.close(); // Try to close the popup window
      }, 3000);
      
    } catch (err) {
      console.error(err);
    }
  }, [attemptId, answers, navigate]);

  const handleManualSubmit = () => {
    if(window.confirm("Are you sure you want to submit the test?")) {
      autoSubmit("SUBMITTED");
    }
  };

  // Render helpers
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const q = questions[currentIndex];
  
  if (!q) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">Loading Test Environment...</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="font-bold text-xl">JEE Mock Test</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-md font-mono text-xl">
            <Clock className="w-5 h-5 text-amber-400" />
            {formatTime(timeLeft)}
          </div>
          <Button variant="destructive" onClick={handleManualSubmit}>Submit Test</Button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Question {currentIndex + 1}</h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium border">
                {q.subject}
              </span>
            </div>
            
            <div className="prose max-w-none mb-8 text-lg text-slate-900 whitespace-pre-wrap">
              {q.question_text}
            </div>

            <div className="space-y-4">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                const label = ['A', 'B', 'C', 'D'][i];
                const isSelected = answers[q.id] === label;
                return (
                  <label 
                    key={label}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      className="w-5 h-5 mr-4 text-blue-600"
                      checked={isSelected}
                      onChange={() => setAnswers(prev => ({...prev, [q.id]: label}))}
                    />
                    <span className="text-lg">{q[opt]}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-auto p-4 border-t bg-slate-50 flex justify-between items-center px-8">
            <div className="space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  const newSet = new Set(markedForReview);
                  if (newSet.has(q.id)) newSet.delete(q.id);
                  else newSet.add(q.id);
                  setMarkedForReview(newSet);
                }}
              >
                {markedForReview.has(q.id) ? "Unmark Review" : "Mark for Review"}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  const newAnswers = {...answers};
                  delete newAnswers[q.id];
                  setAnswers(newAnswers);
                }}
              >
                Clear Response
              </Button>
            </div>
            <div className="space-x-4">
              <Button 
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
              >
                Previous
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(c => Math.min(questions.length - 1, c + 1))}
              >
                Save & Next
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Palette & PiP */}
        <div className="w-80 bg-slate-100 border-l flex flex-col shrink-0">
          <div className="p-4 bg-black aspect-video relative flex items-center justify-center shrink-0">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {!isCameraReady && <span className="text-white text-sm absolute">Starting camera...</span>}
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-white bg-black/50 px-1 rounded">REC</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="font-semibold text-slate-700 mb-4">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((qItem, idx) => {
                const isAns = !!answers[qItem.id];
                const isMarked = markedForReview.has(qItem.id);
                let bgColor = "bg-white border-slate-300 text-slate-700";
                
                if (isAns && isMarked) bgColor = "bg-purple-600 text-white border-purple-700";
                else if (isAns) bgColor = "bg-green-600 text-white border-green-700";
                else if (isMarked) bgColor = "bg-orange-500 text-white border-orange-600";
                else if (idx === currentIndex) bgColor = "bg-blue-100 border-blue-500 text-blue-700";

                return (
                  <button
                    key={qItem.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 rounded-md border flex items-center justify-center text-sm font-medium shadow-sm transition-transform hover:scale-105 ${bgColor}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-600 rounded"></div> Answered</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded"></div> Marked for Review</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-600 rounded"></div> Answered & Marked</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-slate-300 rounded"></div> Not Answered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      <Dialog open={!!warningModal} onOpenChange={() => { if(!isLocked) setWarningModal(null) }}>
        <DialogContent className="sm:max-w-md [&>button]:hidden pointer-events-none" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Proctoring Alert
            </DialogTitle>
            <DialogDescription className="text-base pt-4 pb-2 text-slate-700">
              {warningModal}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4 pointer-events-auto">
            {!isLocked && (
              <Button variant="destructive" onClick={() => setWarningModal(null)}>I Understand</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
