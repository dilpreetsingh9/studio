'use server';

/**
 * @fileOverview Jeiva's Tagging Engine - Processes raw journal entries.
 * Extracts structure silently while preserving user's voice.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const TagJournalEntryInputSchema = z.object({
  entryText: z.string().describe('The raw text of the journal entry.'),
  sex: z.string().optional().default('Female'),
  phase: z.string().optional().describe('Current cycle phase if applicable.'),
});
export type TagJournalEntryInput = z.infer<typeof TagJournalEntryInputSchema>;

const TagJournalEntryOutputSchema = z.object({
  tags: z.array(z.string()).describe('Up to 3 tags from: mood, energy, pain, sleep, food, activity, stress, cycle, medication, digestion, skin, social.'),
  summary_title: z.string().describe('A 5–7 word neutral summary title.'),
  sentiment: z.enum(['positive', 'neutral', 'low']).describe('Sentiment of the entry.'),
  food_item: z.string().nullable().describe('One Indian food item if mentioned.'),
  flag_for_synthesis: z.boolean().describe('True if entry contains a signal strong enough to reference in tomorrow’s synthesis card.'),
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
    You are Jeiva's tagging engine. Analyze the following raw journal entry.
    
    LOGIC:
    1. Extract up to 3 tags from: mood, energy, pain, sleep, food, activity, stress, cycle, medication, digestion, skin, social.
    2. Create a 5–7 word neutral summary title.
    3. Sentiment: positive / neutral / low.
    4. One Indian food item if mentioned — tag as "food" and note the item specifically for nutrition context.
    
    Rules:
    - Preserve the user's words exactly in any extraction that isn't a tag or summary.
    - Do not rewrite, improve, or editorialize the entry.
    - Summary must be factual, not editorial.
    - If entry is unclear or very short: tag as "general."
    
    flag_for_synthesis: true if entry contains a signal strong enough to reference in tomorrow's synthesis card (e.g., severe pain, persistent low mood, cycle start, new medication).

    USER CONTEXT:
    Sex: {{{sex}}}
    Phase: {{{phase}}}
    Entry: {{{entryText}}}
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
