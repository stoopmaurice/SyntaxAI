
import React from 'react';

export const LANGUAGES = [
  'Auto-detect', 'Python', 'JavaScript', 'TypeScript', 'Lua', 'C++', 'C#', 'Java', 'Rust', 'Go', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Bash', 'SQL', 'HTML/CSS', 'Assembly'
];

export const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center rounded-full bg-[#0d021f] border-2 border-[#ff00ff]/30 shadow-[0_0_20px_rgba(255,0,255,0.3)] overflow-hidden ${className}`}>
    {/* Circuit board background effect */}
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20H30V40" stroke="#ff00ff" strokeWidth="0.5"/>
        <path d="M90 80H70V60" stroke="#00ffff" strokeWidth="0.5"/>
        <path d="M20 80L40 60" stroke="#ff00ff" strokeWidth="0.5"/>
        <path d="M80 20L60 40" stroke="#00ffff" strokeWidth="0.5"/>
        <circle cx="30" cy="40" r="1" fill="#ff00ff" />
        <circle cx="70" cy="60" r="1" fill="#00ffff" />
      </svg>
    </div>
    
    {/* Main Icon Content */}
    <div className="relative z-10 flex items-center justify-center scale-90">
      <span className="text-white font-black text-2xl drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" style={{ fontFamily: 'monospace' }}>
        {'{'}
      </span>
      <div className="flex flex-col items-center mx-0.5 space-y-0.5">
        <div className="w-2 h-2 bg-[#00ff88] rotate-[30deg] rounded-[2px] shadow-[0_0_5px_#00ff88]"></div>
        <div className="w-1.5 h-1.5 bg-[#00ff88] rotate-[30deg] rounded-[1px] shadow-[0_0_5px_#00ff88] translate-x-1"></div>
        <div className="w-2 h-2 bg-[#ffaa00] rotate-[30deg] rounded-[2px] shadow-[0_0_5px_#ffaa00] -translate-x-1"></div>
      </div>
      <span className="text-white font-black text-2xl drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" style={{ fontFamily: 'monospace' }}>
        {'}'}
      </span>
    </div>
    
    {/* Outer Glow Ring */}
    <div className="absolute inset-0 border-[3px] border-[#ff00ff]/20 rounded-full animate-pulse"></div>
  </div>
);

export const ICONS = {
  Terminal: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
  ),
  Copy: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
  ),
  Trash: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Sparkles: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>
  ),
  History: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>
  ),
  Check: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"></polyline></svg>
  ),
  User: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  LogOut: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  ),
  Mail: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  ),
  Lock: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  ),
  ChevronLeft: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="15 18 9 12 15 6"></polyline></svg>
  ),
  ChevronRight: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6"></polyline></svg>
  )
};
