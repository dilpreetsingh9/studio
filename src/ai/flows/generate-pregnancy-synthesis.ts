'use server';

/**
 * @fileOverview Jeiva's Pregnancy Synthesis Flow (P-1)
 * Generates a warm, culturally fluent daily synthesis for expectant mothers.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePregnancySynthesisInputSchema = z.object({
  firstName: z.string(),
  currentWeek: z.number().describe('Week of pregnancy (1-40)'),
  trimester: z.number().describe('Trimester (1, 2, or 3)'),
  dueDate: z.string().optional(),
  weeksRemaining: z.number(),
  vitals: z.object({
    rhr: z.number().describe('Resting heart rate'),
    sleepHours: z.number(),
    weightKg: z.number(),
    hrv: z.number().optional(),
  }),
  checkin: z.object({
    nausea: z.number().optional().describe('1-5 scale'),
    energy: z.number().optional().describe('1-5 scale'),
    mood: z.string().optional(),
    movementFelt: z.boolean().optional(),
  }),
  daysActive: z.number(),
  lastInsightTheme: z.string().optional(),
  targetLanguage: z.string().optional().default('English'),
});

export type GeneratePregnancySynthesisInput = z.infer<typeof GeneratePregnancySynthesisInputSchema>;

const GeneratePregnancySynthesisOutputSchema = z.object({
  synthesis: z.string().describe('2-3 sentence warm observation.'),
});

export type GeneratePregnancySynthesisOutput = z.infer<typeof GeneratePregnancySynthesisOutputSchema>;

export async function generatePregnancySynthesis(
  input: GeneratePregnancySynthesisInput
): Promise<GeneratePregnancySynthesisOutput> {
  return generatePregnancySynthesisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePregnancySynthesisPrompt',
  input: { schema: GeneratePregnancySynthesisInputSchema },
  output: { schema: GeneratePregnancySynthesisOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.

    MASTER SYSTEM:
    - Never diagnostic. Never alarming. Never use: must/should/critical/urgent/risk/danger.
    - Every suggestion achievable in under 2 minutes.
    - One observation. One connection. One invitation.
    - Indian food, Indian rhythms, Indian bodies. Always.
    - BANNED: amazing, great job, you've got this, optimal, perfect.

    USER: {{{firstName}}} | Week {{{currentWeek}}} (Trimester {{{trimester}}})
    VITALS: RHR {{{vitals.rhr}}} bpm, Sleep {{{vitals.sleepHours}}} hrs, Weight {{{vitals.weightKg}}} kg{{#if vitals.hrv}}, HRV {{{vitals.hrv}}}ms{{/if}}
    CHECK-IN: {{#if checkin.nausea}}Nausea {{{checkin.nausea}}}/5, {{/if}}{{#if checkin.energy}}Energy {{{checkin.energy}}}/5, {{/if}}{{#if checkin.movementFelt}}Movement felt: Yes{{/if}}
    
    WEEK CONTEXT:
    - Wk 1–12: Organs forming. Fatigue/nausea are normal signals.
    - Wk 13–26: Energy returns. Baby growing rapidly.
    - Wk 27–40: Discomfort increases. Sleep quality drops. Nearly there.

    INDIAN GUIDANCE:
    - Nausea: nimbu paani, adrak chai, small frequent meals.
    - Low energy: dal-chawal is complete nutrition. 
    - Poor sleep: left-side sleeping for circulation.
    - Movement: 20-min walk after dinner is sufficient.

    TASK:
    Write the daily synthesis for {{{firstName}}} at week {{{currentWeek}}}.
    
    RULES:
    1. Reference the week naturally (e.g. "Week 14 tends to...").
    2. Connect one vital signal to something meaningful for this week.
    3. One micro-suggestion in Indian context. Achievable today.
    4. Warm witness tone. No coaching.
    5. Max 3 sentences. 
    6. If movementFelt is true and week >= 18: acknowledge it warmly.

    Output: 2–3 sentences only. No preamble.
    `,
});

const generatePregnancySynthesisFlow = ai.defineFlow(
  {
    name: 'generatePregnancySynthesisFlow',
    inputSchema: GeneratePregnancySynthesisInputSchema,
    outputSchema: GeneratePregnancySynthesisOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
