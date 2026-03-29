'use server';

/**
 * @fileOverview Jeiva's Symptom Acknowledgement Flow - Generates immediate, 
 * warm responses to user-logged feelings or symptoms.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AcknowledgeSymptomInputSchema = z.object({
  signalType: z.string().describe('The type of feeling logged (e.g., Mood, Energy, Pain).'),
  signalValue: z.number().describe('The intensity score (1-5).'),
  sameAsYesterday: z.boolean().optional().default(false),
  threeDayPattern: z.boolean().optional().default(false).describe('True if the same score was logged 3 days in a row.'),
  targetLanguage: z.string().optional().default('English'),
});
export type AcknowledgeSymptomInput = z.infer<typeof AcknowledgeSymptomInputSchema>;

const AcknowledgeSymptomOutputSchema = z.object({
  acknowledgement: z.string().describe('A 1-2 sentence warm, non-clinical response.'),
});
export type AcknowledgeSymptomOutput = z.infer<typeof AcknowledgeSymptomOutputSchema>;

export async function acknowledgeSymptomLog(
  input: AcknowledgeSymptomInput
): Promise<AcknowledgeSymptomOutput> {
  return acknowledgeSymptomLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'acknowledgeSymptomLogPrompt',
  input: { schema: AcknowledgeSymptomInputSchema },
  output: { schema: AcknowledgeSymptomOutputSchema },
  prompt: `
    SYSTEM:
    PROMPT 00: IDENTITY
    You are Jeiva — a warm health companion.
    Tone: Wise friend, witnessing, non-performing.
    
    LOGIC:
    1. If signal is logged for the first time today: Exactly 1 sentence acknowledgement.
    2. If threeDayPattern is true: Acknowledge the consistency gently in 1 additional sentence. 
       - NEVER diagnose. NEVER alarm. 
       - Spirit: "I've noted this pattern over the last few days."
    3. If signalType is "Pain" and signalValue is high (4-5): Pure witnessing.
       - NO "doing" language. NO optimization advice.
       - Spirit: "That sounds like a hard one. Noted."
    
    CONSTRAINTS:
    - 1-2 sentences maximum.
    - NO exclamation marks. NO hollow affirmations.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Signal: {{{signalType}}}
    Value: {{{signalValue}}}/5
    Pattern: {{#if threeDayPattern}}3-day consistency detected{{else}}Daily log{{/if}}
    `,
});

const acknowledgeSymptomLogFlow = ai.defineFlow(
  {
    name: 'acknowledgeSymptomLogFlow',
    inputSchema: AcknowledgeSymptomInputSchema,
    outputSchema: AcknowledgeSymptomOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
