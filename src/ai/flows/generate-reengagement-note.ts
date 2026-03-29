
'use server';

/**
 * @fileOverview Nitya's Re-engagement Flow - Welcomes the user back after an absence
 * with zero guilt and a warm, Indian-fluent perspective.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReengagementNoteInputSchema = z.object({
  firstName: z.string(),
  daysAway: z.number().describe('Number of days since last open.'),
  lastTheme: z.string().optional().describe('The primary theme of the last insight before absence.'),
  relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']).default('new'),
  reEngagementCount: z.number().optional().default(0),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateReengagementNoteInput = z.infer<typeof GenerateReengagementNoteInputSchema>;

const GenerateReengagementNoteOutputSchema = z.object({
  note: z.string().describe('A 1-2 sentence warm, guilt-free welcome back note with a tiny invitation.'),
});

export type GenerateReengagementNoteOutput = z.infer<typeof GenerateReengagementNoteOutputSchema>;

export async function generateReengagementNote(
  input: GenerateReengagementNoteInput
): Promise<GenerateReengagementNoteOutput> {
  return generateReengagementNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReengagementNotePrompt',
  input: { schema: GenerateReengagementNoteInputSchema },
  output: { schema: GenerateReengagementNoteOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - Absence is data too. Life is lived outside the app.
    - Zero guilt. Zero pressure. Coming back feels like coming home.
    - You know Indian rhythms (weddings, long Sundays, family commitments).
    
    LOGIC:
    1. If daysAway is 3–5: Light acknowledgement. Life happened. No drama.
    2. If daysAway is 6–10: Warm welcome back. Reference that the body kept going without the app.
    3. If daysAway is 11–14: Honest acknowledgement. Offer the lowest possible re-entry point.
    4. If reEngagementCount >= 3: Acknowledge the pattern gently ("You always come back...").
    
    CONSTRAINTS:
    - Exactly 2 sentences maximum.
    - Warm. Zero guilt.
    - End with one tiny optional re-entry invitation (e.g., "Worth checking your heart rate for a moment?").
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Name: {{{firstName}}}
    Days away: {{{daysAway}}}
    Last theme: {{{lastTheme}}}
    Maturity: {{{relationshipMaturity}}}
    Return count: {{{reEngagementCount}}}
    `,
});

const generateReengagementNoteFlow = ai.defineFlow(
  {
    name: 'generateReengagementNoteFlow',
    inputSchema: GenerateReengagementNoteInputSchema,
    outputSchema: GenerateReengagementNoteOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
