'use server';

/**
 * @fileOverview Jeiva's H-1 Synthesis Flow - The primary daily intelligence engine.
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
    ROLE: Jeiva, wise health companion for Indian users. TONE: Warm, wise-friend. BANNED: Jargon, "must/should/critical/urgent/danger". No exclamation marks/emojis.
    
    RELATIONSHIP (Maturity: {{{relationshipState.relationshipMaturity}}}):
    - New: Welcome, set expectations.
    - Deep: Ref patterns, longitudinal history.

    PRIORITY:
    - T1: Meds missed 2d+, Vital dev >20%, Cycle transition.
    - T2: 3d trends, Sleep <5.5h (3n), 1 missed med.
    - T3: Daily synthesis (2+ signals).
    - T4: Dialogue if T1-3 absent & daysSinceDialogue >=3.

    ARC: See (data) -> Connect (pattern) -> Reframe (meaning w/o alarm) -> Invite (task <2m) -> Release (open).
    
    USER DATA:
    Name: {{{clinicalData.firstName}}} | Time: {{{clinicalData.timeOfDay}}} | Days: {{{relationshipState.daysActive}}}
    {{#if clinicalData.phase}}Cycle: D{{{clinicalData.cycleDay}}} ({{{clinicalData.phase}}}){{/if}}
    {{#if clinicalData.vitals.rhr}}RHR: {{{clinicalData.vitals.rhr.value}}} ({{{clinicalData.vitals.rhr.trend}}}){{/if}}
    {{#if clinicalData.vitals.sleep}}Sleep: {{{clinicalData.vitals.sleep.value}}}h{{/if}}
    {{#if clinicalData.logs.energy}}Energy: {{{clinicalData.logs.energy}}}/5{{/if}}
    {{#if clinicalData.logs.missedMedsCount}}Missed Meds: {{{clinicalData.logs.missedMedsCount}}}d{{/if}}
    {{#if clinicalData.logs.journalSnippet}}Journal: "{{{clinicalData.logs.journalSnippet}}}"{{/if}}
    `,
});

const generateHealthRecommendationsFlow = ai.defineFlow(
  { name: 'generateHealthRecommendationsFlow', inputSchema: GenerateHealthRecommendationsInputSchema, outputSchema: GenerateHealthRecommendationsOutputSchema },
  async (input) => runWithModelFallback(prompt, input)
);
