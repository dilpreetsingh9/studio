'use server';

/**
 * @fileOverview Provides AI-powered personalized insights based on patient medical data.
 *
 * - getPersonalizedInsights - A function that retrieves personalized health insights.
 * - GetPersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - GetPersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPersonalizedInsightsInputSchema = z.object({
  medicalData: z.string().describe('The aggregated medical data of the patient.'),
  patientHistory: z.string().optional().describe('Additional patient history or context.'),
});

export type GetPersonalizedInsightsInput = z.infer<typeof GetPersonalizedInsightsInputSchema>;

const GetPersonalizedInsightsOutputSchema = z.object({
  insights: z.string().describe('Personalized health insights and recommendations.'),
});

export type GetPersonalizedInsightsOutput = z.infer<typeof GetPersonalizedInsightsOutputSchema>;

export async function getPersonalizedInsights(input: GetPersonalizedInsightsInput): Promise<GetPersonalizedInsightsOutput> {
  return getPersonalizedInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPersonalizedInsightsPrompt',
  input: {schema: GetPersonalizedInsightsInputSchema},
  output: {schema: GetPersonalizedInsightsOutputSchema},
  prompt: `You are an AI health assistant providing personalized insights based on the patient's medical data.

  Analyze the following medical data and patient history (if available) to identify potential health risks and provide personalized recommendations.

  Medical Data: {{{medicalData}}}
  Patient History: {{{patientHistory}}}

  Provide insights and recommendations in a clear and concise manner.
  Remember to act as a reasoning tool that presents important facts or recommendations to the user, and do not include any introductory or concluding remarks.
  For example, your response should be in the format of a bulleted list of insights and recommendations.
  `,
});

const getPersonalizedInsightsFlow = ai.defineFlow(
  {
    name: 'getPersonalizedInsightsFlow',
    inputSchema: GetPersonalizedInsightsInputSchema,
    outputSchema: GetPersonalizedInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
