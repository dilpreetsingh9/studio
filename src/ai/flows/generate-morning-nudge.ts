'use server';

/**
 * @fileOverview Nitya's Morning Nudge Flow - Generates a 1-sentence, 12-word 
 * invitation based on relationship maturity.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const MorningNudgeInputSchema = z.object({
  firstName: z.string(),
  daysActive: z.number(),
  yesterdayTheme: z.string().optional().describe('The primary theme of yesterday’s synthesis.'),
  relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']).default('new'),
  targetLanguage: z.string().optional().default('English'),
});
export type MorningNudgeInput = z.infer<typeof MorningNudgeInputSchema>;

const MorningNudgeOutputSchema = z.object({
  nudge: z.string().describe('A single warm invitation sentence (max 12 words).'),
});
export type MorningNudgeOutput = z.infer<typeof MorningNudgeOutputSchema>;

export async function generateMorningNudge(
  input: MorningNudgeInput
): Promise<MorningNudgeOutput> {
  return morningNudgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'morningNudgePrompt',
  input: { schema: MorningNudgeInputSchema },
  output: { schema: MorningNudgeOutputSchema },
  prompt: `
    You are Nitya — a wise health companion.
    
    TASK:
    Write a morning nudge (invitation) for {{{firstName}}}.
    
    PHILOSOPHY:
    - It is a tap on the shoulder, not a push notification.
    - Zero urgency. Zero FOMO.
    - Never reference what was missed.
    - Relationship maturity: {{{relationshipMaturity}}}.

    LOGIC:
    1. If maturity is "new": Simple, warm open invitation.
    2. If maturity is "developing": Light reference to yesterday's focus ({{{yesterdayTheme}}}).
    3. If maturity is "deep": Reference a pattern Nitya has been tracking (e.g. sleep rhythms or morning energy).
    
    STRICT CONSTRAINTS:
    - Exactly 1 sentence.
    - Maximum 12 words.
    - No exclamation marks.
    - Provide the output in {{{targetLanguage}}}.
    `,
});

const morningNudgeFlow = ai.defineFlow(
  {
    name: 'morningNudgeFlow',
    inputSchema: MorningNudgeInputSchema,
    outputSchema: MorningNudgeOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
