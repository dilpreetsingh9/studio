'use server';

/**
 * @fileOverview Nitya's Intelligence Flow - Generates health observations based on relationship maturity.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHealthRecommendationsInputSchema = z.object({
  medicalRecords: z.string().describe('Textual summary of clinical history.'),
  patientDetails: z.string().describe('Age, gender, sensitivities, and life stage.'),
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
  observation: z.string().describe('A single warm connection or invitation.'),
  dialogueQuestion: z.string().optional().describe('A gentle question to learn more if data is sparse.'),
  theme: z.string().describe('The primary theme of this insight to avoid repetition.'),
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
    
    RELATIONSHIP STATE:
    ---
    Days active: {{{relationshipState.daysActive}}}
    Data richness: {{{relationshipState.dataRichnessScore}}}
    Relationship maturity: {{{relationshipState.relationshipMaturity}}}
    Recent themes (AVOID): {{#each relationshipState.recentInsightThemes}}- {{{this}}}{{/each}}
    ---

    INSIGHT MODE RULES:
    1. If richness < 0.2: OBSERVE AND ASK. Do not synthesize. Reflect what you see. Ask one gentle question.
    2. If richness 0.2-0.6: PATTERN EMERGING. Connect 2-3 points. Use "seems like" not "is".
    3. If richness > 0.6: FULL INTELLIGENCE. Reference longitudinal patterns. Name changes since last month.
    
    CULTURAL FLUENCY:
    You know Indian rhythms (rajma vs quinoa, 4pm chai, wedding weekend fatigue).
    
    STRICT CONSTRAINTS:
    - NEVER use: must, should, critical, urgent, risk, danger, optimal, perfect.
    - Output language: {{{relationshipState.targetLanguage}}}.
    
    Input Data:
    Clinical: {{{medicalRecords}}}
    Context: {{{patientDetails}}}
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
