'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing medical records.
 */

import {ai, runWithModelFallback} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMedicalRecordsInputSchema = z.object({
  medicalRecords: z
    .string()
    .describe("The patient's medical records in a textual format."),
});
export type SummarizeMedicalRecordsInput = z.infer<typeof SummarizeMedicalRecordsInputSchema>;

const SummarizeMedicalRecordsOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the patient medical records.'),
});
export type SummarizeMedicalRecordsOutput = z.infer<typeof SummarizeMedicalRecordsOutputSchema>;

export async function summarizeMedicalRecords(
  input: SummarizeMedicalRecordsInput
): Promise<SummarizeMedicalRecordsOutput> {
  return summarizeMedicalRecordsFlow(input);
}

const summarizeMedicalRecordsPrompt = ai.definePrompt({
  name: 'summarizeMedicalRecordsPrompt',
  input: {schema: SummarizeMedicalRecordsInputSchema},
  output: {schema: SummarizeMedicalRecordsOutputSchema},
  prompt: `You are an AI assistant specializing in summarizing medical records for patients. Please provide a concise and easy-to-understand summary of the following medical records:\n\n{{{medicalRecords}}}\n\nSummary: `,
});

const summarizeMedicalRecordsFlow = ai.defineFlow(
  {
    name: 'summarizeMedicalRecordsFlow',
    inputSchema: SummarizeMedicalRecordsInputSchema,
    outputSchema: SummarizeMedicalRecordsOutputSchema,
  },
  async input => {
    return runWithModelFallback(summarizeMedicalRecordsPrompt, input);
  }
);
