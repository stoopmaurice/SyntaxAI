
import { User, ScriptResult } from '../types';

const SCRIPTS_KEY = 'syntaxai_local_scripts';
const USER_PROFILE_KEY = 'syntaxai_user_profile';
const SESSION_KEY = 'syntaxai_session_active';

export const db = {
  // --- USER AUTH ---
  saveUser(user: User): void {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const data = localStorage.getItem(USER_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  },

  // --- SESSION MANAGEMENT ---
  isSessionActive(): boolean {
    return localStorage.getItem(SESSION_KEY) === 'true';
  },

  setSessionActive(active: boolean): void {
    if (active) {
      localStorage.setItem(SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  // --- SCRIPTS (Local Only) ---
  async getScripts(): Promise<ScriptResult[]> {
    const data = localStorage.getItem(SCRIPTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveScript(script: ScriptResult): Promise<void> {
    const scripts = await this.getScripts();
    const index = scripts.findIndex(s => s.id === script.id);
    
    let newScripts;
    if (index >= 0) {
      newScripts = [...scripts];
      newScripts[index] = script;
    } else {
      newScripts = [script, ...scripts];
    }
    
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(newScripts));
  },

  async deleteScript(id: string): Promise<void> {
    const scripts = await this.getScripts();
    const filtered = scripts.filter(s => s.id !== id);
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(filtered));
  }
};
