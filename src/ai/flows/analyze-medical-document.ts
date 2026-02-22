'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a medical document image.
 *
 * It uses a two-step "Extract then Interpret" reasoning pattern:
 * 1. Structural Extraction: Identifying raw medical data and values from the image.
 * 2. Contextual Interpretation: Translating those values into patient-friendly language.
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
  prompt: `You are an AI medical assistant specializing in document analysis. 
    Analyze the provided medical document image using the following two-step process:

    ### Step 1: Structural Extraction (Internal OCR)
    Identify and extract all critical medical data points found in the document. This includes:
    - Patient identifiers (if visible).
    - Specific lab values, measurements, or diagnoses.
    - Dates of service or testing.
    - Reference ranges and abnormal indicators (like "High", "Low", or asterisks).

    ### Step 2: Contextual Interpretation & Simplification
    Based on the data extracted in Step 1, build a patient-friendly response:
    1. **Summary**: What is this document? (e.g., "This is a blood test result showing your cholesterol levels.")
    2. **Key Findings**: Translate the technical data into plain English. 
       - Instead of "Hyperlipidemia", say "Your cholesterol is slightly higher than the target range."
       - Explain what the numbers mean relative to normal ranges.
    3. **Next Steps**: Provide clear, simplified instructions.
       - e.g., "Continue taking your prescribed medication," or "Discuss these results with your doctor at your next visit."

    **Safety Guidelines**:
    - Use SIMPLIFIED, everyday language.
    - Be empathetic and clear.
    - Include a note that this is an AI analysis and should be verified by a medical professional.

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
