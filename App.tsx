
import React, { useState, useEffect, useMemo } from 'react';
import { Verb, ViewMode, ConfidenceLevel } from './types';
import { fetchVerbList } from './services/geminiService';
import VerbCard from './components/VerbCard';
import { INITIAL_VERBS } from './constants/defaultVerbs';

const App: React.FC = () => {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('practice');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session State
  const [sessionQueue, setSessionQueue] = useState<Verb[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Initialize from LocalStorage or seed with default data
  useEffect(() => {
    const savedVerbs = localStorage.getItem('verbmaster_anki_verbs');
    if (savedVerbs) {
      setVerbs(JSON.parse(savedVerbs));
    } else {
      // Seed with 90 verbs (3 batches of 30)
      const seededVerbs = INITIAL_VERBS.map((v, idx) => ({
        ...v,
        id: `seed-${idx}`,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: 0,
        status: 'new'
      } as Verb));
      setVerbs(seededVerbs);
      localStorage.setItem('verbmaster_anki_verbs', JSON.stringify(seededVerbs));
    }
  }, []);

  const saveVerbs = (newList: Verb[]) => {
    setVerbs(newList);
    localStorage.setItem('verbmaster_anki_verbs', JSON.stringify(newList));
  };

  // SRS Logic (SM-2 Algorithm simplified)
  const handleAnswer = (verbId: string, confidence: ConfidenceLevel) => {
    const now = Date.now();
    const updatedVerbs = verbs.map(v => {
      if (v.id !== verbId) return v;

      let { interval, easeFactor, repetitions, status } = v;

      if (confidence === 'again') {
        repetitions = 0;
        interval = 0; // Review in 1 minute (effectively immediately in this view)
        status = 'learning';
      } else {
        // Quality map: again=0, hard=3, good=4, easy=5
        const qualityMap = { hard: 3, good: 4, easy: 5 };
        const quality = qualityMap[confidence];

        // Update Ease Factor
        easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

        if (repetitions === 0) {
          interval = confidence === 'easy' ? 4 : 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }

        repetitions++;
        status = interval > 21 ? 'mastered' : 'review';
      }

      const nextReview = now + interval * 24 * 60 * 60 * 1000;

      return { ...v, interval, easeFactor, repetitions, nextReview, status };
    });

    saveVerbs(updatedVerbs);
  };

  const handleDownloadMore = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newList = await fetchVerbList(30);
      const enhancedList = newList.map(v => ({
        ...v,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: 0,
        status: 'new' as const
      }));
      saveVerbs([...verbs, ...enhancedList]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch verbs.');
    } finally {
      setIsLoading(false);
    }
  };

  const dueVerbs = useMemo(() => {
    const now = Date.now();
    return verbs.filter(v => v.nextReview <= now).sort((a, b) => {
      // Prioritize: new verbs, then oldest reviews
      if (a.status === 'new' && b.status !== 'new') return -1;
      if (b.status === 'new' && a.status !== 'new') return 1;
      return a.nextReview - b.nextReview;
    });
  }, [verbs]);

  const stats = useMemo(() => {
    return {
      new: verbs.filter(v => v.status === 'new').length,
      learning: verbs.filter(v => v.status === 'learning' || (v.status === 'review' && v.interval < 5)).length,
      mastered: verbs.filter(v => v.status === 'mastered').length,
      total: verbs.length,
      due: dueVerbs.length
    };
  }, [verbs, dueVerbs]);

  // Session Management
  const startSession = () => {
    const sessionBatch = dueVerbs.slice(0, 10);
    setSessionQueue(sessionBatch);
    setCurrentCardIndex(0);
    setIsSessionComplete(false);
  };

  const handleSessionAnswer = (level: ConfidenceLevel) => {
    const currentVerb = sessionQueue[currentCardIndex];
    handleAnswer(currentVerb.id, level);

    if (currentCardIndex < sessionQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setIsSessionComplete(true);
    }
  };

  const closeSession = () => {
    setSessionQueue([]);
    setCurrentCardIndex(0);
    setIsSessionComplete(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 pt-safe px-6 py-4 flex items-center justify-between sticky top-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100 transform -rotate-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">VerbMaster<span className="text-indigo-600">Pro</span></h1>
        </div>

        <nav className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => {
              setViewMode('practice');
              if (!sessionQueue.length) setIsSessionComplete(false);
            }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'practice' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Practice
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Deck
          </button>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-3 mb-10">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due</p>
            <p className="text-2xl font-black text-indigo-600">{stats.due}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New</p>
            <p className="text-2xl font-black text-blue-500">{stats.new}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Learning</p>
            <p className="text-2xl font-black text-orange-500">{stats.learning}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mastered</p>
            <p className="text-2xl font-black text-green-500">{stats.mastered}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-20 w-20 border-t-4 border-indigo-600"></div>
            </div>
            <p className="mt-8 text-slate-500 font-black uppercase tracking-widest text-sm">Expanding Library...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2rem] text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-black text-slate-800 text-xl mb-2">Sync Error</p>
            <p className="text-slate-600 mb-6">{error}</p>
            <button onClick={handleDownloadMore} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">
              Try Again
            </button>
          </div>
        ) : viewMode === 'practice' ? (
          // Practice Logic
          isSessionComplete ? (
            // Session Complete Screen
            <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-slate-100 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-50">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h3>
              <p className="text-slate-500 mb-10 max-w-xs mx-auto font-medium">You've successfully reviewed {sessionQueue.length} words.</p>
              <button
                onClick={closeSession}
                className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95"
              >
                Continue
              </button>
            </div>
          ) : sessionQueue.length > 0 ? (
            // Active Session
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Session Progress
                </span>
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                  {currentCardIndex + 1} / {sessionQueue.length}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentCardIndex + 1) / sessionQueue.length) * 100}%` }}
                ></div>
              </div>

              <VerbCard
                verb={sessionQueue[currentCardIndex]}
                onAnswer={handleSessionAnswer}
              />
            </div>
          ) : (
            // Idle State (Start Session or Empty)
            stats.due > 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-indigo-100">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">Ready to Practice?</h3>
                <p className="text-slate-500 mb-10 max-w-xs mx-auto font-medium">You have <span className="text-indigo-600 font-bold">{stats.due} verbs</span> due for review.</p>
                <button
                  onClick={startSession}
                  className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  Start Session (10 Verbs)
                </button>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">All Caught Up!</h3>
                <p className="text-slate-500 mb-10 max-w-xs mx-auto font-medium">No reviews due right now. Great job!</p>
                <button
                  onClick={handleDownloadMore}
                  className="bg-white border-2 border-indigo-100 text-indigo-600 px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add 30 More Verbs
                </button>
              </div>
            )
          )
        ) : (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900">Your Deck</h2>
                <p className="text-slate-500 font-medium">All stored verbs in your local database</p>
              </div>
              <button
                onClick={handleDownloadMore}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
              >
                Download Batch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verbs.map((v, i) => (
                <div key={v.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{v.v1}</h4>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${v.status === 'mastered' ? 'bg-green-100 text-green-700' :
                      v.status === 'learning' ? 'bg-orange-100 text-orange-700' :
                        v.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed line-clamp-2">{v.meaning}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">V2</p>
                      <p className="text-sm font-black text-slate-800">{v.v2}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">V3</p>
                      <p className="text-sm font-black text-slate-800">{v.v3}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 px-4 text-center pb-safe">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Algorithm: SM-2 • Storage: LocalDB • Session: 10 Verbs
        </p>
      </footer>
    </div>
  );
};

export default App;
