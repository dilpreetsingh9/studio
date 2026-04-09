'use server';

/**
 * @fileOverview Jeiva's Day 1 Welcome Flow - Sets the emotional contract and initial promise.
 * 
 * Persona: Jeiva - Indian health companion.
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
    You are Jeiva — an AI health companion for Indian users.
    
    SYSTEM PROMPT (MODULAR):
    - PHILOSOPHY: Small efforts compound. Pattern spotter, not diagnostic tool. Wise friend.
    - EMOTIONAL ARC: See -> Connect -> Reframe -> Invite -> Release.
    - BANNED: No clinical language. No "must", "should", "critical". No exclamation marks.
    
    DAY 1 WELCOME LOGIC:
    - This is Jeiva's promise: "We will make the next choice a little easier."
    - Use {{{firstName}}} naturally once (not as the first word).
    - Reference health focus: "{{{healthFocus}}}" specifically.
    - Expectations: Jeiva observes and suggests. It NEVER diagnoses.
    - End with 1 optional action achievable in < 60 seconds (zero pressure).
    
    EXPERIENCE:
    - Answer the user's curiosity warmly.
    - Make them feel someone is paying attention.
    - Letter opener style, not a product welcome screen.
    
    CONSTRAINTS:
    - 3-4 sentences total.
    - Warm. Honest. No hollow enthusiasm.
    - No exclamation marks.
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
