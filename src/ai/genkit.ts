import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';

config();

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY })],
  model: 'googleai/gemini-2.0-flash',
  enableTracingAndMetrics: false, // Disable tracing to avoid Firebase dependency
});
