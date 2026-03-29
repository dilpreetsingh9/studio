
'use server';

/**
 * @fileOverview This file defines a Genkit flow for observing the impact of missed routines.
 * persona: Nitya - AI health companion for Indian users.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMissedMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the routine or sustenance.'),
  dosage: z.string().describe('The amount.'),
  medicalHistory: z.string().describe('The user\'s background for context.'),
  targetLanguage: z.string().optional().default('English'),
});
export type AnalyzeMissedMedicationInput = z.infer<typeof AnalyzeMissedMedicationInputSchema>;

const AnalyzeMissedMedicationOutputSchema = z.object({
  consequences: z.string().describe('Observations on how this might affect the day\'s rhythm.'),
  seriousness: z.enum(['Low', 'Medium', 'High']).describe('The level of mindfulness recommended.'),
  actionPlan: z.string().describe('A simple, under-2-minute invitation for what to do next.'),
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
  prompt: `You are Nitya, a wise and warm health companion for Indian users. 
    Someone has missed a part of their routine: {{{medicationName}}} ({{{dosage}}}).
    
    User Context: {{{medicalHistory}}}
    
    Task:
    1. Observe the impact on their daily rhythm.
    2. Suggest a next step that is achievable in UNDER 2 MINUTES.
    
    STRICT CONSTRAINTS:
    - Never use: must, should, critical, urgent, risk, danger, never miss, cannot miss, important (as warning), optimal, perfect.
    - Be culturally fluent (Indian context: foods, family rhythms, heat, local habits).
    - Provide the output in {{{targetLanguage}}}.
    - Tone: Warm, honest, specific, like a wise friend. No clinical language.
    
    Example action plan: "Take it now with a glass of room-temperature water. If it is already close to your afternoon tea, just skip this one and stay steady with the next."
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
