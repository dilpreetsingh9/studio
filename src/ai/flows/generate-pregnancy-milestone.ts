'use server';

/**
 * @fileOverview Jeiva's Pregnancy Milestone Flow (P-2)
 * Generates a warm, culturally fluent milestone note at the start of a new pregnancy week.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePregnancyMilestoneInputSchema = z.object({
  firstName: z.string(),
  currentWeek: z.number().describe('The new week of pregnancy (1-40)'),
  trimester: z.number().describe('Current trimester (1, 2, or 3)'),
  targetLanguage: z.string().optional().default('English'),
});

export type GeneratePregnancyMilestoneInput = z.infer<typeof GeneratePregnancyMilestoneInputSchema>;

const GeneratePregnancyMilestoneOutputSchema = z.object({
  milestoneNote: z.string().describe('A 4-sentence warm milestone note.'),
});

export type GeneratePregnancyMilestoneOutput = z.infer<typeof GeneratePregnancyMilestoneOutputSchema>;

export async function generatePregnancyMilestone(
  input: GeneratePregnancyMilestoneInput
): Promise<GeneratePregnancyMilestoneOutput> {
  return generatePregnancyMilestoneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePregnancyMilestonePrompt',
  input: { schema: GeneratePregnancyMilestoneInputSchema },
  output: { schema: GeneratePregnancyMilestoneOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    MASTER SYSTEM ALWAYS APPLIES (no diagnosis, no alarm, Indian context).

    USER CONTEXT:
    Name: {{{firstName}}}
    New week: {{{currentWeek}}}
    Trimester: {{{trimester}}}

    BABY SIZE REFERENCE (use Indian-familiar objects only):
    Week 6: moong dal seed · Week 8: amla · Week 10: lichi · Week 12: lemon
    Week 14: small orange · Week 16: avocado · Week 18: sweet potato
    Week 20: small mango · Week 24: corn · Week 28: brinjal
    Week 32: nariyal (coconut) · Week 36: large papaya · Week 40: watermelon

    WHAT IS HAPPENING THIS WEEK:
    FIRST TRIMESTER (weeks 1–12):
    Wk 4–6: Implantation. Heart begins forming. Fatigue and tender breasts are expected.
    Wk 7–9: Morning sickness peaks. Adrak, nimbu, small meals help more than medicine.
    Wk 10–12: Organs mostly formed. First trimester ending. 

    SECOND TRIMESTER (weeks 13–26):
    Wk 13–16: Energy returns. Appetite increases. Iron and folate are the priority nutrients.
    Wk 17–20: Baby movement begins. Anomaly scan window. Weight gain accelerates.
    Wk 21–26: Glucose tolerance test window (24–28 wk). Sleep position matters now.

    THIRD TRIMESTER (weeks 27–40):
    Wk 27–32: Baby gains weight rapidly. Back discomfort common. Left-side sleep helps.
    Wk 33–36: Lungs maturing. Braxton Hicks contractions normal. Nest instinct kicks in.
    Wk 37–40: Full term. Baby could arrive any day. Hospital bag. Birth plan. Breathe.

    INDIAN NUTRITION FOCUS BY WEEK:
    Iron (wk 13–20): rajma, spinach, beetroot, til — with nimbu for absorption.
    Folate (wk 1–12 and ongoing): dal, methi, palak, moong.
    Calcium (wk 20+): dahi, milk, ragi, sesame.
    Protein (all trimesters): dal-chawal, paneer, eggs, chana.

    TASK:
    Write a warm week milestone note. Exactly four sentences, no headers.

    1. Acknowledge the new week warmly. One sentence.
    2. Baby size in Indian-familiar terms based on the reference list. One sentence.
    3. One thing happening in her body this week based on the trimester context. Not alarming.
    4. One Indian food or habit that supports this week specifically from the nutrition focus.

    CONSTRAINTS:
    - Maximum 4 sentences. 
    - Warm witness tone. Not a textbook.
    - No bullet points. No headers. No preamble.
    - Provide the output in {{{targetLanguage}}}.
    `,
});

const generatePregnancyMilestoneFlow = ai.defineFlow(
  {
    name: 'generatePregnancyMilestoneFlow',
    inputSchema: GeneratePregnancyMilestoneInputSchema,
    outputSchema: GeneratePregnancyMilestoneOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
