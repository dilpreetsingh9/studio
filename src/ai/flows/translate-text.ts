'use server';

/**
 * @fileOverview This file defines a Genkit flow for translating medical text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Spanish", "Hindi").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a medical translator. Translate the following medical text into ${input.targetLanguage}. 
      Ensure the tone remains professional yet accessible to a patient. 
      Maintain all medical accuracy.
      
      Text: ${input.text}`,
      output: { schema: TranslateTextOutputSchema }
    });
    return output!;
  }
);
