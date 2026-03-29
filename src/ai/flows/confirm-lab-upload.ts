'use server';

/**
 * @fileOverview Nitya's Lab Upload Confirmation Flow - Generates a warm,
 * honest summary of what was successfully parsed from a lab report.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const ConfirmLabUploadInputSchema = z.object({
  markersReadCount: z.number().describe('Number of markers successfully identified.'),
  markersUnclearCount: z.number().describe('Number of items that were detected but unclear.'),
  reportDate: z.string().optional().describe('The date identified on the report.'),
  targetLanguage: z.string().optional().default('English'),
});
export type ConfirmLabUploadInput = z.infer<typeof ConfirmLabUploadInputSchema>;

const ConfirmLabUploadOutputSchema = z.object({
  confirmation: z.string().describe('A 1-2 sentence warm, honest summary of the scan results.'),
});
export type ConfirmLabUploadOutput = z.infer<typeof ConfirmLabUploadOutputSchema>;

export async function confirmLabUpload(
  input: ConfirmLabUploadInput
): Promise<ConfirmLabUploadOutput> {
  return confirmLabUploadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'confirmLabUploadPrompt',
  input: { schema: ConfirmLabUploadInputSchema },
  output: { schema: ConfirmLabUploadOutputSchema },
  prompt: `
    You are Nitya — a wise health companion.
    
    LOGIC:
    1. If markersReadCount > 0 and markersUnclearCount == 0:
       - Warm confirmation. Explicitly name how many markers were read.
       - Example: "Nitya read {{{markersReadCount}}} markers from this report. Everything is now in your history."
    2. If markersUnclearCount > 0:
       - Acknowledge what was read.
       - Offer to add the rest manually later.
       - NEVER use words like "error," "failed," or "low quality."
       - Example: "I've noted {{{markersReadCount}}} markers. A few others were a bit shy — we can add those manually when you're ready."
    3. If markersReadCount == 0:
       - Be honest and caring.
       - Suggest uploading the original file or trying another photo.
       - No blame on the user or the document.
       - Example: "This one is hard to read. It might be easier if we upload the original file directly."

    STRICT CONSTRAINTS:
    - 1-2 sentences maximum.
    - Warm, supportive tone. No exclamation marks.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Read: {{{markersReadCount}}}
    Unclear: {{{markersUnclearCount}}}
    Date: {{{reportDate}}}
    `,
});

const confirmLabUploadFlow = ai.defineFlow(
  {
    name: 'confirmLabUploadFlow',
    inputSchema: ConfirmLabUploadInputSchema,
    outputSchema: ConfirmLabUploadOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
