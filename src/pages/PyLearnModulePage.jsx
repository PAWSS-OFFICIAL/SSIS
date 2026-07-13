import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { ChevronLeft } from 'lucide-react';

const MODULE_TITLES = {
  '1': 'Getting Started',
  '2': 'Variables & Data Types',
  '3': 'Operators',
  '4': 'Control Flow',
  '5': 'Functions',
  '6': 'Data Structures',
  '7': 'Object-Oriented Programming',
  '8': 'Inheritance & OOP',
  '9': 'Files & Exceptions',
  '10': 'Modules & Standard Library',
  '11': 'Advanced Python',
  '12': 'Projects'
};

export const PyLearnModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const title = MODULE_TITLES[moduleId] || `Module ${moduleId}`;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-50">
      {/* Custom Header for PyLearn */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/student/pylearn')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition text-sm font-medium group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="SSIS Logo" className="w-6 h-6 rounded object-contain" />
            <span className="font-bold text-slate-800 text-sm tracking-tight">SSIS PyLearn</span>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
          {title}
        </div>
      </div>

      {/* PyLearn iframe */}
      <iframe
        src={`/pylearn/python-module-${moduleId}.html`}
        title={`Python Module ${moduleId}`}
        className="w-full flex-1 border-none"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
};
