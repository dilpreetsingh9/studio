'use server';

/**
 * @fileOverview Jeiva's Logging Confirmation Flow - Generates a single-sentence,
 * warm confirmation after a user logs data.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const ConfirmLogInputSchema = z.object({
  logType: z.string().describe('The category of what was logged (e.g. Mood, Energy, Food, Vitals).'),
  logValue: z.any().optional().describe('The value logged if applicable.'),
  logStreak: z.number().optional().default(0).describe('Consecutive days of logging.'),
  isFirstLog: z.boolean().optional().default(false).describe('True if this is the user’s first ever log.'),
  detectedItem: z.string().optional().nullable().describe('Specific item detected, like an Indian food name.'),
  targetLanguage: z.string().optional().default('English'),
});
export type ConfirmLogInput = z.infer<typeof ConfirmLogInputSchema>;

const ConfirmLogOutputSchema = z.object({
  confirmation: z.string().describe('A single warm confirmation sentence, max 12 words.'),
});
export type ConfirmLogOutput = z.infer<typeof ConfirmLogOutputSchema>;

export async function confirmLogEntry(input: ConfirmLogInput): Promise<ConfirmLogOutput> {
  return confirmLogEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'confirmLogEntryPrompt',
  input: { schema: ConfirmLogInputSchema },
  output: { schema: ConfirmLogOutputSchema },
  prompt: `
    You are Jeiva — a warm health companion.
    Confirm that a log was received in exactly 1 sentence (max 12 words).
    
    LOGIC:
    1. If isFirstLog is true: "First one is always the most important. Noted."
    2. If logType is "food" and detectedItem is present (especially Indian food like Dal, Roti, Chawal): 
       "{{{detectedItem}}} noted. Jeiva will remember that."
    3. If logStreak is 7: Acknowledge the week milestone naturally (e.g. "Seven days of showing up. It adds up.").
    4. If logStreak is 30: Acknowledge the month milestone warmly.
    5. Standard log: Simple, warm confirmation. Never hollow.
    
    CONSTRAINTS:
    - Exactly 1 sentence only.
    - Maximum 12 words.
    - Warm. Immediate. Specific to the log type where possible.
    - No exclamation marks.
    - Provide the output in {{{targetLanguage}}}.
    
    USER CONTEXT:
    Type: {{{logType}}}
    Value: {{{logValue}}}
    Streak: {{{logStreak}}}
    First Log: {{{isFirstLog}}}
    Detected: {{{detectedItem}}}
  `,
});

const confirmLogEntryFlow = ai.defineFlow(
  {
    name: 'confirmLogEntryFlow',
    inputSchema: ConfirmLogInputSchema,
    outputSchema: ConfirmLogOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
