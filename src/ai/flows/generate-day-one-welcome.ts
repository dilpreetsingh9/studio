
'use server';

/**
 * @fileOverview Nitya's Day 1 Welcome Flow - Sets the emotional contract and initial promise.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDayOneWelcomeInputSchema = z.object({
  firstName: z.string(),
  sex: z.string().optional().default('Female'),
  healthFocus: z.string().optional().default('overall balance'),
  timeOfDay: z.string().optional().default('Morning'),
  cityTier: z.enum(['metro', 'tier2', 'tier3', 'unknown']).optional().default('unknown'),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateDayOneWelcomeInput = z.infer<typeof GenerateDayOneWelcomeInputSchema>;

const GenerateDayOneWelcomeOutputSchema = z.object({
  welcomeNote: z.string().describe('A 3-4 sentence warm, honest introductory letter.'),
});

export type GenerateDayOneWelcomeOutput = z.infer<typeof GenerateDayOneWelcomeOutputSchema>;

export async function generateDayOneWelcome(
  input: GenerateDayOneWelcomeInput
): Promise<GenerateDayOneWelcomeOutput> {
  return generateDayOneWelcomeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDayOneWelcomePrompt',
  input: { schema: GenerateDayOneWelcomeInputSchema },
  output: { schema: GenerateDayOneWelcomeOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - This is Day 1. You are making a promise.
    - Not: "We will make you healthy."
    - But: "We will make the next choice a little easier."
    - Nitya observes and suggests. It does not diagnose.
    
    LOGIC:
    1. Use their name ({{{firstName}}}) once naturally, not at the very beginning.
    2. Reference their health focus ({{{healthFocus}}}) specifically.
    3. Set expectations honestly: you spot patterns, you don't prescribe.
    4. End with the smallest possible action for today (< 60 seconds).
    5. Action must be framed as optional: "Whenever you are ready" or "If you get a moment."
    
    CULTURAL FLUENCY:
    - If cityTier is "metro", acknowledge the rush.
    - If cityTier is "tier2/3", acknowledge the grounded rhythm.
    
    STRICT CONSTRAINTS:
    - 3-4 sentences total.
    - No bullet points. No headers.
    - Write it like a letter opener, not an onboarding checklist.
    - Warm. Honest. Personal.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Name: {{{firstName}}}
    Focus: {{{healthFocus}}}
    Time: {{{timeOfDay}}}
    City Tier: {{{cityTier}}}
    `,
});

const generateDayOneWelcomeFlow = ai.defineFlow(
  {
    name: 'generateDayOneWelcomeFlow',
    inputSchema: GenerateDayOneWelcomeInputSchema,
    outputSchema: GenerateDayOneWelcomeOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
