'use server';

/**
 * @fileOverview Nitya's Medication Nudge Flow - Generates 1-sentence, 18-word reminders 
 * based on identity-based consistency and streak logic.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMissedMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the routine or sustenance.'),
  scheduledTime: z.string().optional().describe('When it was meant to happen.'),
  timeOfDay: z.string().optional().describe('Morning, afternoon, or evening.'),
  dosesOnTime: z.number().optional().default(0),
  missedCount: z.number().describe('How many times it was missed this week.'),
  streakDays: z.number().describe('Consecutive days taken.'),
  relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']).optional().default('new'),
  targetLanguage: z.string().optional().default('English'),
});
export type AnalyzeMissedMedicationInput = z.infer<typeof AnalyzeMissedMedicationInputSchema>;

const AnalyzeMissedMedicationOutputSchema = z.object({
  nudge: z.string().describe('A single warm sentence (max 18 words) focusing on identity and warmth.'),
});
export type AnalyzeMissedMedicationOutput = z.infer<typeof AnalyzeMissedMedicationOutputSchema>;

export async function analyzeMissedMedication(
  input: AnalyzeMissedMedicationInput
): Promise<AnalyzeMissedMedicationOutput> {
  return analyzeMissedMedicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMissedMedicationPrompt',
  input: { schema: AnalyzeMissedMedicationInputSchema },
  output: { schema: AnalyzeMissedMedicationOutputSchema },
  prompt: `
    You are Nitya — a wise and warm health companion for Indian users.
    
    PHILOSOPHY:
    - Consistency is built through identity, not fear.
    - Help the user see themselves as "someone who takes their routine" — not someone who might forget.
    - Zero guilt. Zero clinical language. Zero alarm.
    
    LOGIC:
    1. If missedCount is 0 and streakDays >= 7:
       - Acknowledge the streak. Make it feel earned not hollow.
    2. If missedCount is 1–2:
       - Gentle nudge. Zero guilt. One reframe toward the positive.
    3. If missedCount >= 3:
       - Warm acknowledgement that restarting is the hardest part. One tiny reframe. No lecture.
    4. If relationshipMaturity is "deep":
       - Reference the streak history naturally (e.g., "Your routine has been part of you for twelve days now").

    STRICT OUTPUT CONSTRAINTS:
    - Exactly 1 sentence only.
    - Maximum 18 words.
    - Warm. Personal. Zero clinical language.
    - No exclamation marks. No emoji. Just warmth in plain words.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Medication: {{{medicationName}}}
    Streak: {{{streakDays}}} days
    Missed this week: {{{missedCount}}}
    Maturity: {{{relationshipMaturity}}}
    Time: {{{timeOfDay}}}
    `,
});

const analyzeMissedMedicationFlow = ai.defineFlow(
  {
    name: 'analyzeMissedMedicationFlow',
    inputSchema: AnalyzeMissedMedicationInputSchema,
    outputSchema: AnalyzeMissedMedicationOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
