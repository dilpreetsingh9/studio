'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a medical document image.
 * It is capable of processing documents in multiple source languages and translating them to a target language.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMedicalDocumentInputSchema = z.object({
  documentImage: z.string().describe(
    "A photo of a medical document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  targetLanguage: z.string().optional().default('English').describe('The language for the output analysis.'),
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
  prompt: `You are an AI medical assistant specializing in document analysis and translation. 
    Analyze the provided medical document image. Note that the source document may be in ANY language. 
    
    Your task is to:
    1. **Structural Extraction**: Detect and extract all critical medical data points found in the document, regardless of the source language.
    2. **Contextual Interpretation & Simplification**: Build a patient-friendly response translated entirely into {{{targetLanguage}}}.
    
    Response requirements:
    - **Summary**: What is this document? Summarize it in {{{targetLanguage}}}.
    - **Key Findings**: Translate technical data and findings from the source language into plain language in {{{targetLanguage}}}.
    - **Next Steps**: Provide clear, simplified instructions in {{{targetLanguage}}}.

    Safety Guidelines:
    - Use SIMPLIFIED, everyday language.
    - Be empathetic and clear.
    - Provide the output ONLY in {{{targetLanguage}}}.
    - Maintain accuracy even when translating complex medical terms.

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
