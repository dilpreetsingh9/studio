'use server';

/**
 * @fileOverview Nitya's Phase-Based Guidance Flow - Generates culturally fluent invitations
 * across four domains: Nutrition, Movement, Work, and Social.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePhaseGuidanceInputSchema = z.object({
  phase: z.string(),
  energyScore: z.number().optional().default(3),
  moodScore: z.number().optional().default(3),
  occupationType: z.enum(['desk', 'physical', 'mixed', 'unknown']).optional().default('unknown'),
  fastingToday: z.boolean().optional().default(false),
  culturalContext: z.string().optional().default('none'),
  energyHistory: z.array(z.number()).optional().default([]),
  targetLanguage: z.string().optional().default('English'),
});

export type GeneratePhaseGuidanceInput = z.infer<typeof GeneratePhaseGuidanceInputSchema>;

const GuidanceDomainSchema = z.object({
  domain: z.string(),
  invitation: z.string().describe('A 1-2 sentence specific, actionable invitation under 2 minutes.'),
});

const GeneratePhaseGuidanceOutputSchema = z.object({
  introMessage: z.string().optional().describe('A small contextual intro if energy has been low.'),
  guidance: z.array(GuidanceDomainSchema).describe('Guidance for Nutrition, Movement, Work, and Social.'),
});

export type GeneratePhaseGuidanceOutput = z.infer<typeof GeneratePhaseGuidanceOutputSchema>;

export async function generatePhaseGuidance(
  input: GeneratePhaseGuidanceInput
): Promise<GeneratePhaseGuidanceOutput> {
  return generatePhaseGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePhaseGuidancePrompt',
  input: { schema: GeneratePhaseGuidanceInputSchema },
  output: { schema: GeneratePhaseGuidanceOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - Phase guidance is not a prescription. It is a lens.
    - Every suggestion must be actionable in under 2 minutes.
    - Tone: Warm, phase-appropriate, culturally fluent. 
    - Use invitations: "Worth trying..." or "This phase tends to..." instead of "You should..."
    
    CULTURAL FLUENCY:
    - Nutrition MUST reference Indian food (Rajma, Idli, Jeera water, Chikki, Buttermilk, etc.).
    - Never suggest protein shakes, quinoa, or Western-only supplements.
    - Respect fasting (Navratri, Ramadan, etc.). If fastingToday is true, nutrition must support the fast.
    
    LOGIC:
    1. If energyHistory shows 3+ consecutive days of score 1-2:
       - Set introMessage to "Energy has been quieter this week — today's guidance reflects that."
       - Soften all domains to prioritize rest.
    2. If energyScore is 4-5:
       - Elevate Movement and Work. This is a day to use energy.
    3. If energyScore is 1-2:
       - Soften all domains. Lead with permission to rest.
    
    DOMAINS:
    - Nutrition: Indian-fluent sustenance.
    - Movement: Tiny, achievable physical shifts.
    - Work: Focus or pacing based on the phase lens.
    - Social: How to engage with others today.

    USER CONTEXT:
    Phase: {{{phase}}}
    Energy: {{{energyScore}}}/5, Mood: {{{moodScore}}}/5
    Occupation: {{{occupationType}}}
    Fasting: {{{fastingToday}}}
    Cultural context: {{{culturalContext}}}
    Energy History: {{#each energyHistory}}{{{this}}}, {{/each}}

    OUTPUT: 4 domains (Nutrition, Movement, Work, Social). Warm, specific, human.
    `,
});

const generatePhaseGuidanceFlow = ai.defineFlow(
  {
    name: 'generatePhaseGuidanceFlow',
    inputSchema: GeneratePhaseGuidanceInputSchema,
    outputSchema: GeneratePhaseGuidanceOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
