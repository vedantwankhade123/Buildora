
'use server';

/**
 * @fileOverview AI flow to enhance code snippets based on a description or prompt.
 *
 * - enhanceCodeSnippet - A function that enhances the code snippet.
 * - EnhanceCodeSnippetInput - The input type for the enhanceCodeSnippet function.
 * - EnhanceCodeSnippetOutput - The return type for the enhanceCodeSnippet function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const EnhanceCodeSnippetInputSchema = z.object({
  description: z.string().describe('The original prompt used to generate the initial code.'),
  codeSnippet: z.string().describe('The HTML/CSS code snippet to be enhanced.'),
  javascriptSnippet: z.string().describe('The JavaScript code snippet to be enhanced.'),
  enhancementPrompt: z.string().describe('The prompt or description of the desired enhancement.'),
  imageDataUri: z
    .string()
    .nullable()
    .optional()
    .describe(
      'An optional image reference for the enhancement, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
  apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type EnhanceCodeSnippetInput = z.infer<typeof EnhanceCodeSnippetInputSchema>;

const EnhanceCodeSnippetOutputSchema = z.object({
  enhancedCodeSnippet: z.string().describe('The enhanced HTML/CSS code snippet.'),
  enhancedJavascriptSnippet: z.string().describe('The enhanced JavaScript code snippet.'),
});
export type EnhanceCodeSnippetOutput = z.infer<typeof EnhanceCodeSnippetOutputSchema>;

export async function enhanceCodeSnippet(input: EnhanceCodeSnippetInput): Promise<EnhanceCodeSnippetOutput> {
  return enhanceCodeSnippetFlow(input);
}

const promptDefinition = {
  name: 'enhanceCodeSnippetPrompt',
  input: {schema: EnhanceCodeSnippetInputSchema},
  output: {schema: EnhanceCodeSnippetOutputSchema},
  prompt: `You are an AI front-end developer. Your role is to act as an intelligent agent that analyzes and incrementally modifies existing HTML, CSS, and JavaScript code based on user requests.

Your task is to think like a developer, review the existing code, and apply the requested changes intelligently.

**Context:**

1.  **Original User Prompt:** This is the initial goal for the design. Keep it in mind.
    > {{{description}}}

2.  **Current HTML/CSS Code Snippet:** This is the HTML/CSS code you need to modify.
    \`\`\`html
    {{{codeSnippet}}}
    \`\`\`

3.  **Current JavaScript Code Snippet:** This is the JavaScript code you need to modify.
    \`\`\`javascript
    {{{javascriptSnippet}}}
    \`\`\`

4.  **User's Enhancement Request:** This is the specific change you need to make.
    > {{{enhancementPrompt}}}
    
    {{#if imageDataUri}}
    The user has also provided an image to guide this enhancement. Use it as a visual reference for the requested change.
    Reference Image: {{media url=imageDataUri}}
    {{/if}}

**Your Thought Process (Follow these steps):**

1.  **Review and Understand:**
    *   First, carefully review both the HTML/CSS and JavaScript code to understand the structure, styling, functionality, and purpose.
    *   Consider the \`Original User Prompt\` to remember the overall design goal.
    *   Analyze the \`User's Enhancement Request\`. Is it a visual change, functional change, or both?

2.  **Plan Your Changes:**
    *   Based on your analysis, decide which parts of the HTML/CSS and/or JavaScript need to be added, removed, or modified.
    *   Think about the best way to implement the change while maintaining clean, responsive, and valid code.
    *   Consider if the enhancement requires changes to both HTML/CSS and JavaScript, or just one of them.

3.  **Execute the Edit:**
    *   Modify the code by applying your planned changes.
    *   **Crucially, you should only change what is necessary.** Do not rewrite the entire code from scratch if the user only asks for a small change.
    *   Preserve the existing structure and content as much as possible.
    *   Ensure the final code is well-formed and follows best practices.

**Output Requirements:**

You must provide your response in the specified JSON format with two fields:

1. **enhancedCodeSnippet:** The updated HTML/CSS code snippet.
2. **enhancedJavascriptSnippet:** The updated JavaScript code snippet.

**Important:** Do NOT include any explanations, markdown formatting, or comments in the code fields. Just provide the raw code.
`,
};

const enhanceCodeSnippetPrompt = globalAi.definePrompt(promptDefinition);

const enhanceCodeSnippetFlow = globalAi.defineFlow(
  {
    name: 'enhanceCodeSnippetFlow',
    inputSchema: EnhanceCodeSnippetInputSchema,
    outputSchema: EnhanceCodeSnippetOutputSchema,
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
      response = await enhanceCodeSnippetPrompt(input);
    }

    const output = response.output;
    
    if (!output) {
      // Fallback to returning the original code if enhancement fails.
      return { 
        enhancedCodeSnippet: input.codeSnippet,
        enhancedJavascriptSnippet: input.javascriptSnippet
      };
    }

    // Clean up potential markdown formatting from the AI response.
    const enhancedHtmlCode = output.enhancedCodeSnippet.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    const enhancedJsCode = output.enhancedJavascriptSnippet.replace(/^```javascript\n?/, '').replace(/\n?```$/, '').trim();

    return { 
      enhancedCodeSnippet: enhancedHtmlCode,
      enhancedJavascriptSnippet: enhancedJsCode
    };
  }
);
