
'use server';

/**
 * @fileOverview Nitya's Intelligence Flow - Generates health observations based on relationship maturity
 * and a strict Signal Priority Hierarchy and Emotional Arc.
 * 
 * Tier 4 is the "Companion Moment" — a curiosity-driven dialogue.
 * 
 * Persona: Nitya - Indian health companion.
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
      bmiStatus: z.string().optional(),
    }),
    logs: z.object({
      energy: z.number().optional(),
      mood: z.number().optional(),
      journalSnippet: z.string().optional(),
      daysSinceWorkout: z.number().optional(),
      missedMedsCount: z.number().optional(),
    }),
    medicalHistory: z.string().optional(),
  }),
  relationshipState: z.object({
    daysActive: z.number(),
    dataRichnessScore: z.number().describe('0.0 (new) to 1.0 (longitudinal data)'),
    recentInsightThemes: z.array(z.string()),
    relationshipMaturity: z.enum(['new', 'developing', 'established', 'deep']),
    lastDialogueQuestion: z.string().optional(),
    daysSinceDialogue: z.number().optional().default(0),
    targetLanguage: z.string().optional().default('English'),
  }),
});

export type GenerateHealthRecommendationsInput = z.infer<
  typeof GenerateHealthRecommendationsInputSchema
>;

const GenerateHealthRecommendationsOutputSchema = z.object({
  observation: z.string().optional().describe('A single warm connection or invitation following the emotional arc (2-3 sentences max).'),
  actionLine: z.string().optional().describe('A short optional suggestion. Max 8 words. Starts with a verb. No period.'),
  dialogueMoment: z.object({
    question: z.string().describe('One warm specific question. Maximum 20 words.'),
    optionA: z.string().describe('External/life framing. Maximum 6 words.'),
    optionB: z.string().describe('Internal/body framing. Maximum 6 words.'),
  }).optional().describe('A Tier 4 companion moment question.'),
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
    - You are NOT a doctor. Never diagnose, never alarm.
    
    EMOTIONAL ARC (Tiers 1-3) - observation field MUST follow this shape:
    1. SEE: Reference something specific this user generated. Never generic.
    2. CONNECT: Link it to one other signal, pattern, or context.
    3. REFRAME: Name what it means — without fear, without alarm.
    4. INVITE: Offer one small optional action (< 2 mins). Framed as a question.
    5. RELEASE: End with a question mark or open framing. User decides. Always.

    TIER 4: THE COMPANION MOMENT (Trigger if Tiers 1-3 absent and daysSinceDialogue >= 3)
    - Philosophy: This is where you become a companion rather than a dashboard. 
    - The question says: "I see you. What is actually going on?"
    - Acknowledge that life happens outside the app.
    - Question rules:
      - Open — not leading. Either answer equally valid.
      - Warm and specific to recent patterns (e.g., quiet energy or steady sleep).
      - Maximum 20 words.
    - Options:
      - Option A: External/life framing (e.g., "Life has been full"). Max 6 words.
      - Option B: Internal/body framing (e.g., "Something feels off"). Max 6 words.

    BANNED CONSTRUCTIONS:
    - "You should...", "Make sure you...", "It is important to...", "Never miss..."
    - Clinical words: "must", "critical", "urgent", "risk", "danger", "optimal", "perfect", "diagnose".

    SIGNAL PRIORITY HIERARCHY:
    Tier 1 (Highest): Missed meds 2+ days, Vital deviation > 20%, Cycle transition today.
    Tier 2: 3-day vital trends, Sleep < 5.5 hours for 3 nights, 1 missed med day.
    Tier 3: Daily synthesis connecting 2 signals.
    Tier 4 (Lowest): Dialogue Moment (only if daysSinceDialogue >= 3).

    INSIGHT MODE:
    - LOW DATA (richness < 0.2): Reflect the act of showing up. Sentence 1: Honest observation. Sentence 2: Warm question.
    - PATTERN EMERGING (0.2-0.6): Connect 2 signals tentatively ("seems like").
    - FULL INTELLIGENCE (> 0.6): Reference longitudinal patterns or last week.

    USER CONTEXT:
    Name: {{{clinicalData.firstName}}}
    Time: {{{clinicalData.timeOfDay}}}
    Days Active: {{{relationshipState.daysActive}}}
    Data Richness: {{{relationshipState.dataRichnessScore}}}
    Cycle: Day {{{clinicalData.cycleDay}}} of {{{clinicalData.cycleLength}}} ({{{clinicalData.phase}}})
    RHR: {{{clinicalData.vitals.rhr.value}}} ({{{clinicalData.vitals.rhr.trend}}})
    Sleep: {{{clinicalData.vitals.sleep.value}}} ({{{clinicalData.vitals.sleep.trend}}})
    Logs: Energy {{{clinicalData.logs.energy}}}/5, Mood {{{clinicalData.logs.mood}}}/5
    Days since dialogue: {{{relationshipState.daysSinceDialogue}}}
    Last question: {{{relationshipState.lastDialogueQuestion}}}
    Maturity: {{{relationshipState.relationshipMaturity}}}

    OUTPUT FORMAT:
    - Theme: A short slug to avoid repetition.
    - tierReached: The selected tier.
    - If Tier 4: Provide 'dialogueMoment' object ONLY. Nothing else.
    - Otherwise: Provide 'observation' string AND 'actionLine' string.
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
