export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export interface Message {
  sender: Sender;
  text: string;
  suggestions?: string[];
}

export interface Transcript {
  speaker: 'user' | 'bot';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  date: number; // Timestamp
  messages: Message[];
}

export interface UserProfile {
  id: string;
  email: string;
  prompt_count: number;
  is_premium: boolean;
  subscription_plan?: string;
}
