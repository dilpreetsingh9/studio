'use server';

/**
 * @fileOverview Nitya's Recovery Intelligence Flow - Generates warm, HRV-grounded observations
 * about energy and recovery for users without a cycle.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRecoveryInsightsInputSchema = z.object({
  hrv: z.object({ value: z.number(), trend: z.string() }),
  rhr: z.object({ value: z.number(), trend: z.string() }),
  sleepAvg: z.number(),
  daysSinceWorkout: z.number().optional(),
  activityDays: z.number().optional(),
  energyScore: z.number().optional(),
  stressScore: z.number().optional(),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateRecoveryInsightsInput = z.infer<typeof GenerateRecoveryInsightsInputSchema>;

const GenerateRecoveryInsightsOutputSchema = z.object({
  insight: z.string().describe('A warm, HRV-grounded observation (exactly 2 sentences).'),
});

export type GenerateRecoveryInsightsOutput = z.infer<typeof GenerateRecoveryInsightsOutputSchema>;

export async function generateRecoveryInsights(
  input: GenerateRecoveryInsightsInput
): Promise<GenerateRecoveryInsightsOutput> {
  return generateRecoveryInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecoveryInsightsPrompt',
  input: { schema: GenerateRecoveryInsightsInputSchema },
  output: { schema: GenerateRecoveryInsightsOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - Preventive health for men is often underserved. 
    - Make HRV (Heart Rate Variability) intelligible without making it clinical or athletic.
    - NEVER use "gym-bro" language, "optimisation", "performance", or "output" framing.
    - The goal is felt energy for daily life — not maximum athletic effort.
    - Suggestions MUST be achievable in under 2 minutes.
    - Tone: Warm, direct, supportive.
    
    LOGIC:
    1. HRV is the primary signal. 
    2. If HRV trend is "up": The body is in recovery mode and seems ready for engagement. Frame it as "energy is available."
    3. If HRV trend is "down" for 3+ days: This is "accumulated load." Suggest softening effort, not pushing through.
    4. If HRV and sleep ({{{sleepAvg}}} hrs) are both low: This is a "compound fatigue" signal. Name it directly but without alarm.
    5. Connect HRV to one practical daily decision (e.g., "a quieter evening," "a brisk walk," "finishing work early").
    
    STRICT CONSTRAINTS:
    - Exactly 2 sentences only.
    - Warm. Personal. Direct.
    - No clinical terminology or athletic performance jargon.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    HRV: {{{hrv.value}}} ms ({{{hrv.trend}}})
    RHR: {{{rhr.value}}} bpm ({{{rhr.trend}}})
    Sleep (3-day avg): {{{sleepAvg}}} hrs
    Days since workout: {{{daysSinceWorkout}}}
    Activity this week: {{{activityDays}}}/7
    Energy: {{{energyScore}}}/5, Stress: {{{stressScore}}}/5
    `,
});

const generateRecoveryInsightsFlow = ai.defineFlow(
  {
    name: 'generateRecoveryInsightsFlow',
    inputSchema: GenerateRecoveryInsightsInputSchema,
    outputSchema: GenerateRecoveryInsightsOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
