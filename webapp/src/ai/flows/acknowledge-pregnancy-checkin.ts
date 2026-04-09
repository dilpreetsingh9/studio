'use server';

/**
 * @fileOverview Jeiva's Pregnancy Check-In Acknowledgement Flow (P-4)
 * Generates a single-sentence, warm acknowledgement of pregnancy-specific signals.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AcknowledgePregnancyCheckinInputSchema = z.object({
  currentWeek: z.number().describe('Current week of pregnancy.'),
  nausea: z.number().optional().describe('1-5 scale.'),
  energy: z.number().optional().describe('1-5 scale.'),
  mood: z.string().optional(),
  movementFelt: z.boolean().optional(),
  heartburn: z.boolean().optional(),
  swelling: z.enum(['none', 'mild', 'moderate']).optional(),
  targetLanguage: z.string().optional().default('English'),
});
export type AcknowledgePregnancyCheckinInput = z.infer<typeof AcknowledgePregnancyCheckinInputSchema>;

const AcknowledgePregnancyCheckinOutputSchema = z.object({
  acknowledgement: z.string().describe('Exactly 1 warm sentence. Max 14 words.'),
});
export type AcknowledgePregnancyCheckinOutput = z.infer<typeof AcknowledgePregnancyCheckinOutputSchema>;

export async function acknowledgePregnancyCheckin(
  input: AcknowledgePregnancyCheckinInput
): Promise<AcknowledgePregnancyCheckinOutput> {
  return acknowledgePregnancyCheckinFlow(input);
}

const prompt = ai.definePrompt({
  name: 'acknowledgePregnancyCheckinPrompt',
  input: { schema: AcknowledgePregnancyCheckinInputSchema },
  output: { schema: AcknowledgePregnancyCheckinOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    MASTER SYSTEM ALWAYS APPLIES (no diagnosis, no alarm, Indian context).

    USER CONTEXT:
    Week: {{{currentWeek}}}

    CHECK-IN DATA:
    {{#if nausea}}Nausea: {{{nausea}}}/5{{/if}}
    {{#if energy}}Energy: {{{energy}}}/5{{/if}}
    {{#if mood}}Mood: {{{mood}}}{{/if}}
    {{#if movementFelt}}Movement felt today: Yes{{/if}}
    {{#if heartburn}}Heartburn: Yes{{/if}}
    {{#if swelling}}Swelling: {{{swelling}}}{{/if}}

    TASK:
    Write ONE sentence acknowledging what Jeiva noticed from this check-in.

    RULES:
    1. Maximum 14 words.
    2. Do not list or repeat the symptoms back. Notice what they mean together.
    3. If movementFelt is true: this takes priority — acknowledge it warmly first.
    4. If nausea is high (4–5): acknowledge without alarm.
    5. If energy is high: acknowledge the good day without hollow praise.
    6. Warm witness tone. One breath.

    Output: One sentence only. In {{{targetLanguage}}}.
    `,
});

const acknowledgePregnancyCheckinFlow = ai.defineFlow(
  {
    name: 'acknowledgePregnancyCheckinFlow',
    inputSchema: AcknowledgePregnancyCheckinInputSchema,
    outputSchema: AcknowledgePregnancyCheckinOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
