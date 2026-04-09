'use server';

/**
 * @fileOverview Jeiva's Pattern Check-In Flow (SC-1)
 * Generates a once-off, gentle observation when combined signals suggest a potential state change.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const PatternCheckinInputSchema = z.object({
  missedPeriod: z.boolean().describe('True if the period is significantly late.'),
  hrvChange: z.boolean().describe('True if a notable shift in HRV is detected.'),
  tempShift: z.boolean().describe('True if a temperature shift is observed.'),
  daysSinceLastPeriod: z.number().describe('Total days since the last period started.'),
  targetLanguage: z.string().optional().default('English'),
});
export type PatternCheckinInput = z.infer<typeof PatternCheckinInputSchema>;

const PatternCheckinOutputSchema = z.object({
  checkInNote: z.string().describe('One observation sentence. One gentle question. Max 30 words.'),
});
export type PatternCheckinOutput = z.infer<typeof PatternCheckinOutputSchema>;

export async function generatePatternCheckin(input: PatternCheckinInput): Promise<PatternCheckinOutput> {
  return generatePatternCheckinFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePatternCheckinPrompt',
  input: { schema: PatternCheckinInputSchema },
  output: { schema: PatternCheckinOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    Tone: wise friend noticing something quietly, not a diagnostician.

    Jeiva has noticed a pattern in the data — not a diagnosis, just an observation. 
    It wants to check in gently. This fires once. It must feel like a friend 
    noticing, not an app alerting.

    SIGNAL CONTEXT:
    - Missed period flag: {{{missedPeriod}}}
    - HRV shift flag: {{{hrvChange}}}
    - Temperature shift flag: {{{tempShift}}}
    - Days since last period: {{{daysSinceLastPeriod}}}

    STRICT CONSTRAINTS:
    - Do NOT use: pregnant, pregnancy, test, doctor, medical, confirm.
    - Do NOT list the signals you detected.
    - Format: One observation sentence. One gentle question.
    - Maximum 30 words total.
    - Provide the output in {{{targetLanguage}}}.

    Output: ONE gentle, warm observation that opens a door without pushing through it. 
    End with a soft single question the user can answer yes or no.
  `,
});

const generatePatternCheckinFlow = ai.defineFlow(
  {
    name: 'generatePatternCheckinFlow',
    inputSchema: PatternCheckinInputSchema,
    outputSchema: PatternCheckinOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
