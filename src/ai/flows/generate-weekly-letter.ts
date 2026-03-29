'use server';

/**
 * @fileOverview Nitya's Weekly Insight Letter Flow - Generates a warm, reflective
 * letter summarizing the user's past 7 days.
 * 
 * Special logic for:
 * - Week 1: deliver felt value even on thin data.
 * - Month Milestone (Week 4, 8, 12): deeper witnessing of relationship depth.
 * - Thin Data: Honest acknowledgement of quiet weeks without faking insight.
 * - Standard (WL-2): connects signals into a meaningful narrative.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWeeklyLetterInputSchema = z.object({
  firstName: z.string(),
  weekNumber: z.number().describe('The current week number of the user journey.'),
  monthNumber: z.number().optional().describe('The month number (1, 2, 3) if this is a milestone week (4, 8, 12).'),
  daysActive: z.number().optional().default(7).describe('Number of days data was logged this week.'),
  healthFocus: z.string().optional().describe('The user’s primary health focus area.'),
  avgSleep: z.number(),
  priorAvgSleep: z.number().optional(),
  avgRHR: z.number(),
  priorAvgRHR: z.number().optional(),
  avgHRV: z.number(),
  priorAvgHRV: z.number().optional(),
  activityDays: z.number(),
  medsOnTimePct: z.number(),
  phaseThisWeek: z.string().optional(),
  journalEntryCount: z.number(),
  dominantMood: z.string(),
  dominantEnergy: z.string(),
  notableEvents: z.array(z.string()).optional(),
  biggestImprovement: z.string().describe('The highlight or week1_highlight.'),
  biggestWatch: z.string().describe('The observation or week1_observation.'),
  monthDelta: z.string().optional().describe('The most significant change over the last month.'),
  mostConsistent: z.string().optional().describe('The most consistent behavior observed this month.'),
  stillEmerging: z.string().optional().describe('One thing that is still emerging in the data.'),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateWeeklyLetterInput = z.infer<typeof GenerateWeeklyLetterInputSchema>;

const GenerateWeeklyLetterOutputSchema = z.object({
  letterContent: z.string().describe('The full warm letter content.'),
  closingLine: z.string().describe('A standalone, deeply considered closing line.'),
});

export type GenerateWeeklyLetterOutput = z.infer<typeof GenerateWeeklyLetterOutputSchema>;

export async function generateWeeklyLetter(
  input: GenerateWeeklyLetterInput
): Promise<GenerateWeeklyLetterOutput> {
  return generateWeeklyLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeeklyLetterPrompt',
  input: { schema: GenerateWeeklyLetterInputSchema },
  output: { schema: GenerateWeeklyLetterOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    TASK:
    Write a reflective letter based on the user's data. 
    
    THE "MAGAZINE COVER" RULE:
    The first sentence of the letter must be one strong, specific claim that captures the essence of their week (or month). The rest of the letter delivers on that claim.

    THIN DATA LOGIC (if daysActive < 3 and weekNumber > 1):
    - PHILOSOPHY: Do not fake insight. Honesty builds trust. Quiet weeks happen and they count.
    - Paragraph 1: Acknowledge the quiet week warmly. Example: "Nitya didn't hear much from you this week. That is okay."
    - Paragraph 2: Surface anything Nitya DID notice, however small (biometrics, one log). One tiny re-entry invitation for next week.
    - Length: 80–120 words. 2 paragraphs maximum.

    WEEK 1 SPECIAL LOGIC (if weekNumber is 1):
    - PHILOSOPHY: Witnessing, not condescending. Prove Nitya noticed something real.
    - Paragraph 1: Milestone & Highlight. Lead with {{{biggestImprovement}}}.
    - Paragraph 2: Specific Observation. Name one thing Nitya noticed even on thin data ({{{biggestWatch}}}).
    - Paragraph 3: Future. One tiny focus for week 2.
    - Length: 100–150 words.

    MONTH MILESTONE LOGIC (if monthNumber is 1, 2, or 3):
    - PHILOSOPHY: Warm gravity. Thirty days (or sixty/ninety) means something real.
    - Opening: Quiet acknowledgement of the milestone. Not a trophy, but a fact of relationship depth.
    - Paragraph 1: The Monthly Arc. Lead with {{{monthDelta}}}.
    - Paragraph 2: Consistency. Reflect on {{{mostConsistent}}} as an identity shift.
    - Paragraph 3: Signal Synthesis. Connect TWO weekly signals (e.g. HRV and Sleep).
    - Closing Line: Reference the months ahead as possibility, not pressure.
    - Length: 180–240 words.

    STANDARD LOGIC (WL-2):
    - PHILOSOPHY: A wise friend who sees patterns you might have missed.
    - Paragraph 1: What went well. Lead with {{{biggestImprovement}}}.
    - Paragraph 2: Signal Synthesis. Connect TWO signals (e.g. HRV and Sleep). Frame as "interesting to notice."
    - Paragraph 3: One Focus. Exactly one tiny focus for next week.
    - Closing Line: A deeply considered sentence that makes Monday feel supported.
    - Length: 150–220 words.

    STRICT CONSTRAINTS:
    - No headers. No bullets. No bold text.
    - Warm. Plain. Data-specific.
    - BANNED: "should", "must", "important", "critical", "optimal", "getting started", "trophy", "congratulations".
    - Use Indian-fluent rhythms (chai, Sunday mornings, local references).
    - Provide output in {{{targetLanguage}}}.

    USER DATA:
    Name: {{{firstName}}}
    Week: {{{weekNumber}}}
    Month: {{{monthNumber}}}
    Days Active: {{{daysActive}}}
    Sleep: {{{avgSleep}}} hrs
    RHR: {{{avgRHR}}} bpm
    Improvement: {{{biggestImprovement}}}
    Month Delta: {{{monthDelta}}}
    Consistency: {{{mostConsistent}}}
    Still Emerging: {{{stillEmerging}}}
    Focus: {{{healthFocus}}}
    `,
});

const generateWeeklyLetterFlow = ai.defineFlow(
  {
    name: 'generateWeeklyLetterFlow',
    inputSchema: GenerateWeeklyLetterInputSchema,
    outputSchema: GenerateWeeklyLetterOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
