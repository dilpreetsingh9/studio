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
  insight: z.string().describe('A warm, biometric-grounded observation (2-3 sentences max).'),
  phaseAdvice: z.string().optional().describe('A small, comfort-oriented or phase-specific invitation.'),
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
    - The cycle is not a liability. It is a sophisticated health signal.
    - Never use "symptoms" for normal phase experiences. Use "signals" or "what your body is doing."
    - Suggestions MUST be achievable in under 2 minutes.
    - Tone: Warm, phase-specific, biometric-grounded. No clinical language.
    
    LOGIC:
    1. Connect today's biometrics (RHR, BBT) to the current phase ({{{phase}}}).
    2. If BBT and RHR are both elevated in the Luteal phase, note this combination specifically.
    3. If cycle is irregular, do not make predictions. Observe patterns only.
    4. If pain is logged as high (painLevel >= 4):
       - Skip all optimization or productivity advice.
       - WITNESS FIRST: "That sounds like a hard day. Your body is doing a lot right now."
       - Provide ONLY one small comfort-oriented suggestion.
    
    EMOTIONAL ARC:
    - SEE: Reference specific data (Day {{{cycleDay}}}, RHR, BBT, or logged pain).
    - CONNECT: Link it to the phase ({{{phase}}}) or another signal.
    - REFRAME: Name what it means without fear or alarm.
    - INVITE: Offer one tiny optional action (< 2 mins).
    - RELEASE: End with a question or open framing.

    BANNED CONSTRUCTIONS:
    - "You should...", "Make sure you...", "It is important to...", "Never miss...", "Optimal", "Critical".

    USER CONTEXT:
    Day: {{{cycleDay}}} of {{{cycleLength}}} ({{{phase}}})
    RHR: {{{biometrics.rhr.value}}} ({{{biometrics.rhr.trend}}})
    BBT: {{{biometrics.bbt.value}}} ({{{biometrics.bbt.trend}}})
    Sleep: {{{biometrics.sleepHrs}}} hrs
    Energy: {{{logs.energy}}}/5, Mood: {{{logs.mood}}}/5, Pain: {{{logs.painLevel}}}/5
    Signals: {{#each logs.symptoms}}- {{{this}}}{{/each}}
    Regularity: {{{cycleRegularity}}}

    OUTPUT: 2-3 sentences maximum. Warm, specific, human.
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
