'use server';

/**
 * @fileOverview Jeiva's Postpartum Synthesis Flow (PP-1)
 * Generates a warm, culturally fluent daily synthesis for the 12-week recovery journey.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePostpartumSynthesisInputSchema = z.object({
  firstName: z.string(),
  postpartumWeek: z.number().describe('Week of postpartum (0-12).'),
  daysSinceBirth: z.number(),
  vitals: z.object({
    rhr: z.number(),
    sleepHours: z.number(),
    weightKg: z.number(),
  }),
  targetLanguage: z.string().optional().default('English'),
});

export type GeneratePostpartumSynthesisInput = z.infer<typeof GeneratePostpartumSynthesisInputSchema>;

const GeneratePostpartumSynthesisOutputSchema = z.object({
  synthesis: z.string().describe('2-3 sentence warm postpartum observation.'),
});

export type GeneratePostpartumSynthesisOutput = z.infer<typeof GeneratePostpartumSynthesisOutputSchema>;

export async function generatePostpartumSynthesis(
  input: GeneratePostpartumSynthesisInput
): Promise<GeneratePostpartumSynthesisOutput> {
  return generatePostpartumSynthesisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePostpartumSynthesisPrompt',
  input: { schema: GeneratePostpartumSynthesisInputSchema },
  output: { schema: GeneratePostpartumSynthesisOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    MASTER SYSTEM ALWAYS APPLIES (no diagnosis, no alarm, Indian context).

    USER CONTEXT:
    Name: {{{firstName}}}
    Postpartum week: {{{postpartumWeek}}}
    Days since birth: {{{daysSinceBirth}}}

    VITALS:
    RHR: {{{vitals.rhr}}} bpm
    Sleep: {{{vitals.sleepHours}}} hrs (fragmented reality)
    Weight: {{{vitals.weightKg}}} kg

    WEEK-SPECIFIC CONTEXT:
    Wk 0–1: Body in recovery. Bleeding normal. Sleep deprivation acute. Rest is the work.
    Wk 1–2: Engorgement if breastfeeding. Emotional volatility is hormonal and normal.
    Wk 2–4: Baby blues may peak then ease. Physical healing continues.
    Wk 4–6: 6-week check-up window. Energy slowly returning.
    Wk 6–12: Healing largely complete. Cycle may return if not breastfeeding.

    INDIAN POSTPARTUM CONTEXT:
    - Jaapa period (40 days): family care, rest, traditional foods (methi laddoos, gond ke laddoos, ajwain water).
    - Pressure: Many women face pressure to "bounce back" — Jeiva never adds to this.
    - Breastfeeding: Normal to struggle. No judgment.

    CRITICAL POSTPARTUM RULES:
    - NEVER comment on weight, body shape, or appearance.
    - NEVER suggest exercise before week 6; only gently after.
    - NEVER use: bounce back, pre-pregnancy body, get back to, lose the weight.
    - If sleep < 3 hrs for 3+ days: acknowledge gently and remind that asking for help is not weakness.

    TASK:
    Write the daily postpartum synthesis for {{{firstName}}} at week {{{postpartumWeek}}}.

    RULES:
    1. Acknowledge the reality of where she is (Week {{{postpartumWeek}}}).
    2. Connect one vital signal to the postpartum reality without alarm.
    3. One micro-observation or permission — rest is valid, asking for help is valid.
    4. Indian context where it fits naturally.
    5. Max 3 sentences. 
    6. TONE: Especially careful, warm, and supportive.

    Output: 2–3 sentences only. No preamble. In {{{targetLanguage}}}.
    `,
});

const generatePostpartumSynthesisFlow = ai.defineFlow(
  {
    name: 'generatePostpartumSynthesisFlow',
    inputSchema: GeneratePostpartumSynthesisInputSchema,
    outputSchema: GeneratePostpartumSynthesisOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
