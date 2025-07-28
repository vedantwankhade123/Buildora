
'use server';
/**
 * @fileOverview An AI flow to generate a course on a given topic.
 *
 * - generateCourse - A function that generates a course.
 * - GenerateCourseInput - The input type for the generateCourse function.
 * - GenerateCourseOutput - The return type for the generateCourse function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateCourseInputSchema = z.object({
  topic: z.string().describe('The topic for which the course should be generated.'),
  apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type GenerateCourseInput = z.infer<typeof GenerateCourseInputSchema>;

const LessonSchema = z.object({
    title: z.string().describe('The title of the lesson.'),
    content: z.string().describe('The detailed content of the lesson, including code examples in markdown format where appropriate.'),
});

const YoutubeVideoSchema = z.object({
    title: z.string().describe("The title of the YouTube video."),
    videoId: z.string().describe("The YouTube video ID (the part of the URL after 'v=')."),
});

const QuizQuestionSchema = z.object({
    question: z.string().describe('The question text.'),
    options: z.array(z.string()).describe('An array of possible answers.'),
    correctAnswer: z.string().describe('The text of the correct answer from the options array.'),
    explanation: z.string().describe('A brief explanation of why the correct answer is right.'),
});

const QuizSchema = z.object({
    title: z.string().describe('The title of the quiz.'),
    questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});

const GenerateCourseOutputSchema = z.object({
  title: z.string().describe('The title of the generated course.'),
  description: z.string().describe('A brief description of what the course covers.'),
  lessons: z.array(LessonSchema).describe('An array of lessons that make up the course.'),
  youtubeVideos: z.array(YoutubeVideoSchema).describe('An array of relevant YouTube videos to supplement the course.'),
  quiz: QuizSchema.describe('A quiz with multiple-choice questions to test the user\'s knowledge on the course content.'),
});
export type GenerateCourseOutput = z.infer<typeof GenerateCourseOutputSchema>;

export async function generateCourse(input: GenerateCourseInput): Promise<GenerateCourseOutput> {
  return generateCourseFlow(input);
}

const promptDefinition = {
  name: 'generateCoursePrompt',
  input: {schema: GenerateCourseInputSchema},
  output: {schema: GenerateCourseOutputSchema},
  prompt: `You are an expert curriculum developer and coding instructor. Your task is to generate a comprehensive, beginner-friendly mini-course on a given topic, curate supplementary video content, and create a practice quiz.

Topic: "{{topic}}"

**Instructions:**

1.  **Course Title:** Create a clear and engaging title for the course.
2.  **Course Description:** Write a short, compelling description of what the course covers and who it's for.
3.  **Lessons:** Generate a series of 5-7 lessons.
    *   Each lesson must have a 'title' and detailed 'content'.
    *   The content must be thorough, well-structured, and written in a clear, educational tone.
    *   For technical topics, it is CRITICAL to include well-explained and commented code examples. Use markdown for code blocks (e.g., \`\`\`javascript\n// This is a comment\nconsole.log("Hello");\n\`\`\`).
    *   The content should be substantial enough to be genuinely useful for a learner. Start with fundamental concepts and progressively move to more advanced topics.
4.  **YouTube Video Curation:**
    *   Find 2-3 highly-rated, relevant YouTube videos that would be excellent supplements to this course.
    *   It is CRITICAL that you choose videos from established educational channels that are likely to allow embedding on other websites.
    *   For each video, you must provide its 'title' and its YouTube 'videoId' (which is the unique string of characters found after "v=" in a YouTube URL).
    *   Do NOT provide the full URL, only the video ID.
5.  **Practice Quiz:**
    *   Create a quiz with a relevant 'title'.
    *   Generate 5-10 multiple-choice questions based on the content of the lessons you just created.
    *   Each question must have:
        *   A clear 'question' text.
        *   An 'options' array with 3-4 possible answers.
        *   The exact text of the 'correctAnswer'.
        *   A brief 'explanation' for why the answer is correct.

**Output Format:**
You must provide your response in the specified JSON format, including the 'youtubeVideos' array and the 'quiz' object.
`,
};

const generateCoursePrompt = globalAi.definePrompt(promptDefinition);

const generateCourseFlow = globalAi.defineFlow(
  {
    name: 'generateCourseFlow',
    inputSchema: GenerateCourseInputSchema,
    outputSchema: GenerateCourseOutputSchema,
  },
  async (input) => {
    let response;
    if (input.apiKey) {
      const userAi = genkit({
        plugins: [googleAI({ apiKey: input.apiKey })],
        model: 'googleai/gemini-2.0-flash',
      });
      const userPrompt = userAi.definePrompt(promptDefinition);
      response = await userPrompt(input);
    } else {
      response = await generateCoursePrompt(input);
    }

    const output = response.output;
    
    if (!output) {
      throw new Error("Failed to get a structured response from the AI.");
    }
    
    return output;
  }
);
