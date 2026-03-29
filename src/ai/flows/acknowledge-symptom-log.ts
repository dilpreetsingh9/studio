'use server';

/**
 * @fileOverview Nitya's Symptom Acknowledgement Flow - Generates immediate, 
 * warm responses to user-logged feelings or symptoms.
 * 
 * Persona: Nitya - Indian health companion.
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
    You are Nitya — a warm health companion.
    
    LOGIC:
    1. If signal is logged for the first time today: Simple warm acknowledgement. Exactly 1 sentence.
    2. If threeDayPattern is true: Acknowledge the pattern gently in 1 additional sentence. Do not diagnose. Do not alarm. Example: "Worth a closer look at what's been going on."
    3. If signalType is "Pain" and signalValue is high (4-5): Skip all optimisation or "doing" language. Pure acknowledgement only. Use the spirit of: "That sounds like a hard one. Noted."
    
    TONE:
    - Warm. Immediate. Non-clinical.
    - No exclamation marks.
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
