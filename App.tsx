
import React, { useState, useEffect, useRef } from 'react';
import { LANGUAGES, ICONS, Logo } from './constants.tsx';
import { generateCodeStream, updateCodeStream } from './services/gemini.ts';
import { ScriptResult, GenerationState, ChatMessage } from './types.ts';
import { db } from './services/database.ts';
import { supabase } from './services/supabase.ts';
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
    const verifySession = async () => {
      if (db.isSessionActive()) {
        const user = db.getUser();
        if (user) {
          if (user.securityKey === MASTER_KEY) {
            setIsLoggedIn(true);
            const saved = await db.getScripts();
            setHistory(saved);
          } else {
            try {
              const { data, error } = await supabase
                .from('keys')
                .select('key_code')
                .eq('key_code', user.securityKey)
                .single();

              if (error || !data) {
                handleLogout();
              } else {
                setIsLoggedIn(true);
                const saved = await db.getScripts();
                setHistory(saved);
              }
            } catch (e) {
              handleLogout();
            }
          }
        } else {
          handleLogout();
        }
      }
      setIsAuthenticating(false);
    };

    verifySession();
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
      setGenState(prev => ({ ...prev, isGenerating: false, error: err.message }));
    }
  };

  const handleUpdate = async () => {
    if (!activeScript || !prompt.trim() || genState.isGenerating) return;

    const currentPrompt = prompt;
    setPrompt('');

    const userMsg: ChatMessage = { role: 'user', text: currentPrompt };
    const updatedHistoryWithUser = [...activeScript.history, userMsg];
    
    setGenState({ isGenerating: true, error: null, currentStream: '', detectedLanguage: activeScript.language });
    
    try {
      const streamer = updateCodeStream(activeScript.history, currentPrompt, activeScript.language);
      const { fullBuffer } = await processStream(streamer, activeScript.language);
      
      const finalCode = fullBuffer.includes('--') ? fullBuffer.split('--').slice(1).join('--').trimStart() : fullBuffer;
      
      const updatedScript: ScriptResult = {
        ...activeScript,
        code: finalCode,
        history: [...updatedHistoryWithUser, { role: 'model', text: fullBuffer }]
      };

      await db.saveScript(updatedScript);
      setHistory(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
      setActiveScript(updatedScript);
      setGenState(prev => ({ ...prev, isGenerating: false, currentStream: '', detectedLanguage: '' }));
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isGenerating: false, error: err.message }));
    }
  };

  const deleteScript = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this script?')) {
      await db.deleteScript(id);
      setHistory(prev => prev.filter(s => s.id !== id));
      if (activeScript?.id === id) setActiveScript(null);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#070510] text-white">
        <Logo className="w-16 h-16 animate-pulse mb-6" />
        <div className="flex flex-col items-center">
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[loading_2s_infinite]"></div>
          </div>
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Security Checkpoint</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen flex bg-[#070510] text-slate-300 overflow-hidden selection:bg-indigo-500/30">
      <aside 
        className={`relative z-40 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSidebarCollapsed ? 'w-24' : 'w-80'}`}
      >
        <div className="flex-1 flex flex-col m-4 mr-0 rounded-[2.5rem] bg-[#0d0a1a]/80 backdrop-blur-3xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-3 group cursor-default">
                <Logo className="w-9 h-9 group-hover:rotate-12 transition-transform duration-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tracking-tight">SyntaxAI</span>
                  <span className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-widest">v2.4.0-PRO</span>
                </div>
              </div>
            )}
            {isSidebarCollapsed && <Logo className="w-10 h-10 mx-auto" />}
          </div>

          <div className="px-4 mb-6">
            <button 
              onClick={() => setActiveScript(null)}
              className={`group flex items-center transition-all duration-300 w-full rounded-2xl ${
                isSidebarCollapsed 
                ? 'justify-center h-12 bg-white/5 hover:bg-white/10' 
                : 'px-4 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 text-white'
              }`}
            >
              <ICONS.Sparkles className={`shrink-0 ${isSidebarCollapsed ? 'w-5 h-5 opacity-60' : 'w-4 h-4 mr-3'}`} />
              {!isSidebarCollapsed && <span className="text-xs font-bold">New Project</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-8">
            <div className={`px-2 mb-2 flex items-center justify-between transition-opacity duration-500 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Repository</span>
              <div className="w-8 h-[1px] bg-slate-800"></div>
            </div>

            {history.map(script => (
              <div
                key={script.id}
                onClick={() => setActiveScript(script)}
                className={`group relative flex items-center cursor-pointer transition-all duration-300 rounded-xl overflow-hidden ${
                  activeScript?.id === script.id 
                  ? 'bg-indigo-500/10 text-indigo-300' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                } ${isSidebarCollapsed ? 'justify-center h-12' : 'px-4 py-3'}`}
              >
                {activeScript?.id === script.id && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full"></div>
                )}
                
                {isSidebarCollapsed ? (
                  <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-[8px] font-black uppercase">
                    {script.language.substring(0, 2)}
                  </div>
                ) : (
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-2">{script.language}</span>
                      <button 
                        onClick={(e) => deleteScript(e, script.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                      >
                        <ICONS.Trash className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-medium truncate opacity-60 group-hover:opacity-100 transition-opacity">
                      {script.description}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5">
            <button 
              onClick={handleLogout}
              className={`flex items-center group transition-all duration-300 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-500 ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3 space-x-3'}`}
            >
              <ICONS.LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">End Session</span>}
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0d0a1a] border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:border-indigo-500/50 transition-all z-50 shadow-2xl"
        >
          {isSidebarCollapsed ? <ICONS.ChevronRight className="w-3 h-3" /> : <ICONS.ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a103d_0%,_transparent_50%)] pointer-events-none opacity-40"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

        {!activeScript && !genState.isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-block p-4 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 mb-2">
                  <Logo className="w-16 h-16" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Code with Precision.</h2>
                <p className="text-slate-400 font-medium">SyntaxAI streamlines your workflow with expert architecture generation.</p>
              </div>

              <div className="bg-[#0d0a1a]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="grid grid-cols-1 gap-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Target Language</label>
                    <div className="relative">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 outline-none appearance-none cursor-pointer transition-all hover:bg-black/60"
                      >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <ICONS.ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Requirements</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g.: A high-performance Lua handler for game events..."
                    className="w-full h-48 bg-black/40 border border-white/5 rounded-[2rem] px-6 py-6 text-sm text-white focus:border-indigo-500/50 outline-none resize-none placeholder:text-slate-700 transition-all hover:bg-black/60"
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="w-full relative group overflow-hidden bg-white text-black font-black text-sm py-5 rounded-[1.5rem] transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center space-x-3"
                >
                  <div className="absolute inset-0 bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <span className="relative z-10 group-hover:text-white transition-colors">Start Build Process</span>
                  <ICONS.Sparkles className="relative z-10 w-4 h-4 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
            <div className="px-8 py-4 bg-black/20 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <ICONS.Terminal className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Compiler View</span>
                  <span className="text-xs font-bold text-slate-200">{activeScript?.language || 'Initializing...'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                  Live Sync Active
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,_#1a103d_0%,_transparent_30%)]">
              <div className="max-w-5xl mx-auto space-y-16">
                {activeScript?.history.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`${msg.role === 'user' ? 'max-w-xl' : 'w-full'}`}>
                      {msg.role === 'user' ? (
                        <div className="bg-[#1e1b2e] border border-white/5 p-6 rounded-[2rem] rounded-tr-none shadow-xl">
                          <p className="text-sm font-medium leading-relaxed text-slate-200">{msg.text}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3 opacity-50">
                            <Logo className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">System Response</span>
                          </div>
                          <PreviewWorkspace 
                            code={msg.text.includes('--') ? msg.text.split('--').slice(1).join('--').trimStart() : msg.text} 
                            language={activeScript.language} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {genState.isGenerating && (
                  <div className="flex justify-start w-full animate-in fade-in duration-500">
                    <div className="w-full space-y-6">
                      <div className="inline-flex items-center space-x-3 bg-indigo-500/5 border border-indigo-500/20 px-6 py-2 rounded-full">
                        <div className="flex space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          {genState.detectedLanguage ? `Compiling ${genState.detectedLanguage}` : 'Compiling Request...'}
                        </span>
                      </div>
                      <PreviewWorkspace code={genState.currentStream} language={genState.detectedLanguage || activeScript?.language || ''} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} className="h-12" />
              </div>
            </div>

            <div className="p-8 pb-10 bg-gradient-to-t from-[#070510] via-[#070510] to-transparent">
              <div className="max-w-4xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-30 transition-opacity"></div>
                  <div className="relative flex items-center bg-[#0d0a1a] border border-white/5 rounded-[2.2rem] p-2 pr-4 shadow-2xl">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(); }}
                      placeholder="Refine logic or add features..."
                      className="flex-1 bg-transparent border-none py-4 px-6 text-sm text-white focus:ring-0 outline-none placeholder:text-slate-700"
                    />
                    <button 
                      onClick={handleUpdate}
                      disabled={genState.isGenerating || !prompt.trim()}
                      className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 shadow-lg"
                    >
                      <ICONS.ChevronRight className="w-5 h-5 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes loading {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default App;
