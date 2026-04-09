'use server';

/**
 * @fileOverview Jeiva's Check-In Confirmation Flow (L-2)
 * Generates a single-sentence, warm closure after a check-in.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const ConfirmCheckInInputSchema = z.object({
  logType: z.enum(['voice', 'mood', 'energy', 'pain', 'stress', 'focus', 'meal', 'activity', 'sleep', 'other']),
  logValue: z.string().describe('The transcript or the numeric value (1-5).'),
  timeOfDay: z.string(),
  isFirst: z.boolean(),
  streak: z.number(),
  patternFlag: z.boolean().describe('True if same signal was low 3 days running.'),
  sex: z.enum(['Female', 'Male', 'Other']),
  targetLanguage: z.string().optional().default('English'),
});
export type ConfirmCheckInInput = z.infer<typeof ConfirmCheckInInputSchema>;

const ConfirmCheckInOutputSchema = z.object({
  confirmation: z.string().describe('Exactly 1 sentence closure. Max 12 words.'),
});
export type ConfirmCheckInOutput = z.infer<typeof ConfirmCheckInOutputSchema>;

export async function confirmLogEntry(input: ConfirmCheckInInput): Promise<ConfirmCheckInOutput> {
  return confirmCheckInFlow(input);
}

const prompt = ai.definePrompt({
  name: 'confirmCheckInPrompt',
  input: { schema: ConfirmCheckInInputSchema },
  output: { schema: ConfirmCheckInOutputSchema },
  prompt: `
    ROLE: Jeiva (Indian health companion).
    TASK: Write a closing line after a check-in.
    
    LOGIC:
    - IF isFirst: "First one noted. That is how it starts."
    - IF logType == voice: Reflect 1 specific item from transcript. No rewriting.
    - IF logType == quick tile: 
        - Value 1-2: Pure witness. No fix.
        - Value 4-5: Warm, brief.
        - Value 3: Neutral.
    - IF patternFlag: Add: "That is three days of low [signal]. Worth sitting with."
    - IF streak in [7, 14, 30]: Add: "[Count] days of checking in. That is something."
    - SEX SPECIFIC:
        - Female + Pain + High: "That sounds like a hard one. Noted."
        - Male + Focus + Low: "Low focus after a short night — that tracks."
    
    CONSTRAINTS:
    - Exactly 1 sentence. Max 12 words.
    - Warm gravity. No exclamation marks.
    - No hollow affirmations (Great/Amazing). 
    - No clinical/instructional language.
    - Output in {{{targetLanguage}}}.

    DATA: 
    Type: {{{logType}}} | Value: {{{logValue}}} | Time: {{{timeOfDay}}} 
    First: {{{isFirst}}} | Streak: {{{streak}}} | Pattern: {{{patternFlag}}} | Sex: {{{sex}}}
  `,
});

const confirmCheckInFlow = ai.defineFlow(
  {
    name: 'confirmCheckInFlow',
    inputSchema: ConfirmCheckInInputSchema,
    outputSchema: ConfirmCheckInOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
