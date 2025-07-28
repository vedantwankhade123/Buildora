'use server';
/**
 * @fileOverview Generates an image based on a text hint.
 *
 * - generateImageFromHint - A function that handles image generation.
 * - GenerateImageInput - The input type for the generateImageFromHint function.
 * - GenerateImageOutput - The return type for the generateImageFromHint function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  hint: z.string().describe('A one or two keyword hint for the image to generate.'),
  apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromHint(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = globalAi.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({hint, apiKey}) => {
    let currentAi = globalAi;
    if (apiKey) {
      currentAi = genkit({
        plugins: [googleAI({ apiKey: apiKey })],
      });
    }

    const prompt = `A high-quality, photorealistic image of ${hint}. Modern, clean, professional.`;
    
    const {media} = await currentAi.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed.');
    }

    return {imageDataUri: media.url};
  }
);
