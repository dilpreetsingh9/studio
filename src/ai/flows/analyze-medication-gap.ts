'use server';

/**
 * @fileOverview Nitya's Medication Gap Intelligence Flow - Generates warm,
 * zero-guilt observations when a user misses a routine dose.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeMedicationGapInputSchema = z.object({
  medicationName: z.string().describe('The name of the missed routine.'),
  consecutiveMissed: z.number().describe('How many days in a row the dose was missed.'),
  priorStreak: z.number().describe('The streak count before the first miss occurred.'),
  targetLanguage: z.string().optional().default('English'),
});
export type AnalyzeMedicationGapInput = z.infer<typeof AnalyzeMedicationGapInputSchema>;

const AnalyzeMedicationGapOutputSchema = z.object({
  observation: z.string().describe('A 1-2 sentence warm, forward-facing acknowledgement.'),
});
export type AnalyzeMedicationGapOutput = z.infer<typeof AnalyzeMedicationGapOutputSchema>;

export async function analyzeMedicationGap(
  input: AnalyzeMedicationGapInput
): Promise<AnalyzeMedicationGapOutput> {
  return analyzeMedicationGapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMedicationGapPrompt',
  input: { schema: AnalyzeMedicationGapInputSchema },
  output: { schema: AnalyzeMedicationGapOutputSchema },
  prompt: `
    You are Nitya — a wise health companion.
    
    PHILOSOPHY:
    - Zero guilt. Zero pressure.
    - Yesterday is gone; today is a clean start.
    - Witness the disruption, don't lecture about it.
    - Help the user return to their rhythm by focusing on the next small action.

    LOGIC:
    1. consecutiveMissed == 1: 
       - Light acknowledgement. Focus on the clean start today.
       - Example: "Yesterday's {{{medicationName}}} got away. Today is a clean start."
    2. consecutiveMissed == 2:
       - Warmer acknowledgement. Reference the {{{priorStreak}}} as something real and achievable.
    3. consecutiveMissed >= 3 and <= 7:
       - Honest and caring. Acknowledge that restarting is the hardest part.
       - One tiny action only: just today's dose. No lecture on consequences.
    
    STRICT CONSTRAINTS:
    - 1-2 sentences maximum.
    - Warm. Personal. Forward-facing.
    - No clinical warnings or side effect talk.
    - No exclamation marks.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Medication: {{{medicationName}}}
    Consecutive Missed: {{{consecutiveMissed}}}
    Prior Streak: {{{priorStreak}}} days
    `,
});

const analyzeMedicationGapFlow = ai.defineFlow(
  {
    name: 'analyzeMedicationGapFlow',
    inputSchema: AnalyzeMedicationGapInputSchema,
    outputSchema: AnalyzeMedicationGapOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
