'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a medical document image.
 *
 * - analyzeMedicalDocument - A function that analyzes a medical document image and returns a simplified summary.
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
    .describe('A concise summary of the provided medical document in simplified language.'),
  keyFindings: z.array(z.string()).describe('A list of the most important points from the document.'),
  nextSteps: z.array(z.string()).describe('Recommended next steps for the patient based on the document.'),
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
  prompt: `You are an AI medical assistant designed to help patients understand their medical records.
    Analyze the following image of a medical document (OCR).
    
    Your goal is to:
    1. Parse the text and identify key medical information.
    2. Translate complex medical jargon into SIMPLIFIED, everyday language that a non-medical person can easily understand.
    3. Provide a clear summary of what the document is about.
    4. Highlight key findings (e.g., normal vs abnormal lab results, specific diagnoses).
    5. List clear, simplified next steps if mentioned (e.g., "Schedule a follow-up", "Continue current medication").

    Be empathetic and clear. Avoid overly technical terms without explaining them simply.

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
