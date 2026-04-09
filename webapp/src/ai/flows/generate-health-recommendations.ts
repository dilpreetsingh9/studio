'use server';

/**
 * @fileOverview Jeiva's H-1 Synthesis Flow - Optimized for token efficiency.
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
  observation: z.string().optional().describe('2-3 sentence warm connection/invitation.'),
  actionLine: z.string().optional().describe('Short suggestion. Max 8 words.'),
  dialogueMoment: z.object({
    question: z.string().describe('Warm specific question. Max 20 words.'),
    optionA: z.string().describe('Max 6 words.'),
    optionB: z.string().describe('Max 6 words.'),
  }).optional(),
  theme: z.string().describe('Theme slug.'),
  tierReached: z.string().describe('Hierarchy tier.'),
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
    ROLE: Jeiva (Indian health companion). TONE: Warm/Wise. BANNED: Jargon, must/should/critical/urgent/danger. No exclamation/emoji.
    ARC: See(data) -> Connect(pattern) -> Reframe(meaning) -> Invite(task<2m) -> Release.
    PRIORITY:
    - T1: Meds missed 2d+, Vital dev >20%, Cycle transition.
    - T2: 3d trends, Sleep <5.5h(3n), 1 missed med.
    - T3: Daily synthesis (2+ signals).
    - T4: Dialogue if T1-3 absent & daysSinceDialogue >=3.
    
    USER: {{{clinicalData.firstName}}} | Time: {{{clinicalData.timeOfDay}}} | Maturity: {{{relationshipState.relationshipMaturity}}}
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
