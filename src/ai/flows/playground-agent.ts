
'use server';
/**
 * @fileOverview An AI agent that assists with coding in the playground.
 *
 * - chatWithPlaygroundAgent - A function that handles the chat interaction.
 * - PlaygroundAgentInput - The input type for the chat function.
 * - PlaygroundAgentOutput - The return type for the chat function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const PlaygroundFileInputSchema = z.object({
  path: z.string().describe('The full path of the file.'),
  content: z.string().describe('The content of the file.'),
});

const PlaygroundAgentInputSchema = z.object({
  prompt: z.string().describe("The user's message or question to the agent."),
  activeFile: z.string().describe('The path of the file currently open in the editor.'),
  files: z.array(PlaygroundFileInputSchema).describe('An array of all files in the playground project.'),
  history: z
    .array(z.any())
    .describe('The previous conversation history between the user and the agent.'),
  imageDataUri: z
    .string()
    .nullable()
    .optional()
    .describe(
      'An optional image reference for the prompt, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
  apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type PlaygroundAgentInput = z.infer<typeof PlaygroundAgentInputSchema>;

const FileChangeSchema = z.object({
    path: z.string().describe('The full path of the file to be modified or created.'),
    content: z.string().describe('The entire new content of the file.'),
});

const PlaygroundAgentOutputSchema = z.object({
  response: z.string().describe("The agent's text response to the user."),
  fileChanges: z.array(FileChangeSchema).optional().describe('An array of files to be updated with new content. Only include files that have been modified or are new.'),
  filesToDelete: z.array(z.string()).optional().describe('An array of full file paths to be deleted.'),
});
export type PlaygroundAgentOutput = z.infer<typeof PlaygroundAgentOutputSchema>;

export async function chatWithPlaygroundAgent(input: PlaygroundAgentInput): Promise<PlaygroundAgentOutput> {
  return playgroundAgentFlow(input);
}

const promptDefinition = {
  name: 'playgroundAgentPrompt',
  input: {schema: PlaygroundAgentInputSchema},
  output: {schema: PlaygroundAgentOutputSchema},
  prompt: `You are an expert AI software developer and pair programmer integrated into a web-based code playground.

**Your Role:**
Your primary role is to assist the user by answering questions and proposing changes to their code directly within the playground environment. You have full control over the file system. Your proposals will be reviewed by the user before being applied.

**Context Provided:**
*   **User's Prompt:** '{{{prompt}}}'
*   **Active File:** The user currently has '{{{activeFile}}}' open in their editor. This is their main focus.
*   **All Project Files:** You have access to the complete list of files (with full paths) and their content in the playground: '{{{json files}}}'
*   **Conversation History:** '{{{json history}}}'
{{#if imageDataUri}}
*   **Image Reference:** The user has attached an image to guide their request. Use it as a visual reference.
    Reference Image: {{media url=imageDataUri}}
{{/if}}

**Your Task & Rules:**

1.  **Analyze Intent:** Carefully analyze the "User's Prompt" to determine if it's a request for code modification or a general knowledge question.

2.  **Execution Flow for CODE CHANGES:**
    *   If the user's request requires modifying the file system (creating, updating, deleting files/folders), you MUST formulate a plan. This includes requests to "add a feature", "fix a bug", "refactor code", "create a file", "delete a folder", etc.
    *   **Create/Update Files:** To create a new file or update an existing one, add an object to the \`fileChanges\` array. This object must contain the full \`path\` of the file and its complete new \`content\`.
    *   **Delete Files:** To delete a file, add its full \`path\` as a string to the \`filesToDelete\` array. To delete a folder, add all file paths within that folder to the \`filesToDelete\` array.
    *   **Conversational Response:** Your \`response\` field must contain your conversational reply, explaining the changes you're proposing. For any files you are changing, you should also include their complete new content in a markdown code block within this response (e.g., \`\`\`tsx\`).
    *   **CRITICAL:** You have full control to create, update, and delete files and folders. Do not state that you are unable to perform these actions. Only include files in your plan that are actually being changed, created, or deleted.

3.  **Execution Flow for KNOWLEDGE QUESTIONS:**
    *   If the user asks a question that does not require code changes (e.g., "what is React?", "how do hooks work?"), you MUST respond differently.
    *   You MUST return EMPTY arrays for \`fileChanges\` and \`filesToDelete\`.
    *   The \`response\` field MUST contain only your conversational, helpful answer. Do NOT include any code blocks unless they are for illustrative purposes within the explanation. Do NOT propose file changes.

**Output Format:**
Your entire response MUST be a single, valid JSON object that strictly adheres to the specified output schema and the rules above.
`,
};

const playgroundAgentPrompt = globalAi.definePrompt(promptDefinition);

const playgroundAgentFlow = globalAi.defineFlow(
  {
    name: 'playgroundAgentFlow',
    inputSchema: PlaygroundAgentInputSchema,
    outputSchema: PlaygroundAgentOutputSchema,
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
      response = await playgroundAgentPrompt(input);
    }

    const output = response.output;
    
    if (!output) {
      throw new Error("Failed to get a structured response from the AI.");
    }

    return output;
  }
);
