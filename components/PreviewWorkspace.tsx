
import React, { useState, useEffect } from 'react';
import { ICONS, Logo } from '../constants.tsx';

interface PreviewWorkspaceProps {
  code: string;
  language: string;
}

const PreviewWorkspace: React.FC<PreviewWorkspaceProps> = ({ code, language }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const langLower = language.toLowerCase();
  
  // Detectie van platformen
  const isMobile = langLower === 'swift' || langLower === 'kotlin' || langLower === 'zwift' || langLower === 'java' && code.includes('android');
  const isWeb = langLower.includes('html') || langLower.includes('javascript') || langLower.includes('typescript') || langLower.includes('css');
  const hasTerminal = !isMobile && !isWeb && langLower !== 'code' && langLower !== 'auto-detect';

  const getPreviewLabel = () => {
    if (isMobile) return 'iPhone';
    if (isWeb) return 'Browser';
    return 'Console';
  };

  useEffect(() => {
    if (activeTab === 'preview' && isWeb) {
      const timeout = setTimeout(() => {
        const isOnlyCSS = langLower === 'css';
        const isOnlyJS = langLower.includes('javascript');
        
        setSrcDoc(`
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: white; padding: 24px; background: #0f172a; line-height: 1.5; }
                ${isOnlyCSS ? code : ''}
              </style>
            </head>
            <body>
              ${isOnlyCSS ? '<h1>CSS Preview Mode</h1><p>Styling applied to this preview window.</p>' : 
                (isOnlyJS ? '<div id="app"></div><script>' + code + '</script>' : code)}
            </body>
          </html>
        `);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [code, activeTab, isWeb, langLower]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startInteraction = () => {
    setIsInteracting(true);
    setIsFinished(false);
    setLogs(["[System] Booting kernel...", "[App] Initializing view controllers...", "[Debug] Attaching debugger..."]);
    
    const mockLogs = [
      `[Event] User interaction detected`,
      `[Memory] Allocated 12.4MB for resources`,
      `[Network] Requesting data from internal API`,
      `[UI] Rendering component tree`,
      `[Success] Script execution finished with 0 errors`
    ];

    mockLogs.forEach((log, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
        // Als dit het laatste logje is, toon dan het resultaatscherm na een korte pauze
        if (index === mockLogs.length - 1) {
          setTimeout(() => {
            setIsFinished(true);
          }, 1000);
        }
      }, (index + 1) * 600);
    });
  };

  const stopInteraction = () => {
    setIsInteracting(false);
    setIsFinished(false);
    setLogs([]);
  };

  return (
    <div className="flex flex-col w-full rounded-[2rem] overflow-hidden border border-white/10 bg-[#0d0a1a]/80 backdrop-blur-3xl shadow-2xl transition-all duration-500 min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${
              activeTab === 'code' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ICONS.Terminal className="w-3 h-3" />
            <span>Script</span>
          </button>
          
          {(isMobile || isWeb || hasTerminal) && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isMobile ? <ICONS.Sparkles className="w-3 h-3" /> : (isWeb ? <ICONS.ChevronRight className="w-3 h-3 rotate-[-90deg]" /> : <ICONS.Terminal className="w-3 h-3" />)}
              <span>{getPreviewLabel()}</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{isMobile ? 'Mobile UI' : (isWeb ? 'Web Engine' : 'System')}</span>
            <span className="text-[10px] font-bold text-slate-500">{language}</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
          >
            {copied ? <ICONS.Check className="w-4 h-4 text-green-400" /> : <ICONS.Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex overflow-hidden min-h-[450px]">
        {/* Code View */}
        <div 
          className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            activeTab === 'code' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          <pre className="p-8 text-sm code-font leading-relaxed text-indigo-100 h-full overflow-auto custom-scrollbar whitespace-pre-wrap">
            <code>{code || '// Initializing buffer...'}</code>
          </pre>
        </div>

        {/* Result View */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            activeTab === 'preview' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
          }`}
        >
          {isMobile ? (
            <div className="relative w-[260px] h-[520px] bg-black rounded-[2.5rem] border-[6px] border-[#1e1e1e] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden scale-95 md:scale-100 transition-transform duration-500">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 border border-white/5"></div>
              
              <div className="absolute inset-0 bg-[#070510] flex flex-col pt-10 pb-4 px-4 overflow-hidden">
                {!isInteracting ? (
                  <div className="flex-1 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Logo className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">SyntaxAI Mobile</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">v2.4.0</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
                      <h3 className="text-white font-black text-sm uppercase tracking-tight">System Ready</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        De architectuur voor <strong>{language}</strong> is geladen. Druk op de knop om de logica te testen.
                      </p>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] text-indigo-300/60 overflow-hidden line-clamp-4">
                        {code}
                      </div>
                    </div>
                    
                    <button 
                      onClick={startInteraction}
                      className="group w-full py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Interact with App</span>
                      <ICONS.ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : isFinished ? (
                  /* Success / Running Screen */
                  <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-700 bg-gradient-to-b from-indigo-600/20 to-transparent rounded-t-3xl p-4 text-center">
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <ICONS.Check className="w-10 h-10 text-green-400" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-white font-black text-lg uppercase tracking-tight">App Active</h2>
                        <p className="text-[10px] text-slate-400 font-medium px-4">
                          De <strong>{language}</strong>-architectuur is succesvol uitgevoerd en draait in de gesimuleerde omgeving.
                        </p>
                      </div>
                      
                      <div className="w-full grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Status</span>
                          <span className="text-[10px] text-green-400 font-black">Running</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Uptime</span>
                          <span className="text-[10px] text-indigo-400 font-black">100%</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={stopInteraction}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-indigo-500 active:scale-95 mt-4"
                    >
                      Exit Simulation
                    </button>
                  </div>
                ) : (
                  /* Terminal Logs Screen */
                  <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={stopInteraction} className="p-2 -ml-2 text-slate-500 hover:text-white transition-colors">
                        <ICONS.ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Execution</span>
                      <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                      {logs.map((log, i) => (
                        <div key={i} className="mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                          <span className="text-indigo-500/50 mr-2">[{i}]</span>
                          <span className={log.includes('Success') ? 'text-green-400' : log.includes('Error') ? 'text-red-400' : 'text-slate-300'}>
                            {log}
                          </span>
                        </div>
                      ))}
                      <div className="w-2 h-4 bg-indigo-500/50 animate-pulse inline-block ml-1"></div>
                    </div>

                    <button 
                      onClick={stopInteraction}
                      className="mt-4 w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      Terminate Process
                    </button>
                  </div>
                )}
                <div className="w-24 h-1 bg-white/20 rounded-full mx-auto mt-4 shrink-0"></div>
              </div>
            </div>
          ) : isWeb ? (
            <div className="w-full h-full flex flex-col bg-[#0f172a] overflow-hidden">
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border-b border-white/5">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-red-500/50 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500/50 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500/50 rounded-full"></div>
                </div>
                <div className="flex-1 bg-black/40 rounded-md px-3 py-1 text-[9px] text-slate-500 flex items-center truncate border border-white/5">
                  <ICONS.Lock className="w-2 h-2 mr-2 opacity-30" />
                  syntax-ai.cloud/preview/temp-render
                </div>
              </div>
              <iframe 
                srcDoc={srcDoc} 
                className="w-full h-full border-none bg-white"
                title="Browser Preview"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-[#050505] p-8 font-mono text-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6 opacity-40">
                <div className="flex items-center space-x-2">
                  <ICONS.Terminal className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black">Virtual Environment</span>
                </div>
                <span className="text-[8px] font-bold">PID: {Math.floor(Math.random() * 9000) + 1000}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">$</span>
                  <p className="text-slate-300">Run {language.toLowerCase()}_module --mode production</p>
                </div>
                <p className="text-indigo-400/70 text-xs">[INFO] Loading core dependencies...</p>
                <div className="mt-4 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-200/80 leading-relaxed italic">
                  "Execution simulation successful. The code provided is syntactically valid."
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewWorkspace;
