'use server';

/**
 * @fileOverview Jeiva's Tagging Engine - Optimized tokens.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const TagJournalEntryInputSchema = z.object({
  entryText: z.string().describe('User raw text.'),
  sex: z.string().optional().default('Female'),
  phase: z.string().optional().describe('Cycle phase.'),
});
export type TagJournalEntryInput = z.infer<typeof TagJournalEntryInputSchema>;

const TagJournalEntryOutputSchema = z.object({
  tags: z.array(z.string()).describe('Up to 3: mood, energy, pain, sleep, food, activity, stress, cycle, medication, digestion, skin, social.'),
  summary_title: z.string().describe('5–7 word neutral summary.'),
  sentiment: z.enum(['positive', 'neutral', 'low']),
  food_item: z.string().nullable().describe('Indian food item if present.'),
  flag_for_synthesis: z.boolean().describe('True if high-tier signal detected.'),
});
export type TagJournalEntryOutput = z.infer<typeof TagJournalEntryOutputSchema>;

export async function tagJournalEntry(
  input: TagJournalEntryInput
): Promise<TagJournalEntryOutput> {
  return tagJournalEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tagJournalEntryPrompt',
  input: { schema: TagJournalEntryInputSchema },
  output: { schema: TagJournalEntryOutputSchema },
  prompt: `
    SYSTEM: Jeiva tagging engine. ROLE: Extract structure, preserve user voice.
    RULES: 1. Extract 3 tags. 2. 5-7 word title. 3. Detect sentiment. 4. Identify Indian foods (Dal, Roti, etc).
    FLAG: True ONLY for high-tier signals (severe pain, cycle transition, new med, major shift).
    CONTEXT: Sex: {{{sex}}} | Phase: {{{phase}}}
    TEXT: "{{{entryText}}}"
    `,
});

const tagJournalEntryFlow = ai.defineFlow(
  {
    name: 'tagJournalEntryFlow',
    inputSchema: TagJournalEntryInputSchema,
    outputSchema: TagJournalEntryOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
