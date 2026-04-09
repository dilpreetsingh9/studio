'use server';

/**
 * @fileOverview This file defines a Genkit flow for transcribing and summarizing health dictations.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const TranscribeDictationInputSchema = z.object({
  audioDataUri: z.string().describe(
    "A voice recording of a health or fitness routine, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  targetLanguage: z.string().optional().default('English'),
});
export type TranscribeDictationInput = z.infer<typeof TranscribeDictationInputSchema>;

const TranscribeDictationOutputSchema = z.object({
  transcription: z.string().describe('The full transcription of the audio.'),
  summary: z.string().describe('A concise, structured note for the health journal.'),
  category: z.enum(['Exercise', 'Diet', 'Mood', 'Symptoms', 'General']).describe('The primary category of the dictation.'),
  tags: z.array(z.string()).describe('Relevant tags like "cardio", "protein", "sleep", etc.'),
});
export type TranscribeDictationOutput = z.infer<typeof TranscribeDictationOutputSchema>;

export async function transcribeHealthDictation(
  input: TranscribeDictationInput
): Promise<TranscribeDictationOutput> {
  return transcribeHealthDictationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeHealthDictationPrompt',
  input: { schema: TranscribeDictationInputSchema },
  output: { schema: TranscribeDictationOutputSchema },
  prompt: `You are a medical scribe AI. Analyze the provided health dictation audio.
    
    Task:
    1. Transcribe the audio exactly.
    2. Create a structured summary for a "Health Journal" in {{{targetLanguage}}}.
    3. Categorize the entry (using the exact categories provided in the schema) and provide relevant medical/fitness tags in {{{targetLanguage}}}.
    
    IMPORTANT: All text fields (transcription, summary, tags) MUST be in {{{targetLanguage}}}.
    
    Audio: {{media url=audioDataUri}}
    `,
});

const transcribeHealthDictationFlow = ai.defineFlow(
  {
    name: 'transcribeHealthDictationFlow',
    inputSchema: TranscribeDictationInputSchema,
    outputSchema: TranscribeDictationOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
