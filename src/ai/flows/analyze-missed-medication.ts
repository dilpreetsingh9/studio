'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing the consequences of missing a medication dose.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMissedMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the medication missed.'),
  dosage: z.string().describe('The dosage of the medication.'),
  medicalHistory: z.string().describe('The patient\'s medical history for context.'),
  targetLanguage: z.string().optional().default('English'),
});
export type AnalyzeMissedMedicationInput = z.infer<typeof AnalyzeMissedMedicationInputSchema>;

const AnalyzeMissedMedicationOutputSchema = z.object({
  consequences: z.string().describe('Potential clinical downsides of missing this dose.'),
  seriousness: z.enum(['Low', 'Medium', 'High']).describe('The seriousness level of missing this dose.'),
  actionPlan: z.string().describe('Clear instructions on what to do next (e.g., take it now, skip it).'),
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
  prompt: `You are a clinical pharmacist AI assistant. 
    A patient has missed a dose of {{{medicationName}}} ({{{dosage}}}).
    
    Patient Context: {{{medicalHistory}}}
    
    Analyze the risks of missing this specific medication given their history. 
    Provide the output in {{{targetLanguage}}}.
    
    Guidelines:
    - Be clinically accurate but use patient-friendly language.
    - If it's a critical medication (like insulin or heart meds), set seriousness to High.
    - Provide a specific action plan based on standard medical advice (e.g., "Take it as soon as you remember, but if it's almost time for your next dose, skip the missed one").
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
