'use server';
/**
 * @fileOverview An AI flow to generate an engaging audio explanation of a lesson.
 *
 * - generateTutorAudio - Converts lesson content into a tutor-style audio clip.
 * - GenerateTutorAudioInput - The input type for the function.
 * - GenerateTutorAudioOutput - The return type for the function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const GenerateTutorAudioInputSchema = z.object({
    title: z.string().describe('The title of the lesson.'),
    content: z.string().describe('The markdown content of the lesson.'),
    apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type GenerateTutorAudioInput = z.infer<typeof GenerateTutorAudioInputSchema>;

const GenerateTutorAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a WAV data URI.'),
});
export type GenerateTutorAudioOutput = z.infer<typeof GenerateTutorAudioOutputSchema>;

export async function generateTutorAudio(input: GenerateTutorAudioInput): Promise<GenerateTutorAudioOutput> {
  return generateTutorAudioFlow(input);
}

// Helper to convert PCM audio buffer to a Base64 encoded WAV string
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const tutorScriptGeneratorPromptDefinition = {
    name: 'tutorScriptGenerator',
    input: { schema: GenerateTutorAudioInputSchema },
    prompt: `You are a friendly, engaging, and expert programming tutor. Your task is to convert the following lesson content into a natural-sounding audio script.

Do not just read the text verbatim. Instead, explain the concepts as if you were teaching a student one-on-one. Use a conversational tone, add encouraging remarks, and break down complex code or ideas into simpler terms. When you encounter a code block, describe what it does and why it's important, rather than reading the code line-by-line.

Your script should be ready to be converted directly to audio.

Lesson Title: "{{title}}"

Lesson Content to transform:
---
{{{content}}}
---
`,
};

const generateTutorAudioFlow = globalAi.defineFlow(
  {
    name: 'generateTutorAudioFlow',
    inputSchema: GenerateTutorAudioInputSchema,
    outputSchema: GenerateTutorAudioOutputSchema,
  },
  async (input) => {
    let currentAi = globalAi;
    if (input.apiKey) {
      currentAi = genkit({
        plugins: [googleAI({ apiKey: input.apiKey })],
        model: 'googleai/gemini-2.0-flash',
      });
    }
    
    // 1. Generate the conversational script from the lesson content
    const tutorScriptGeneratorPrompt = currentAi.definePrompt(tutorScriptGeneratorPromptDefinition);
    const scriptResponse = await tutorScriptGeneratorPrompt(input);
    const script = scriptResponse.text;

    if (!script) {
        throw new Error('Failed to generate the tutor script.');
    }

    // 2. Convert the generated script to speech
    const { media } = await currentAi.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A friendly, clear voice
          },
        },
      },
      prompt: script,
    });

    if (!media || !media.url) {
      throw new Error('TTS generation failed. No media returned.');
    }
    
    const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    
    const wavBase64 = await toWav(pcmData);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
