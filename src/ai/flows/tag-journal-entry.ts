'use server';

/**
 * @fileOverview Jeiva's Tagging Engine - Processes raw journal entries.
 * Extracts structure silently while preserving user's voice.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const TagJournalEntryInputSchema = z.object({
  entryText: z.string().describe('The raw text of the journal entry provided by the user.'),
  sex: z.string().optional().default('Female'),
  phase: z.string().optional().describe('Current cycle phase if applicable.'),
});
export type TagJournalEntryInput = z.infer<typeof TagJournalEntryInputSchema>;

const TagJournalEntryOutputSchema = z.object({
  tags: z.array(z.string()).describe('Up to 3 tags from: mood, energy, pain, sleep, food, activity, stress, cycle, medication, digestion, skin, social.'),
  summary_title: z.string().describe('A 5–7 word neutral summary title.'),
  sentiment: z.enum(['positive', 'neutral', 'low']).describe('Overall sentiment detected.'),
  food_item: z.string().nullable().describe('One Indian food item if mentioned.'),
  flag_for_synthesis: z.boolean().describe('True if entry contains a high-tier signal for Jeiva’s tomorrow synthesis.'),
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
    SYSTEM: Jeiva's tagging engine. Factual, precise, non-clinical language.
    LOGIC:
    1. Extract up to 3 tags. 
    2. Summary title (5-7 words). 
    3. Sentiment (positive/neutral/low). 
    4. CULTURAL: Identify Indian foods (Dal, Roti, etc).
    RULES: Preserve user words. No editing. Summary is factual.
    FLAG: Set true ONLY if signal is high-tier (severe pain, cycle transition, new med, major shift).

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
