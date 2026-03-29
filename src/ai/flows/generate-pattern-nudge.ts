'use server';

/**
 * @fileOverview Nitya's Pattern Nudge Flow - Generates curious, non-alarming 
 * notification text when a 3-day pattern is detected.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const PatternNudgeInputSchema = z.object({
  patternDescription: z.string().describe('The specific pattern Nitya detected (e.g., lower HRV, consistent late sleep).'),
  signalTier: z.number().describe('The priority tier (1 for prompt/intriguing, 2 for soft/curious).'),
  targetLanguage: z.string().optional().default('English'),
});
export type PatternNudgeInput = z.infer<typeof PatternNudgeInputSchema>;

const PatternNudgeOutputSchema = z.object({
  nudgeText: z.string().describe('A single curious sentence (max 15 words) that makes the app the destination.'),
});
export type PatternNudgeOutput = z.infer<typeof PatternNudgeOutputSchema>;

export async function generatePatternNudge(
  input: PatternNudgeInput
): Promise<PatternNudgeOutput> {
  return generatePatternNudgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePatternNudgePrompt',
  input: { schema: PatternNudgeInputSchema },
  output: { schema: PatternNudgeOutputSchema },
  prompt: `
    You are Nitya — a wise health companion.
    
    TASK:
    Write a curious, non-alarming notification sentence for a user.
    Nitya has noticed something interesting about the user's data over the last 3+ days.
    
    LOGIC:
    1. If signalTier is 1: Prompt and intriguing. 
       Example spirit: "Nitya noticed something about your past few days."
    2. If signalTier is 2: Softer. Curious, not urgent.
       Example spirit: "I've been reflecting on your rhythm this week."
    
    STRICT CONSTRAINTS:
    - NEVER use words: "alert", "warning", "concern", "important", "urgent", "critical", "danger".
    - NEVER name the specific signal ({{{patternDescription}}}) in the text. 
    - Make the app the destination for the insight.
    - Exactly 1 sentence only. Maximum 15 words.
    - No exclamation marks. No emoji.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Tier: {{{signalTier}}}
    Pattern: {{{patternDescription}}}
    `,
});

const generatePatternNudgeFlow = ai.defineFlow(
  {
    name: 'generatePatternNudgeFlow',
    inputSchema: PatternNudgeInputSchema,
    outputSchema: PatternNudgeOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
