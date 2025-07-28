
'use server';
/**
 * @fileOverview Converts a text description and optional image into separate HTML, CSS, and JavaScript files.
 *
 * - generateCode - A function that handles the code generation process.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateCodeInputSchema = z.object({
  description: z.string().describe('A description of the web design.'),
  imageDataUri: z
    .string()
    .nullable()
    .optional()
    .describe(
      "An optional image of a design, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  apiKey: z.string().optional().describe('Optional API key for Google AI.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  files: z.array(z.object({
    name: z.string().describe('The filename with extension'),
    content: z.string().describe('The file content'),
    type: z.enum(['html', 'css', 'javascript', 'json', 'md', 'txt']).describe('The file type')
  })).describe('Array of generated files')
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const promptDefinition = {
  name: 'generateCodeFromPrompt',
  input: {schema: GenerateCodeInputSchema},
  output: {schema: GenerateCodeOutputSchema},
  prompt: `You are an AI front-end developer and an expert in modern UI/UX design. Your task is to generate a complete, production-quality web project with separate files based on a user's description and an optional image reference.

**Core Principles:**

*   **Modern & Aesthetic:** Create visually appealing, clean, and modern designs. Use proper spacing, typography, and a cohesive color scheme.
*   **Responsive:** The design MUST be fully responsive and look great on all screen sizes (mobile, tablet, desktop). Use Tailwind's responsive prefixes (e.g., \`md:\`, \`lg:\`).
*   **Semantic HTML:** Use appropriate HTML5 tags (\`<section>\`, \`<nav>\`, \`<article>\`, etc.) to structure the content logically.
*   **Component-Based Thinking:** Structure the code as if it were composed of reusable components. Use consistent styling for similar elements.
*   **Interactive JavaScript:** Add meaningful JavaScript functionality that enhances user experience (animations, form validation, dynamic content, etc.).
*   **File Organization:** Create a well-organized file structure with separate files for HTML, CSS, and JavaScript.
*   **Placeholders:** For images, use placeholders from \`https://placehold.co\`. For example: \`https://placehold.co/600x400\`.
*   **AI Hints for Images:** On every \`<img>\` tag you generate, add a \`data-ai-hint\` attribute with one or two keywords that describe the image content (e.g., \`data-ai-hint="office team"\`). This is crucial.

**User's Request:**

*   **Description:** "{{{description}}}"
{{#if imageDataUri}}
*   **Image Reference:** You have been provided with an image. Use it as a strong visual guide for layout, style, colors, and content.
    Reference Image: {{media url=imageDataUri}}
{{/if}}

**Required Files to Generate:**

1. **index.html** - The main HTML file with proper structure, semantic elements, and Tailwind CSS CDN link
2. **style.css** - Custom CSS file for any additional styles beyond Tailwind (animations, custom components, etc.)
3. **script.js** - JavaScript file with interactive functionality, event listeners, and dynamic features
4. **README.md** - Documentation explaining the project, features, and how to use it

**Optional Files (generate if needed):**
- **config.json** - Configuration file for any settings
- **data.json** - Sample data for dynamic content
- **components/** - Additional component files if the project is complex

**File Structure Guidelines:**

**index.html:**
- Clean, semantic HTML structure
- Include Tailwind CSS CDN: \`<script src="https://cdn.tailwindcss.com"></script>\`
- Link to external CSS and JS files
- Proper meta tags and accessibility attributes
- Responsive design considerations

**style.css:**
- Custom CSS that complements Tailwind
- Animations and transitions
- Custom component styles
- Media queries for responsive design
- CSS variables for consistent theming

**script.js:**
- Modern ES6+ JavaScript
- Event listeners and user interactions
- Form validation
- Dynamic content updates
- Smooth animations and transitions
- Error handling and best practices

**README.md:**
- Project description
- Features list
- Setup instructions
- Usage examples
- File structure explanation

**JavaScript Guidelines:**
- Use modern ES6+ syntax
- Include proper error handling
- Make the code reusable and well-commented
- Focus on enhancing user experience with smooth animations and interactions
- Ensure the JavaScript works seamlessly with the HTML structure

**Important:** Provide each file as a separate object in the files array with the correct name, content, and type. Do NOT include any explanations, comments, or markdown formatting in the file contents. Just provide the raw code.
`,
};

const prompt = globalAi.definePrompt(promptDefinition);

const generateCodeFlow = globalAi.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
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
      response = await prompt(input);
    }
    
    const output = response.output;
    
    if (!output || !output.files || output.files.length === 0) {
      // Fallback to returning basic files if the model fails.
      return { 
        files: [
          {
            name: 'index.html',
            content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated Design</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="container mx-auto p-4">\n        <h1 class="text-2xl font-bold">Generated Design</h1>\n        <p>Your design will appear here.</p>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>',
            type: 'html'
          },
          {
            name: 'style.css',
            content: '/* Custom styles */\nbody {\n    margin: 0;\n    padding: 0;\n    font-family: Arial, sans-serif;\n}',
            type: 'css'
          },
          {
            name: 'script.js',
            content: '// JavaScript functionality\nconsole.log("Script loaded");',
            type: 'javascript'
          },
          {
            name: 'README.md',
            content: '# Generated Web Project\n\nThis is a generated web project based on your description.\n\n## Files\n- index.html - Main HTML file\n- style.css - Custom styles\n- script.js - JavaScript functionality\n\n## Setup\n1. Open index.html in a web browser\n2. All files should be in the same directory',
            type: 'md'
          }
        ]
      };
    }

    // Clean up potential markdown formatting from file contents
    const cleanedFiles = output.files.map(file => ({
      ...file,
      content: file.content.replace(/^```(html|css|javascript|js|json|md|markdown)\n?/, '').replace(/\n?```$/, '').trim()
    }));

    return { files: cleanedFiles };
  }
);
