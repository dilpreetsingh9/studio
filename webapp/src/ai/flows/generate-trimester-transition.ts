'use server';

/**
 * @fileOverview Jeiva's Trimester Transition Flow (P-3)
 * Generates a warm, culturally fluent acknowledgement when entering a new trimester.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTrimesterTransitionInputSchema = z.object({
  firstName: z.string(),
  enteringTrimester: z.number().describe('The trimester being entered (2 or 3)'),
  currentWeek: z.number(),
  daysActive: z.number(),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateTrimesterTransitionInput = z.infer<typeof GenerateTrimesterTransitionInputSchema>;

const GenerateTrimesterTransitionOutputSchema = z.object({
  transitionNote: z.string().describe('A 4-sentence warm transition acknowledgement.'),
});

export type GenerateTrimesterTransitionOutput = z.infer<typeof GenerateTrimesterTransitionOutputSchema>;

export async function generateTrimesterTransition(
  input: GenerateTrimesterTransitionInput
): Promise<GenerateTrimesterTransitionOutput> {
  return generateTrimesterTransitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTrimesterTransitionPrompt',
  input: { schema: GenerateTrimesterTransitionInputSchema },
  output: { schema: GenerateTrimesterTransitionOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    MASTER SYSTEM ALWAYS APPLIES.

    USER CONTEXT:
    Name: {{{firstName}}}
    Entering trimester: {{{enteringTrimester}}}
    Current week: {{{currentWeek}}}
    Days active with Jeiva: {{{daysActive}}}

    TRIMESTER 2 TRANSITION (week 13):
    What changes: Morning sickness usually eases. Energy returns. Risk profile changes significantly — many families share the news now.
    What the body is doing: Baby's organs are formed. Growth accelerates.
    Indian context: Appetite returns — good time to focus on iron and folate. Many families have a godh bharai ceremony around this time.

    TRIMESTER 3 TRANSITION (week 27):
    What changes: Discomfort increases. Sleep becomes harder. Baby is gaining weight fast.
    What the body is doing: Baby's lungs are maturing. Brain developing rapidly.
    Indian context: This is when preparation begins — hospital bag, birth plan, conversations with family. Left-side sleeping now matters for circulation.

    TASK:
    Write a trimester transition acknowledgement for entering trimester {{{enteringTrimester}}}.
    This moment matters. Jeiva has been with {{{firstName}}} through this journey.
    Acknowledge the milestone warmly and specifically.

    RULES:
    1. Name the transition warmly. Not "You have reached trimester X" — something human.
    2. What typically changes from here. One sentence.
    3. What her body is doing. One sentence. Warm, not clinical.
    4. One practical or cultural note specific to this transition. One sentence.

    CONSTRAINTS:
    - Exactly 4 sentences total.
    - No bullet points. No headers. No preamble.
    - Provide the output in {{{targetLanguage}}}.
    `,
});

const generateTrimesterTransitionFlow = ai.defineFlow(
  {
    name: 'generateTrimesterTransitionFlow',
    inputSchema: GenerateTrimesterTransitionInputSchema,
    outputSchema: GenerateTrimesterTransitionOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
