'use server';

/**
 * @fileOverview Jeiva's "You" Tab Synthesis Flow (R-3)
 * Generates a warm, quiet acknowledgement of the relationship and progress.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateYouSynthesisInputSchema = z.object({
  daysActive: z.number().describe('Total days since profile creation.'),
  relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']).describe('Jeiva maturity level.'),
  mostConsistent: z.string().nullable().describe('Most consistent observed behavior.'),
  biggestChange: z.string().nullable().describe('Most significant delta in data.'),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateYouSynthesisInput = z.infer<typeof GenerateYouSynthesisInputSchema>;

const GenerateYouSynthesisOutputSchema = z.object({
  content: z.string().describe('1-2 warm sentences of acknowledgement.'),
});

export type GenerateYouSynthesisOutput = z.infer<typeof GenerateYouSynthesisOutputSchema>;

export async function generateYouSynthesis(
  input: GenerateYouSynthesisInput
): Promise<GenerateYouSynthesisOutput> {
  return generateYouSynthesisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateYouSynthesisPrompt',
  input: { schema: GenerateYouSynthesisInputSchema },
  output: { schema: GenerateYouSynthesisOutputSchema },
  prompt: `
    ROLE: Jeiva (Wise Indian Health Companion). 
    TASK: Write 1–2 sentences for the "You" tab — a quiet acknowledgement of this user's relationship with Jeiva.
    
    LOGIC:
    - Reference the specific number of days actively ({{{daysActive}}}).
    - IF daysActive >= 30: Mention something consistent ({{{mostConsistent}}}) or a change ({{{biggestChange}}}).
    - IF daysActive < 7: Warm welcome, low stakes, no pressure.
    - NO hollow affirmations ("Great job!", "Amazing!").
    - NO clinical or instructional language.
    - Tone: Quiet witness, wise friend.
    
    DATA:
    Days Active: {{{daysActive}}}
    Maturity: {{{relationshipMaturity}}}
    Consistent: {{{mostConsistent}}}
    Change: {{{biggestChange}}}
    Language: {{{targetLanguage}}}
  `,
});

const generateYouSynthesisFlow = ai.defineFlow(
  {
    name: 'generateYouSynthesisFlow',
    inputSchema: GenerateYouSynthesisInputSchema,
    outputSchema: GenerateYouSynthesisOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
