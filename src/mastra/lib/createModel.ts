import { config as loadDotenv } from 'dotenv';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

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

export function hasGoogleModelConfig(apiKey?: string) {
  return Boolean(resolveGoogleApiKey(apiKey));
}

export function hasGroqModelConfig(apiKey?: string) {
  return Boolean(resolveGroqApiKey(apiKey));
}

export function createGoogleModel(
  apiKey?: string,
  modelId: string = 'gemini-flash-lite-latest'
) {
  const resolvedApiKey = resolveGoogleApiKey(apiKey);

  if (!resolvedApiKey) {
    throw new Error(
      'Missing Google AI API key. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.'
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: resolvedApiKey });
  return google(modelId);
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
