'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating health goals based on patient data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHealthGoalsInputSchema = z.object({
  medicalHistory: z.string(),
  currentVitals: z.string(),
  existingGoals: z.array(z.string()),
  targetLanguage: z.string().optional().default('English').describe('The language for the suggested goals.'),
});

export type GenerateHealthGoalsInput = z.infer<typeof GenerateHealthGoalsInputSchema>;

const HealthGoalSchema = z.object({
  name: z.string().describe('Short name of the goal'),
  target: z.number().describe('Target numerical value'),
  unit: z.string().describe('Unit for the target value'),
  rationale: z.string().describe('Why this goal is recommended based on patient data'),
});

const GenerateHealthGoalsOutputSchema = z.object({
  recommendedGoals: z.array(HealthGoalSchema),
});

export type GenerateHealthGoalsOutput = z.infer<typeof GenerateHealthGoalsOutputSchema>;

export async function generateHealthGoals(
  input: GenerateHealthGoalsInput
): Promise<GenerateHealthGoalsOutput> {
  return generateHealthGoalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthGoalsPrompt',
  input: { schema: GenerateHealthGoalsInputSchema },
  output: { schema: GenerateHealthGoalsOutputSchema },
  prompt: `You are a medical health coach assistant. 
    Based on the following patient details, suggest 3 highly relevant and specific health goals.
    PROVIDE ALL OUTPUT FIELDS IN {{{targetLanguage}}}.
    
    Medical History: {{{medicalHistory}}}
    Current Vitals: {{{currentVitals}}}
    Existing Goals: {{#each existingGoals}}- {{{this}}}{{/each}}

    Focus on goals that address the patient's specific conditions. Ensure the names, units, and rationales are written in {{{targetLanguage}}}.
    `,
});

const generateHealthGoalsFlow = ai.defineFlow(
  {
    name: 'generateHealthGoalsFlow',
    inputSchema: GenerateHealthGoalsInputSchema,
    outputSchema: GenerateHealthGoalsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
