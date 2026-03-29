'use server';

/**
 * @fileOverview Jeiva's C-1 Cycle Intelligence - Optimized tokens.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCycleInsightsInputSchema = z.object({
  cycleDay: z.number(),
  cycleLength: z.number(),
  phase: z.string(),
  isTransitionDay: z.boolean().optional().default(false),
  biometrics: z.object({
    rhr: z.object({ value: z.number(), trend: z.string() }).optional(),
    bbt: z.object({ value: z.number(), trend: z.string() }).optional(),
  }),
  logs: z.object({
    energy: z.number().optional(),
    painLevel: z.number().optional(),
    symptoms: z.array(z.string()).optional(),
  }),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateCycleInsightsInput = z.infer<typeof GenerateCycleInsightsInputSchema>;

const GenerateCycleInsightsOutputSchema = z.object({
  insight: z.string().describe('Exactly 2 sentences. Biometric-grounded.'),
});

export type GenerateCycleInsightsOutput = z.infer<typeof GenerateCycleInsightsOutputSchema>;

export async function generateCycleInsights(input: GenerateCycleInsightsInput): Promise<GenerateCycleInsightsOutput> {
  return generateCycleInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCycleInsightsPrompt',
  input: { schema: GenerateCycleInsightsInputSchema },
  output: { schema: GenerateCycleInsightsOutputSchema },
  prompt: `
    ROLE: Jeiva (Wise Indian Health Companion).
    RULE: Use "signals" not "symptoms".
    ARC: 1.Ref Day/Phase -> 2.Link Biometric(RHR/BBT) -> 3.Reframing/Comfort -> 4.Invitation(<2m) -> 5.Release.
    IF pain >=4: Skip productivity advice; offer comfort only.
    
    DATA: Day {{{cycleDay}}}/{{{cycleLength}}} ({{{phase}}})
    {{#if isTransitionDay}}Transition: Yes{{/if}}
    {{#if biometrics.rhr}}RHR: {{{biometrics.rhr.value}}} ({{{biometrics.rhr.trend}}}){{/if}}
    {{#if biometrics.bbt}}BBT: {{{biometrics.bbt.value}}} ({{{biometrics.bbt.trend}}}){{/if}}
    {{#if logs.painLevel}}Pain: {{{logs.painLevel}}}/5{{/if}}
    {{#if logs.energy}}Energy: {{{logs.energy}}}/5{{/if}}
    `,
});

const generateCycleInsightsFlow = ai.defineFlow(
  { name: 'generateCycleInsightsFlow', inputSchema: GenerateCycleInsightsInputSchema, outputSchema: GenerateCycleInsightsOutputSchema },
  async (input) => runWithModelFallback(prompt, input)
);
