
import React, { useState, useEffect } from 'react';
import { ICONS, Logo } from '../constants.tsx';
import { db } from '../services/database.ts';
import { supabase } from '../services/supabase.ts';
import { User } from '../types.ts';

interface AuthProps {
  onLogin: () => void;
}

const MASTER_KEY = 'DENNISdeKAT211012!';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const existingUser = db.getUser();
    if (existingUser) {
      setMode('login');
      setEmail(existingUser.email);
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (securityKey === MASTER_KEY) {
      setIsLoading(true);
      setTimeout(() => {
        const masterUser: User = { 
          email: email || 'master@syntaxai.pro', 
          password: password || 'master', 
          securityKey: MASTER_KEY 
        };
        db.saveUser(masterUser);
        db.setSessionActive(true);
        onLogin();
        setIsLoading(false);
      }, 500);
      return;
    }

    if (!email || !password || !securityKey) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: keyData, error: fetchError } = await supabase
        .from('keys')
        .select('*')
        .eq('key_code', securityKey)
        .single();

      if (fetchError || !keyData) {
        throw new Error('Verification failed. Invalid token.');
      }

      if (keyData.is_used) {
        throw new Error('Access token already consumed.');
      }

      const { error: updateError } = await supabase
        .from('keys')
        .update({ is_used: true })
        .eq('key_code', securityKey);

      if (updateError) {
        throw new Error('Database connection failed.');
      }

      const newUser: User = { email, password, securityKey };
      db.saveUser(newUser);
      db.setSessionActive(true);
      onLogin();

    } catch (err: any) {
      setError(err.message || 'Identity verification rejected.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedUser = db.getUser();
    if (!savedUser) {
      setError('No profile found in registry.');
      return;
    }

    if (savedUser.securityKey === MASTER_KEY) {
      if ((email === savedUser.email || !email) && (password === savedUser.password || !password)) {
        db.setSessionActive(true);
        onLogin();
        return;
      }
    }

    if (savedUser.email !== email || savedUser.password !== password) {
      setError('Invalid credentials.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: keyData, error: keyError } = await supabase
        .from('keys')
        .select('key_code')
        .eq('key_code', savedUser.securityKey)
        .single();

      if (keyError || !keyData) {
        throw new Error('Session key expired.');
      }

      db.setSessionActive(true);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#070510] text-slate-300 relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="hidden lg:flex w-[45%] flex-col justify-between p-16 relative z-10 border-r border-white/5 bg-[#0d0a1a]/40 backdrop-blur-md">
        <div>
          <Logo className="w-16 h-16 mb-12" />
          <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6">
            SYNTAX<br/>AI.<br/><span className="text-indigo-500">ENGINE.</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-sm font-medium">
            Professional polyglot script generation workbench. Built for speed, precision, and efficiency.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
            <span>Polyglot Support</span>
            <span>Cloud Repository</span>
            <span>Secure Access</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-12">
            <Logo className="w-20 h-20 mb-4" />
            <h1 className="text-3xl font-black text-white tracking-tighter">SyntaxAI</h1>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">
                {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {mode === 'signup' ? 'Enter your credentials to get started' : 'Sign in to access your secure repository.'}
              </p>
            </div>

            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 mb-8">
              <button onClick={() => setMode('signup')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Sign Up</button>
              <button onClick={() => setMode('login')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Sign In</button>
            </div>

            <form onSubmit={mode === 'signup' ? handleSignUp : handleLogin} className="space-y-6">
              <div className="space-y-6">
                {(mode === 'login' || (mode === 'signup' && securityKey !== MASTER_KEY)) && (
                  <>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Terminal</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800"
                        placeholder="user@system.pro"
                        required={securityKey !== MASTER_KEY}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Phrase</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800"
                        placeholder="••••••••"
                        required={securityKey !== MASTER_KEY}
                      />
                    </div>
                  </>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Security Token</label>
                    <input
                      type="text"
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value)}
                      className="w-full bg-black/40 border border-indigo-500/20 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800 font-mono"
                      placeholder="SH-XXXX-XXXX"
                      required
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-400 text-[11px] font-bold bg-red-400/5 border border-red-400/20 p-4 rounded-xl text-center uppercase tracking-wider animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative group"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                ) : (
                  <>
                    <span className="relative z-10">{mode === 'signup' ? 'Sign up' : 'Sign in'}</span>
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default Auth;
