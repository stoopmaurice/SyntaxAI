
import React, { useState, useEffect, useRef } from 'react';
import { LANGUAGES, ICONS, Logo } from './constants.tsx';
import { generateCodeStream, updateCodeStream } from './services/gemini.ts';
import { ScriptResult, GenerationState, ChatMessage } from './types.ts';
import { db } from './services/database.ts';
import PreviewWorkspace from './components/PreviewWorkspace.tsx';
import Auth from './components/Auth.tsx';

const MASTER_KEY = 'DENNISdeKAT211012!';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Auto-detect');
  const [history, setHistory] = useState<ScriptResult[]>([]);
  const [activeScript, setActiveScript] = useState<ScriptResult | null>(null);
  
  const [genState, setGenState] = useState<GenerationState & { detectedLanguage: string }>({
    isGenerating: false,
    error: null,
    currentStream: '',
    detectedLanguage: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (db.isSessionActive()) {
        const user = db.getUser();
        if (user) {
          setIsLoggedIn(true);
          const saved = await db.getScripts();
          setHistory(saved);
        }
      }
      setIsAuthenticating(false);
    };
    checkSession();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeScript?.history, genState.currentStream]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    db.setSessionActive(true);
    db.getScripts().then(setHistory);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    db.setSessionActive(false);
    setActiveScript(null);
  };

  const processStream = async (streamer: AsyncGenerator<string>, initialLang: string) => {
    let fullBuffer = '';
    let languageExtracted = false;
    let actualLanguage = initialLang;

    for await (const chunk of streamer) {
      fullBuffer += chunk;
      if (!languageExtracted && fullBuffer.includes('--')) {
        const parts = fullBuffer.split('--');
        actualLanguage = parts[0].trim();
        const rest = parts.slice(1).join('--').trimStart();
        languageExtracted = true;
        setGenState(prev => ({ ...prev, detectedLanguage: actualLanguage, currentStream: rest }));
      } else if (languageExtracted) {
        const displayCode = fullBuffer.split('--').slice(1).join('--').trimStart();
        setGenState(prev => ({ ...prev, currentStream: displayCode }));
      } else {
        setGenState(prev => ({ ...prev, currentStream: fullBuffer }));
      }
    }
    return { fullBuffer, actualLanguage, languageExtracted };
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || genState.isGenerating) return;

    setGenState({ isGenerating: true, error: null, currentStream: '', detectedLanguage: selectedLanguage });
    try {
      const streamer = generateCodeStream(selectedLanguage, prompt);
      const { fullBuffer, actualLanguage, languageExtracted } = await processStream(streamer, selectedLanguage);
      
      const finalCode = languageExtracted ? fullBuffer.split('--').slice(1).join('--').trimStart() : fullBuffer;
      
      const newResult: ScriptResult = {
        id: crypto.randomUUID(),
        userId: 'local-user',
        language: actualLanguage === 'Auto-detect' ? 'Code' : actualLanguage,
        code: finalCode,
        description: prompt,
        timestamp: Date.now(),
        history: [{ role: 'user', text: prompt }, { role: 'model', text: fullBuffer }]
      };

      await db.saveScript(newResult);
      setHistory(prev => [newResult, ...prev]);
      setActiveScript(newResult);
      setPrompt('');
      setGenState(prev => ({ ...prev, isGenerating: false, currentStream: '', detectedLanguage: '' }));
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isGenerating: false, error: err.message || "Connection failed. Check API key." }));
    }
  };

  const handleUpdate = async () => {
    if (!activeScript || !prompt.trim() || genState.isGenerating) return;
    const currentPrompt = prompt;
    setPrompt('');

    setGenState({ isGenerating: true, error: null, currentStream: '', detectedLanguage: activeScript.language });
    try {
      const streamer = updateCodeStream(activeScript.history, currentPrompt, activeScript.language);
      const { fullBuffer } = await processStream(streamer, activeScript.language);
      const finalCode = fullBuffer.includes('--') ? fullBuffer.split('--').slice(1).join('--').trimStart() : fullBuffer;
      
      const updatedScript: ScriptResult = {
        ...activeScript,
        code: finalCode,
        history: [...activeScript.history, { role: 'user', text: currentPrompt }, { role: 'model', text: fullBuffer }]
      };

      await db.saveScript(updatedScript);
      setHistory(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
      setActiveScript(updatedScript);
      setGenState(prev => ({ ...prev, isGenerating: false, currentStream: '', detectedLanguage: '' }));
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isGenerating: false, error: err.message }));
    }
  };

  if (isAuthenticating) return <div className="h-screen flex items-center justify-center bg-[#070510]"><Logo className="animate-spin opacity-20" /></div>;
  if (!isLoggedIn) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen flex bg-[#070510] text-slate-300 overflow-hidden">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'} flex flex-col border-r border-white/5 bg-[#0d0a1a]/50`}>
        <div className="p-6 flex items-center space-x-3">
          <Logo className="w-8 h-8" />
          {!isSidebarCollapsed && <span className="font-black text-white uppercase tracking-tighter">SyntaxAI</span>}
        </div>
        <div className="px-4 mb-4">
          <button onClick={() => setActiveScript(null)} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 p-3 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all">
            <ICONS.Sparkles className="w-4 h-4" />
            {!isSidebarCollapsed && <span>New Project</span>}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {history.map(s => (
            <div key={s.id} onClick={() => setActiveScript(s)} className={`p-3 rounded-xl cursor-pointer transition-all ${activeScript?.id === s.id ? 'bg-indigo-600/10 border border-indigo-600/20' : 'hover:bg-white/5'}`}>
              <p className="text-[9px] font-black uppercase text-indigo-400">{s.language}</p>
              {!isSidebarCollapsed && <p className="text-xs truncate text-slate-400">{s.description}</p>}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-white transition-all">
            <ICONS.LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase">Exit Session</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!activeScript && !genState.isGenerating ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-xl w-full space-y-8 text-center">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-white tracking-tighter">Code with <span className="text-indigo-500">Precision.</span></h2>
                <p className="text-slate-500">Expert architecture generation for any language.</p>
              </div>
              
              <div className="bg-[#0d0a1a] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                {genState.error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Error: {genState.error}
                  </div>
                )}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-2">Target Language</label>
                  <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 outline-none focus:border-indigo-500 text-white appearance-none cursor-pointer">
                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#0d0a1a]">{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-2">Requirements</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the script you need..." className="w-full h-40 bg-black/50 border border-white/5 rounded-2xl p-6 outline-none focus:border-indigo-500 text-white resize-none" />
                </div>
                <button onClick={handleGenerate} disabled={!prompt.trim() || genState.isGenerating} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50">
                  {genState.isGenerating ? 'Synthesizing Architecture...' : 'Start Build Process'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-12 overflow-y-auto custom-scrollbar flex-1">
              <div className="max-w-5xl mx-auto space-y-12">
                {activeScript?.history.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={msg.role === 'user' ? 'max-w-md bg-indigo-600 p-5 rounded-2xl rounded-tr-none text-white text-sm font-medium' : 'w-full'}>
                      {msg.role === 'user' ? msg.text : <PreviewWorkspace code={msg.text.includes('--') ? msg.text.split('--').slice(1).join('--').trimStart() : msg.text} language={activeScript.language} />}
                    </div>
                  </div>
                ))}
                {genState.isGenerating && (
                  <div className="w-full space-y-4 animate-pulse">
                    <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                      <span>Streaming Kernel v3...</span>
                    </div>
                    <PreviewWorkspace code={genState.currentStream || "// Initializing neural link..."} language={genState.detectedLanguage || activeScript?.language || ""} />
                  </div>
                )}
                <div ref={chatEndRef} className="h-20" />
              </div>
            </div>
            {/* Input Overlay */}
            <div className="p-8 bg-gradient-to-t from-[#070510] to-transparent">
              <div className="max-w-4xl mx-auto relative">
                <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdate()} placeholder="Refine logic or add features..." className="w-full bg-[#0d0a1a] border border-white/10 rounded-full px-8 py-5 text-sm text-white outline-none focus:border-indigo-500 transition-all shadow-2xl" />
                <button onClick={handleUpdate} className="absolute right-2 top-2 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><ICONS.ChevronRight className="w-5 h-5 -rotate-90" /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
