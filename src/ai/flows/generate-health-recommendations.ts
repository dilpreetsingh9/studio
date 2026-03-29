'use server';

/**
 * @fileOverview Nitya's Intelligence Flow - Generates health observations based on relationship maturity
 * and a strict Signal Priority Hierarchy and Emotional Arc.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHealthRecommendationsInputSchema = z.object({
  clinicalData: z.object({
    vitals: z.string().describe('Current vitals and recent trends.'),
    medicationAdherence: z.string().describe('History of missed/taken sustenance over the last 7 days.'),
    cycleInfo: z.string().describe('Current phase and proximity to transition.'),
    medicalHistory: z.string().optional(),
  }),
  relationshipState: z.object({
    daysActive: z.number(),
    dataRichnessScore: z.number().describe('0.0 (new) to 1.0 (longitudinal data)'),
    recentInsightThemes: z.array(z.string()),
    relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']),
    lastDialogueQuestion: z.string().optional(),
    targetLanguage: z.string().optional().default('English'),
  }),
});

export type GenerateHealthRecommendationsInput = z.infer<
  typeof GenerateHealthRecommendationsInputSchema
>;

const GenerateHealthRecommendationsOutputSchema = z.object({
  observation: z.string().describe('A single warm connection or invitation following the emotional arc.'),
  dialogueQuestion: z.string().optional().describe('A gentle question to learn more if data is sparse.'),
  theme: z.string().describe('The primary theme of this insight to avoid repetition.'),
  tierReached: z.string().describe('The hierarchy tier that triggered this insight.'),
});

export type GenerateHealthRecommendationsOutput = z.infer<
  typeof GenerateHealthRecommendationsOutputSchema
>;

export async function generateHealthRecommendations(
  input: GenerateHealthRecommendationsInput
): Promise<GenerateHealthRecommendationsOutput> {
  return generateHealthRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthRecommendationsPrompt',
  input: { schema: GenerateHealthRecommendationsInputSchema },
  output: { schema: GenerateHealthRecommendationsOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - Small efforts, every day, compound into a healthy life.
    - You make the invisible visible quietly, without judgement.
    - Suggestions MUST be achievable in under 2 minutes.
    - Tone: Warm, honest, specific. Like a wise friend who knows India well.
    - You know Indian rhythms (4pm chai, Sunday lethargy, heavy wedding food).
    
    EMOTIONAL ARC - every output follows this shape:
    1. SEE: Reference something specific this user generated. Never generic.
    2. CONNECT: Link it to one other signal, pattern, or context.
    3. REFRAME: Name what it means — without fear, without alarm.
    4. INVITE: Offer one small optional action. Under 2 minutes. Framed as a question.
    5. RELEASE: End with a question mark or open framing. User decides. Always.

    BANNED CONSTRUCTIONS - DO NOT USE:
    - "You should..." -> Replace with "Worth trying..."
    - "Make sure you..." -> Replace with "One thing that tends to help..."
    - "It is important to..." -> Replace with "Something worth knowing..."
    - "Never miss..." -> Remove. Reframe around the positive streak.
    - "You only got..." -> Replace with "You got..." No minimising language.
    - "At least..." -> Remove entirely.
    - clinical words: "must", "critical", "urgent", "risk", "danger", "optimal", "perfect".

    SIGNAL PRIORITY HIERARCHY:
    Address ONLY the highest-priority signal present. Do not stack signals.
    
    TIER 1 (Highest): 
    - Sustenance missed 2+ consecutive days.
    - Vital deviation > 20% from baseline.
    - Cycle phase transition today.
    
    TIER 2:
    - 3-day trend in any vital.
    - Sleep < 5.5 hours for 3 nights.
    - Sustenance missed 1 day (gentle mention).
    
    TIER 3:
    - Daily synthesis connecting 2 signals (e.g., HRV + cycle phase).
    - Longitudinal patterns if richness > 0.6.
    
    TIER 4 (Lowest):
    - No major signals or Anti-Repetition rule triggered.
    - Ask ONE genuine, open question instead of an observation.

    INSIGHT MODE RULES:
    1. If richness < 0.2: OBSERVE AND ASK. Do not synthesize. Reflect what you see.
    2. If richness 0.2-0.6: PATTERN EMERGING. Connect 2-3 points. Use "seems like" not "is".
    3. If richness > 0.6: FULL INTELLIGENCE. Reference longitudinal changes.

    STRICT CONSTRAINTS:
    - NEVER diagnose or prescribe.
    - suggestions MUST be under 2 minutes.
    - Output language: {{{relationshipState.targetLanguage}}}.
    
    AVOID RECENT THEMES: {{#each relationshipState.recentInsightThemes}}- {{{this}}}{{/each}}

    Input Data:
    Clinical: {{{clinicalData.vitals}}}, {{{clinicalData.medicationAdherence}}}, {{{clinicalData.cycleInfo}}}
    Context: {{{clinicalData.medicalHistory}}}
    Relationship: maturity {{{relationshipState.relationshipMaturity}}}, richness {{{relationshipState.dataRichnessScore}}}
    `,
});

const generateHealthRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateHealthRecommendationsFlow',
    inputSchema: GenerateHealthRecommendationsInputSchema,
    outputSchema: GenerateHealthRecommendationsOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
