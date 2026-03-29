'use server';

/**
 * @fileOverview Nitya's Cycle Intelligence Flow - Generates warm, biometric-grounded observations
 * about the user's hormonal phase and biometric signals.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCycleInsightsInputSchema = z.object({
  cycleDay: z.number(),
  cycleLength: z.number(),
  phase: z.string(),
  isTransitionDay: z.boolean().optional().default(false),
  daysUntilPeriod: z.number(),
  biometrics: z.object({
    rhr: z.object({ value: z.number(), trend: z.string() }).optional(),
    bbt: z.object({ value: z.number(), trend: z.string() }).optional(),
    sleepHrs: z.number().optional(),
  }),
  logs: z.object({
    energy: z.number().optional(),
    mood: z.number().optional(),
    painLevel: z.number().optional(),
    symptoms: z.array(z.string()).optional(),
  }),
  cycleRegularity: z.enum(['regular', 'irregular', 'unknown']).optional().default('regular'),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateCycleInsightsInput = z.infer<typeof GenerateCycleInsightsInputSchema>;

const GenerateCycleInsightsOutputSchema = z.object({
  insight: z.string().describe('A warm, biometric-grounded observation (exactly 2 sentences).'),
});

export type GenerateCycleInsightsOutput = z.infer<typeof GenerateCycleInsightsOutputSchema>;

export async function generateCycleInsights(
  input: GenerateCycleInsightsInput
): Promise<GenerateCycleInsightsOutput> {
  return generateCycleInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCycleInsightsPrompt',
  input: { schema: GenerateCycleInsightsInputSchema },
  output: { schema: GenerateCycleInsightsOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - The cycle is not a liability. It is the body's most sophisticated health signal.
    - NEVER use "symptoms" for normal phase experiences. Use "signals" or "what your body is doing."
    - Suggestions MUST be achievable in under 2 minutes.
    - Tone: Warm, phase-specific, biometric-grounded. No clinical language.
    
    LOGIC:
    1. If isTransitionDay is true: Lead with the transition. Name the new phase (e.g., "Your follicular phase starts today").
    2. If painLevel is high (>= 4):
       - Skip ALL optimisation or productivity advice.
       - WITNESS FIRST: "That sounds like a hard day. Your body is doing a lot right now."
       - Provide ONLY one small comfort-oriented suggestion.
    3. If cycleRegularity is "irregular": Observe today's patterns only. NEVER predict period dates or use future-looking language.
    4. Connect at least one biometric (RHR: {{{biometrics.rhr.value}}} or BBT: {{{biometrics.bbt.value}}}) to the current phase ({{{phase}}}).
    
    STRICT CONSTRAINTS:
    - Exactly 2 sentences only.
    - Warm. Personal. Specific.
    - No clinical terminology.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Day: {{{cycleDay}}} of {{{cycleLength}}} ({{{phase}}})
    Transition Today: {{{isTransitionDay}}}
    RHR: {{{biometrics.rhr.value}}} ({{{biometrics.rhr.trend}}})
    BBT: {{{biometrics.bbt.value}}} ({{{biometrics.bbt.trend}}})
    Energy: {{{logs.energy}}}/5, Mood: {{{logs.mood}}}/5, Pain: {{{logs.painLevel}}}/5
    Signals: {{#each logs.symptoms}}- {{{this}}}{{/each}}
    Regularity: {{{cycleRegularity}}}
    `,
});

const generateCycleInsightsFlow = ai.defineFlow(
  {
    name: 'generateCycleInsightsFlow',
    inputSchema: GenerateCycleInsightsInputSchema,
    outputSchema: GenerateCycleInsightsOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
