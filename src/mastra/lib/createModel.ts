import { config as loadDotenv } from 'dotenv';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

loadDotenv();

function getEnvValue(key: string) {
  return process.env[key];
}

function resolveGoogleApiKey(apiKey?: string) {
  return (
    apiKey ||
    getEnvValue('GEMINI_API_KEY') ||
    getEnvValue('GOOGLE_GENERATIVE_AI_API_KEY') ||
    getEnvValue('GOOGLE_API') ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API ||
    ''
  );
}

function resolveGroqApiKey(apiKey?: string) {
  return (
    apiKey ||
    getEnvValue('GROQ_API_KEY') ||
    getEnvValue('GROQ') ||
    process.env.GROQ_API_KEY ||
    process.env.GROQ ||
    ''
  );
}

function resolveNvidiaApiKey(apiKey?: string) {
  return (
    apiKey ||
    getEnvValue('NVIDIA_API_KEY') ||
    getEnvValue('TOGETHER_API_KEY') ||
    process.env.NVIDIA_API_KEY ||
    process.env.TOGETHER_API_KEY ||
    ''
  );
}

function resolveOpenAIApiKey() {
  return (
    getEnvValue('OPENAI_API_KEY') ||
    getEnvValue('OPENAI') ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI ||
    ''
  );
}

export function hasNvidiaModelConfig(apiKey?: string) {
  return Boolean(resolveNvidiaApiKey(apiKey));
}

export function hasOpenAIModelConfig() {
  return Boolean(resolveOpenAIApiKey());
}

export function createNvidiaModel(
  apiKey?: string,
  modelId: string = 'meta/llama-3.1-8b-instruct'
) {
  const resolvedApiKey = resolveNvidiaApiKey(apiKey);

  if (!resolvedApiKey) {
    throw new Error(
      'Missing NVIDIA API key. Set NVIDIA_API_KEY or TOGETHER_API_KEY.'
    );
  }

  // Using NVIDIA API via OpenAI-compatible endpoint (chat/completions, not responses)
  const nvidia = createOpenAI({
    apiKey: resolvedApiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
    compatibility: 'compatible',
  });
  // Use .chat() explicitly to avoid the new Responses API endpoint
  return nvidia.chat(modelId);
}

export function hasGroqModelConfig(apiKey?: string) {
  return Boolean(resolveGroqApiKey(apiKey));
}

export function hasGoogleModelConfig(apiKey?: string) {
  return Boolean(resolveGoogleApiKey(apiKey));
}

export function createGoogleModel(
  apiKey?: string,
  modelId: string = 'gemini-flash-lite-latest',
  options?: { thinkingBudget?: number }
) {
  const resolvedApiKey = resolveGoogleApiKey(apiKey);

  if (!resolvedApiKey) {
    throw new Error(
      'Missing Google AI API key. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.'
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: resolvedApiKey });

  // Pass providerOptions to disable thinking (thinkingBudget=0) to avoid
  // errors when the model returns thinking tokens alongside tool calls
  const providerOptions = options?.thinkingBudget !== undefined
    ? {
        google: {
          thinkingConfig: {
            thinkingBudget: options.thinkingBudget,
          },
        },
      }
    : undefined;

  return google(modelId, providerOptions ? { providerOptions } : undefined);
}

/**
 * The Gemini models an agent walks through, in order. The primary is the
 * strongest; it is also the one Google most often answers with
 * 503 "This model is currently experiencing high demand". The second is a
 * different model family, so it is rarely overloaded at the same moment —
 * measured on 2026-10-06/07: while 3-flash-preview returned 503, 3.1-flash-lite
 * answered in ~1s and called tools correctly.
 */
export const CHAT_GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'] as const;

type ModelChain = Array<{ model: ReturnType<typeof createGoogleModel>; maxRetries: number }>;

/**
 * An ordered fallback chain for a Mastra `Agent`'s `model`. Mastra moves to the
 * next entry when a call fails, so a busy model costs one quick retry, not the
 * user's answer.
 *
 * Pass the chain, never a single model: creating a model never throws — only
 * calling it does — so a `try/catch` around `createGoogleModel` falls back
 * from nothing.
 */
export function createModelChain(
  apiKey?: string,
  options: { nvidiaModel?: string } = {}
): ModelChain {
  const chain: ModelChain = [];
  if (hasGoogleModelConfig(apiKey)) {
    // One retry each: a 503 comes back fast, and the next model is the better retry.
    for (const id of CHAT_GEMINI_MODELS) {
      chain.push({ model: createGoogleModel(apiKey, id, { thinkingBudget: 0 }), maxRetries: 1 });
    }
  }
  if (hasGroqModelConfig()) {
    chain.push({ model: createGroqModel() as any, maxRetries: 1 });
  }
  if (hasNvidiaModelConfig(apiKey)) {
    chain.push({ model: createNvidiaModel(apiKey, options.nvidiaModel) as any, maxRetries: 1 });
  }
  if (chain.length === 0) {
    throw new Error('No AI model provider configured. Set GEMINI_API_KEY, GROQ_API_KEY or NVIDIA_API_KEY.');
  }
  return chain;
}

export function createGroqModel(
  apiKey?: string,
  modelId: string = 'llama-3.3-70b-versatile'
) {
  const resolvedApiKey = resolveGroqApiKey(apiKey);

  if (!resolvedApiKey) {
    throw new Error('Missing Groq API key. Set GROQ_API_KEY.');
  }

  const groq = createGroq({ apiKey: resolvedApiKey });
  return groq(modelId);
}

export function createOpenAIModel(
  modelId: string = 'gpt-4o-mini'
) {
  const resolvedApiKey = resolveOpenAIApiKey();

  if (!resolvedApiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY.');
  }

  const openai = createOpenAI({ apiKey: resolvedApiKey });
  return openai(modelId);
}

