'use server';

/**
 * @fileOverview Jeiva's Birth Acknowledgement Flow (P-6)
 * Generates a warm, quiet acknowledgement when a pregnancy chapter closes.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AcknowledgeBirthInputSchema = z.object({
  firstName: z.string(),
  pregnancyWeeksTracked: z.number().describe('Number of weeks tracked with Jeiva.'),
  weekAtBirth: z.number().describe('Pregnancy week when birth occurred.'),
  daysActiveTotal: z.number().describe('Total days active with Jeiva.'),
  targetLanguage: z.string().optional().default('English'),
});

export type AcknowledgeBirthInput = z.infer<typeof AcknowledgeBirthInputSchema>;

const AcknowledgeBirthOutputSchema = z.object({
  acknowledgement: z.string().describe('A 2-3 sentence warm, quiet birth acknowledgement.'),
});

export type AcknowledgeBirthOutput = z.infer<typeof AcknowledgeBirthOutputSchema>;

export async function acknowledgeBirth(
  input: AcknowledgeBirthInput
): Promise<AcknowledgeBirthOutput> {
  return acknowledgeBirthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'acknowledgeBirthPrompt',
  input: { schema: AcknowledgeBirthInputSchema },
  output: { schema: AcknowledgeBirthOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    MASTER SYSTEM ALWAYS APPLIES (no diagnosis, no alarm, Indian context).

    USER CONTEXT:
    Name: {{{firstName}}}
    Weeks tracked: {{{pregnancyWeeksTracked}}}
    Week at birth: {{{weekAtBirth}}}
    Days active: {{{daysActiveTotal}}}

    CONTEXT:
    The user has just logged the birth of their baby.
    Jeiva has been with them through the journey.
    This is the moment the pregnancy chapter closes and the postpartum chapter begins.

    TASK:
    Write a single birth acknowledgement. Exactly 2–3 sentences.

    RULES:
    1. Acknowledge the birth without hollow celebration. No "congratulations".
    2. Reference the journey Jeiva has witnessed — specific to the weeks tracked ({{{pregnancyWeeksTracked}}}).
    3. Set the tone for what comes next: rest, recovery, and that Jeiva is still here.
    4. BANNED: amazing, wonderful, so proud, you did it, incredible, perfect.
    5. TONE: Warm. Earned. Quiet. Wise friend.

    Output: 2–3 sentences only. No preamble. In {{{targetLanguage}}}.
    `,
});

const acknowledgeBirthFlow = ai.defineFlow(
  {
    name: 'acknowledgeBirthFlow',
    inputSchema: AcknowledgeBirthInputSchema,
    outputSchema: AcknowledgeBirthOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
