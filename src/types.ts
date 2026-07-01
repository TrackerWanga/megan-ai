// ══════════════════════════════════════════════════════════
// Megan AI Types
// ══════════════════════════════════════════════════════════

export interface AIRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  imageUrl?: string;
  audioUrl?: string;
  country?: string;
  language?: string;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  success: boolean;
  text?: string;
  audioUrl?: string;
  imageUrl?: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  error?: string;
}

export interface Provider {
  name: string;
  fn: (params: AIRequest) => Promise<AIResponse>;
  tier: 1 | 2 | 3;
  type: 'chat' | 'vision' | 'tts' | 'stt' | 'image' | 'search';
}

export interface ProviderHealth {
  failures: number;
  lastFailure: number;
  cooldownUntil: number;
  lastSuccess: number;
}

export interface User {
  uid: string;
  username: string;
  email: string;
  tier: string;
  mgc_balance: number;
  api_key: string;
  country?: string;
  storage?: StorageConfig;
}

export interface StorageConfig {
  type: 'postgres' | 'mongodb' | 'mysql' | 'supabase' | 'firebase' | 'webhook' | 'none';
  url?: string;
  apiKey?: string;
  table?: string;
  headers?: Record<string, string>;
}

export interface MeganPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  category: string;
  countries?: string[];
}

export interface ChainStep {
  type: 'chat' | 'vision' | 'ocr' | 'translate' | 'tts' | 'stt' | 'search' | 'fetch';
  params: Record<string, any>;
  inputKey?: string;
}

export interface UsageRecord {
  apiKey: string;
  endpoint: string;
  provider: string;
  country: string;
  tokensUsed: number;
  success: boolean;
  responseMs: number;
  timestamp: number;
}

export interface Env {
  AI: any;
  DB: D1Database;
  FIREBASE_DB: string;
  FIREBASE_KEY: string;
  MEGAN_COINS_URL: string;
  GEMINI_API_KEY: string;
  GNEWS_API_KEY: string;
  ENVIRONMENT: string;
}
