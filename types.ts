
export interface User {
  email: string;
  password?: string;
  securityKey: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ScriptResult {
  id: string;
  userId: string;
  language: string;
  code: string;
  description: string;
  timestamp: number;
  history: ChatMessage[];
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  currentStream: string;
}
