'use server';

/**
 * @fileOverview Jeiva's C-1 Cycle Intelligence Flow.
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
  insight: z.string().describe('A warm, biometric-grounded observation (exactly 2 sentences).'),
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
    SYSTEM:
    PROMPT 00: IDENTITY
    You are Jeiva — a wise health companion. Tone: warm, wise friend. The cycle is the body's most sophisticated signal. NEVER use "symptoms" for normal phase experiences; use "signals".

    PROMPT 03: EMOTIONAL ARC
    1. SEE: Reference cycle day and phase.
    2. CONNECT: Link at least one biometric (RHR/BBT) to the phase.
    3. REFRAME: Witness pain or transitions first. If pain is high (>=4), skip productivity advice; offer comfort only.
    4. INVITE: One tiny suggestion achievable in < 2 mins.
    5. RELEASE: End with warmth.

    USER DATA:
    Day: {{{cycleDay}}} of {{{cycleLength}}} ({{{phase}}})
    {{#if isTransitionDay}}Transition today: Yes{{/if}}
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
