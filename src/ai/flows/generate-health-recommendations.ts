'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating health recommendations and next steps based on aggregated medical records.
 *
 * It includes:
 * - `generateHealthRecommendations` - An async function to generate health recommendations.
 * - `GenerateHealthRecommendationsInput` - The input type for the generateHealthRecommendations function.
 * - `GenerateHealthRecommendationsOutput` - The output type for the generateHealthRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHealthRecommendationsInputSchema = z.object({
  medicalRecords: z
    .string()
    .describe(
      'Aggregated medical records of the patient, including but not limited to diagnoses, lab results, medications, and past procedures.'
    ),
  patientDetails: z
    .string()
    .describe(
      'Relevant details about the patient, such as age, gender, known allergies, and existing health conditions.'
    ),
});

export type GenerateHealthRecommendationsInput = z.infer<
  typeof GenerateHealthRecommendationsInputSchema
>;

const GenerateHealthRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'A list of personalized health recommendations and next steps for the patient, based on their medical records and patient details.'
    ),
});

export type GenerateHealthRecommendationsOutput = z.infer<
  typeof GenerateHealthRecommendationsOutputSchema
>;

export async function generateHealthRecommendations(
  input: GenerateHealthRecommendationsInput
): Promise<GenerateHealthRecommendationsOutput> {
  return generateHealthRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthRecommendationsPrompt',
  input: {schema: GenerateHealthRecommendationsInputSchema},
  output: {schema: GenerateHealthRecommendationsOutputSchema},
  prompt: `You are an AI assistant specializing in providing personalized health recommendations.

  Based on the provided medical records and patient details, generate a list of actionable health recommendations and potential next steps for the patient.
  Consider preventive measures, lifestyle adjustments, potential risks, and relevant medical advice.

  Medical Records: {{{medicalRecords}}}
  Patient Details: {{{patientDetails}}}

  Please provide clear, concise, and easy-to-understand recommendations that the patient or their family can use to improve their health outcomes.
  Focus on the most important and impactful actions they can take.
  Make sure the output is a string.
  `,
});

const generateHealthRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateHealthRecommendationsFlow',
    inputSchema: GenerateHealthRecommendationsInputSchema,
    outputSchema: GenerateHealthRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
