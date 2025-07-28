'use server';
/**
 * @fileOverview An AI flow to analyze and improve code snippets.
 *
 * - analyzeCode - A function that analyzes a code snippet based on a user prompt.
 * - AnalyzeCodeInput - The input type for the analyzeCode function.
 * - AnalyzeCodeOutput - The return type for the analyzeCode function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const AnalyzeCodeInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be analyzed and improved.'),
  analysisPrompt: z.string().describe('The user prompt describing the desired analysis or improvement (e.g., "find bugs", "improve accessibility").'),
  apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

const AnalyzeCodeOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation of the analysis, findings, and changes made to the code.'),
  improvedCode: z.string().describe('The improved and refactored code snippet.'),
});
export type AnalyzeCodeOutput = z.infer<typeof AnalyzeCodeOutputSchema>;

export async function analyzeCode(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> {
  return analyzeCodeFlow(input);
}

const promptDefinition = {
  name: 'analyzeCodePrompt',
  input: {schema: AnalyzeCodeInputSchema},
  output: {schema: AnalyzeCodeOutputSchema},
  prompt: `You are an expert AI software developer and code reviewer specializing in modern front-end technologies. Your task is to analyze a given code snippet based on a user's request and provide both an improved version of the code and a detailed explanation of your changes.

**Tech Stack Context:**
The code is part of a web application built with Next.js, React, and TypeScript. Styling is done exclusively with Tailwind CSS, and the UI components are often from the shadcn/ui library. Assume the code should be clean, reusable, and follow best practices for this stack.

**User's Request:** "{{analysisPrompt}}"

**Code to Analyze:**
\`\`\`
{{{codeSnippet}}}
\`\`\`

**Your Thought Process:**

1.  **Understand the Goal:** Carefully read the "User's Request" to understand what kind of analysis is needed. Are they looking for bugs, performance improvements, better readability, improved accessibility, or conversion to a different format (like React)?
2.  **Analyze the Code:** Scrutinize the provided code snippet with the tech stack in mind.
    *   If debugging, look for syntax errors, logical flaws, or common pitfalls in React and JavaScript.
    *   If refactoring, identify areas for simplification, better variable naming, creating reusable components, or using more efficient patterns.
    *   If checking accessibility, look for missing ARIA attributes, semantic HTML, keyboard navigation support, and ensure Tailwind classes don't create contrast issues.
    *   If converting to a React/TSX component, create a functional component with proper props and state management if necessary.
3.  **Formulate the Explanation:** Write a clear, step-by-step explanation.
    *   Start by summarizing your findings.
    *   Detail each specific change you made and *why* you made it. For example, "I replaced the \`<div>\` with a \`<button>\` to improve semantic meaning and keyboard accessibility." or "I converted the HTML into a React component and used the \`useState\` hook to manage the counter."
    *   Keep the tone helpful and educational.
4.  **Generate the Improved Code:** Rewrite the code snippet, incorporating all the improvements. Ensure the final code is clean, correct, and directly usable. If you created a React component, make it a complete, self-contained example.

**Output Requirements:**

*   You must provide your response in the specified JSON format, with a detailed 'explanation' and the final 'improvedCode'.
*   The 'improvedCode' should be the raw code only, without any markdown formatting (like \`\`\`html\` or \`\`\`tsx\`).
`,
};

const analyzeCodePrompt = globalAi.definePrompt(promptDefinition);

const analyzeCodeFlow = globalAi.defineFlow(
  {
    name: 'analyzeCodeFlow',
    inputSchema: AnalyzeCodeInputSchema,
    outputSchema: AnalyzeCodeOutputSchema,
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
      response = await analyzeCodePrompt(input);
    }
    
    const output = response.output;
    
    if (!output) {
      throw new Error("Failed to get a structured response from the AI.");
    }
    
    // Clean up potential markdown from the code part.
    output.improvedCode = output.improvedCode.replace(/^```(html|tsx|jsx|javascript|js)?\n?/, '').replace(/\n?```$/, '').trim();

    return output;
  }
);
