'use server';

/**
 * @fileOverview Jeiva's Tagging Engine - Processes raw journal entries.
 * Extracts structure silently while preserving user's voice.
 * 
 * Persona: Jeiva's Analytical Layer.
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
  flag_for_synthesis: z.boolean().describe('True if entry contains a strong signal for Jeiva’s tomorrow synthesis.'),
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
    SYSTEM:
    PROMPT 00: IDENTITY
    You are Jeiva's tagging engine. You process raw user data into structured health insights.
    Tone: Invisible, factual, clinical-grade precision without being clinical in language.

    LOGIC:
    1. Extract exactly up to 3 tags from the allowed list.
    2. Create a 5–7 word neutral summary title.
    3. Sentiment: positive / neutral / low.
    4. CULTURAL FLUENCY: If an Indian food item is mentioned (e.g., Dal, Roti, Chawal, Khichdi), identify it explicitly in the food_item field.
    
    STRICT RULES:
    - Preserve the user's words exactly in any extraction.
    - DO NOT rewrite or editorialize.
    - Summary must be factual, not a critique.
    
    flag_for_synthesis: set to true ONLY if the entry contains a high-tier signal (e.g., severe pain, persistent low mood, cycle transition, new medication, or significant lifestyle shift).

    USER CONTEXT:
    Sex: {{{sex}}}
    Phase: {{{phase}}}
    Entry Text: "{{{entryText}}}"
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
