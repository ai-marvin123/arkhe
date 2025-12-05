import * as z from 'zod';

// 1. THE CONTRACT (Your Zod Schema) - Mold
const AiResponseSchema = z.object({
  mermaidSyntax: z.string(),
  jsonStructure: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(['FILE', 'FOLDER']), // Strict rule
      })
    ),
    edges: z.array(z.any()), // Simplified for brevity
  }),
});

// 2. Mock data
async function mockCallToLLM(prompt: string): Promise<string> {
  return `
    {
      "mermaidSyntax": "graph TD; ...",
      "jsonStructure": {
        "nodes": [
          { "id": "1", "label": "App.tsx", "type": "FILE" } 
        ],
        "edges": []
      }
    }
    `;
}

// 3. THE SAFEGUARD (Applying Zod)
async function generateStructure() {
  console.log('🤖 Asking AI...');
  const rawString = await mockCallToLLM('Create a React structure');

  try {
    const rawJson = JSON.parse(rawString);
    const result = AiResponseSchema.safeParse(rawJson);

    if (!result.success) {
      console.error('AI Hallucinated! Validation Failed.');

      console.error(result.error.format().jsonStructure?.nodes?.[0]);

      // Action: You can retry the AI call automatically here!
      return;
    }

    const safeData = result.data;
    console.log(
      'Data is safe to send to Frontend:',
      safeData.jsonStructure.nodes[0].label
    );
  } catch (e) {
    console.error('AI returned invalid JSON syntax (missing brackets, etc)');
  }
}

generateStructure();
