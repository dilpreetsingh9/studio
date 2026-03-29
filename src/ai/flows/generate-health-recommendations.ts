
'use server';

/**
 * @fileOverview Nitya's Intelligence Flow - Generates health observations based on relationship maturity
 * and a strict Signal Priority Hierarchy and Emotional Arc.
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
    - You know Indian rhythms (4pm chai, Sunday lethargy, heavy wedding food).
    - You are NOT a doctor. Never diagnose, never alarm.
    
    EMOTIONAL ARC - observation field MUST follow this shape (except in LOW DATA MODE):
    1. SEE: Reference something specific this user generated. Never generic.
    2. CONNECT: Link it to one other signal, pattern, or context.
    3. REFRAME: Name what it means — without fear, without alarm.
    4. INVITE: Offer one small optional action (< 2 mins). Framed as a question.
    5. RELEASE: End with a question mark or open framing. User decides. Always.

    BANNED CONSTRUCTIONS - DO NOT USE:
    - "You should..." -> Replace with "Worth trying..."
    - "Make sure you..." -> Replace with "One thing that tends to help..."
    - "It is important to..." -> Replace with "Something worth knowing..."
    - "Never miss..." -> Reframe around the positive streak.
    - "You only got..." -> Replace with "You got..."
    - "At least..." -> Remove entirely.
    - Clinical words: "must", "critical", "urgent", "risk", "danger", "optimal", "perfect", "diagnose".

    SIGNAL PRIORITY HIERARCHY:
    Address ONLY the highest-priority signal present. Do not stack signals.
    
    TIER 1 (Highest): 
    - Medications missed 2+ consecutive days (missedMedsCount >= 2).
    - Vital deviation > 20% from baseline.
    - Cycle phase transition today.
    
    TIER 2:
    - 3-day trend in any vital.
    - Sleep < 5.5 hours for 3 nights.
    - Medication missed 1 day (gentle mention).
    
    TIER 3:
    - Daily synthesis connecting 2 signals (e.g., HRV + cycle phase).
    - Longitudinal patterns if richness > 0.6.
    
    TIER 4 (Lowest):
    - Dialogue Moment: Ask one genuine, open question instead of an observation.
    - ONLY trigger if daysSinceDialogue >= 3.

    INSIGHT MODE RULES:
    1. LOW DATA MODE (richness < 0.2): 
       - Deliver value through presence, not intelligence.
       - If zero data: reflect back the act of showing up itself.
       - Sentence 1: One honest observation or acknowledgement of what you see.
       - Sentence 2: One open, warm question that invites their next log.
       - NEVER fake an insight. NEVER be generic. NEVER synthesise.
       - Example: "You showed up on day two — that is actually the hardest day. What has your energy felt like this morning?"
       - Format: Exactly 2 sentences.
    2. PATTERN EMERGING (richness 0.2-0.6): 
       - Connect 2 points. Use "seems like" not "is". 
       - Stay tentative.
    3. FULL INTELLIGENCE (richness > 0.6): 
       - Reference longitudinal patterns or last week specifically.
       - If maturity is "deep": mention something from last week specifically.

    ACTION LINE:
    Provide an actionLine field: exactly one short optional suggestion. 
    Maximum 8 words. Starts with a verb. Ends without a period.
    In LOW DATA MODE, ensure the actionLine is a very low-friction invitation.

    ANTI-REPETITION: Never surface the same theme within 5 days.
    Recent themes: {{#each relationshipState.recentInsightThemes}}- {{{this}}}{{/each}}

    USER CONTEXT:
    Name: {{{clinicalData.firstName}}}
    Time: {{{clinicalData.timeOfDay}}}
    Days Active: {{{relationshipState.daysActive}}}
    Data Richness: {{{relationshipState.dataRichnessScore}}}
    Cycle: Day {{{clinicalData.cycleDay}}} of {{{clinicalData.cycleLength}}} ({{{clinicalData.phase}}} phase)
    RHR: {{{clinicalData.vitals.rhr.value}}} bpm ({{{clinicalData.vitals.rhr.trend}}})
    Sleep: {{{clinicalData.vitals.sleep.value}}} hrs ({{{clinicalData.vitals.sleep.trend}}})
    HRV: {{{clinicalData.vitals.hrv.value}}} ms ({{{clinicalData.vitals.hrv.trend}}})
    Energy: {{{clinicalData.logs.energy}}}/5, Mood: {{{clinicalData.logs.mood}}}/5
    Snippet: {{{clinicalData.logs.journalSnippet}}}
    Missed Meds: {{{clinicalData.logs.missedMedsCount}}}
    Days since dialogue: {{{relationshipState.daysSinceDialogue}}}
    Maturity: {{{relationshipState.relationshipMaturity}}}

    OUTPUT: 
    If Tier 4 is selected: provide dialogueMoment object.
    Otherwise: provide observation string (2-3 sentences) AND actionLine string.
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
