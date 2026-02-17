'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a medical document image.
 *
 * - analyzeMedicalDocument - A function that analyzes a medical document image and returns a summary.
 * - AnalyzeMedicalDocumentInput - The input type for the analyzeMedicalDocument function.
 * - AnalyzeMedicalDocumentOutput - The return type for the analyzeMedicalDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMedicalDocumentInputSchema = z.object({
  documentImage: z.string().describe(
    "A photo of a medical document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type AnalyzeMedicalDocumentInput = z.infer<
  typeof AnalyzeMedicalDocumentInputSchema
>;

const AnalyzeMedicalDocumentOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the provided medical document.'),
});
export type AnalyzeMedicalDocumentOutput = z.infer<
  typeof AnalyzeMedicalDocumentOutputSchema
>;

export async function analyzeMedicalDocument(
  input: AnalyzeMedicalDocumentInput
): Promise<AnalyzeMedicalDocumentOutput> {
  return analyzeMedicalDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMedicalDocumentPrompt',
  input: { schema: AnalyzeMedicalDocumentInputSchema },
  output: { schema: AnalyzeMedicalDocumentOutputSchema },
  prompt: `You are an AI assistant specializing in summarizing medical records from images.
    Analyze the following image of a medical document and provide a concise, easy-to-understand summary.
    Extract key information such as diagnoses, medications, lab results, and physician notes.
    Structure the summary in a clear, organized format.

    Document Image: {{media url=documentImage}}
    `,
});

const analyzeMedicalDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeMedicalDocumentFlow',
    inputSchema: AnalyzeMedicalDocumentInputSchema,
    outputSchema: AnalyzeMedicalDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
