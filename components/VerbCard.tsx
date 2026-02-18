
import React, { useState, useEffect } from 'react';
import { Verb, ConfidenceLevel } from '../types';

interface VerbCardProps {
  verb: Verb;
  onAnswer: (level: ConfidenceLevel) => void;
}

const VerbCard: React.FC<VerbCardProps> = ({ verb, onAnswer }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [verb]);

  const handleToggle = () => {
    if (!revealed) setRevealed(true);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div 
        onClick={handleToggle}
        className={`relative min-h-[420px] w-full rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] border-4 ${
          revealed ? 'bg-white border-white' : 'bg-indigo-600 border-indigo-500'
        }`}
      >
        <div className="flex flex-col h-full justify-between items-center text-center">
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                revealed ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500 text-indigo-100'
              }`}>
                V1 • Base
              </span>
              {verb.status !== 'new' && (
                <span className={`text-[10px] font-bold uppercase ${revealed ? 'text-slate-400' : 'text-indigo-300'}`}>
                  Interval: {verb.interval}d
                </span>
              )}
            </div>
            
            <h2 className={`text-6xl font-black mt-2 tracking-tight ${revealed ? 'text-slate-900' : 'text-white'}`}>
              {verb.v1}
            </h2>
            <p className={`mt-6 text-xl font-medium leading-relaxed ${revealed ? 'text-slate-500' : 'text-indigo-100 opacity-90'}`}>
              {verb.meaning}
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center w-full py-10">
            {!revealed ? (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 animate-pulse">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-white font-black text-sm uppercase tracking-widest opacity-80">Tap to reveal forms</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">V2 • Past</span>
                  <p className="text-4xl font-black text-slate-800">{verb.v2}</p>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">V3 • Participle</span>
                  <p className="text-4xl font-black text-slate-800">{verb.v3}</p>
                </div>
              </div>
            )}
          </div>

          {revealed && (
            <div className="w-full mt-auto animate-in fade-in slide-in-from-bottom-2 delay-200">
               <div className="p-5 bg-slate-50 rounded-3xl text-left border border-slate-100 mb-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Context</p>
                 <p className="text-slate-700 italic font-medium">"{verb.example}"</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {revealed && (
        <div className="mt-8 grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <button 
            onClick={() => onAnswer('again')}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-red-50 text-red-600 rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="text-[10px] font-black uppercase tracking-tighter">Again</span>
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-red-400">&lt; 1m</span>
          </button>
          <button 
            onClick={() => onAnswer('hard')}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-orange-50 text-orange-600 rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="text-[10px] font-black uppercase tracking-tighter">Hard</span>
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-orange-400">2d</span>
          </button>
          <button 
            onClick={() => onAnswer('good')}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-green-50 text-green-600 rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="text-[10px] font-black uppercase tracking-tighter">Good</span>
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-green-400">4d</span>
          </button>
          <button 
            onClick={() => onAnswer('easy')}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="text-[10px] font-black uppercase tracking-tighter">Easy</span>
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-400">7d</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default VerbCard;
