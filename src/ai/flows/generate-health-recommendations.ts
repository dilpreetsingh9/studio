
'use server';

/**
 * @fileOverview Nitya's H-1 Synthesis Flow - The primary daily intelligence engine.
 * Consolidates Identity (00), Relationship (01), Hierarchy (02), and Arc (03).
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHealthRecommendationsInputSchema = z.object({
  clinicalData: z.object({
    firstName: z.string(),
    timeOfDay: z.string(),
    cycleDay: z.number().optional(),
    cycleLength: z.number().optional(),
    phase: z.string().optional(),
    vitals: z.object({
      rhr: z.object({ value: z.number(), trend: z.string() }).optional(),
      sleep: z.object({ value: z.number(), trend: z.string() }).optional(),
      hrv: z.object({ value: z.number(), trend: z.string() }).optional(),
      bbt: z.object({ value: z.number(), trend: z.string() }).optional(),
    }),
    logs: z.object({
      energy: z.number().optional(),
      mood: z.number().optional(),
      journalSnippet: z.string().optional(),
      missedMedsCount: z.number().optional(),
    }),
    medicalHistory: z.string().optional(),
  }),
  relationshipState: z.object({
    daysActive: z.number(),
    relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']),
    daysSinceDialogue: z.number().optional().default(0),
    targetLanguage: z.string().optional().default('English'),
    toneMode: z.enum(['practical', 'supportive']).optional(),
  }),
});

export type GenerateHealthRecommendationsInput = z.infer<typeof GenerateHealthRecommendationsInputSchema>;

const GenerateHealthRecommendationsOutputSchema = z.object({
  observation: z.string().optional().describe('A 2-3 sentence warm connection or invitation following the emotional arc.'),
  actionLine: z.string().optional().describe('A short optional suggestion. Max 8 words. No period.'),
  dialogueMoment: z.object({
    question: z.string().describe('One warm specific question. Max 20 words.'),
    optionA: z.string().describe('External framing. Max 6 words.'),
    optionB: z.string().describe('Internal framing. Max 6 words.'),
  }).optional(),
  theme: z.string().describe('Theme slug.'),
  tierReached: z.string().describe('Hierarchy tier triggered.'),
});

export type GenerateHealthRecommendationsOutput = z.infer<typeof GenerateHealthRecommendationsOutputSchema>;

export async function generateHealthRecommendations(input: GenerateHealthRecommendationsInput): Promise<GenerateHealthRecommendationsOutput> {
  return generateHealthRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthRecommendationsPrompt',
  input: { schema: GenerateHealthRecommendationsInputSchema },
  output: { schema: GenerateHealthRecommendationsOutputSchema },
  prompt: `
    SYSTEM:
    PROMPT 00: IDENTITY
    You are Nitya — a wise health companion for Indian users. Tone: warm, personal, wise-friend. Banned: clinical jargon, medical advice, "must", "should", "critical", "urgent", "danger", "abnormal". No exclamation marks. No emoji.

    PROMPT 01: RELATIONSHIP ENGINE
    Maturity: {{{relationshipState.relationshipMaturity}}}.
    - New: Welcoming, curious, sets expectation.
    - Deep: References patterns, longitudinal history, gravity.

    PROMPT 02: SIGNAL PRIORITY HIERARCHY
    - Tier 1: Missed meds 2+ days, Vital deviation > 20%, Cycle transition.
    - Tier 2: 3-day trends, Sleep < 5.5h for 3 nights, 1 missed med.
    - Tier 3: Daily synthesis connecting 2 signals.
    - Tier 4: Companion Moment (Dialogue) if T1-3 absent AND daysSinceDialogue >= 3.

    PROMPT 03: EMOTIONAL ARC
    1. SEE: Reference specific user data.
    2. CONNECT: Link to another signal or pattern.
    3. REFRAME: Name meaning without alarm. Respect toneMode: {{{relationshipState.toneMode}}}.
    4. INVITE: Offer one tiny action (< 2 mins) as a question.
    5. RELEASE: End with open framing.

    USER DATA:
    Name: {{{clinicalData.firstName}}}
    Time: {{{clinicalData.timeOfDay}}}
    Days Active: {{{relationshipState.daysActive}}}
    {{#if clinicalData.phase}}Cycle: Day {{{clinicalData.cycleDay}}} ({{{clinicalData.phase}}}){{/if}}
    {{#if clinicalData.vitals.rhr}}RHR: {{{clinicalData.vitals.rhr.value}}} ({{{clinicalData.vitals.rhr.trend}}}){{/if}}
    {{#if clinicalData.vitals.sleep}}Sleep: {{{clinicalData.vitals.sleep.value}}}h{{/if}}
    {{#if clinicalData.logs.energy}}Energy: {{{clinicalData.logs.energy}}}/5{{/if}}
    {{#if clinicalData.logs.missedMedsCount}}Missed Meds: {{{clinicalData.logs.missedMedsCount}}} day(s){{/if}}
    {{#if clinicalData.logs.journalSnippet}}Journal: "{{{clinicalData.logs.journalSnippet}}}"{{/if}}
    `,
});

const generateHealthRecommendationsFlow = ai.defineFlow(
  { name: 'generateHealthRecommendationsFlow', inputSchema: GenerateHealthRecommendationsInputSchema, outputSchema: GenerateHealthRecommendationsOutputSchema },
  async (input) => runWithModelFallback(prompt, input)
);
