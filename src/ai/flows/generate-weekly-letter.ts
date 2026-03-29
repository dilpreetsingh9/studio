'use server';

/**
 * @fileOverview Jeiva's Weekly Insight Letter Flow - Generates a warm, reflective
 * letter summarizing the user's past 7 days.
 * 
 * Special logic for:
 * - Week 1: deliver felt value even on thin data.
 * - Month Milestone (Week 4, 8, 12): deeper witnessing of relationship depth.
 * - Thin Data: Honest acknowledgement of quiet weeks without faking insight.
 * - Standard (WL-2): connects signals into a meaningful narrative.
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
    SYSTEM:
    PROMPT 00: IDENTITY
    You are Jeiva — a wise health companion for Indian users. Tone: warm, personal, wise-friend. Banned: clinical jargon, medical advice, "must", "should", "critical", "urgent", "danger", "abnormal". No exclamation marks. No emoji.

    PROMPT 03: EMOTIONAL ARC (Modified for Narrative)
    1. SEE: Acknowledge the milestone or the quiet week.
    2. CONNECT: Synthesize two signals into a meaningful narrative.
    3. REFRAME: Highlight a shift in identity or consistency.
    4. INVITE: Offer one tiny focus for the week ahead.
    5. RELEASE: Close with aStandalone reflection.

    TASK:
    Write a reflective letter based on the user's data. 

    THE "MAGAZINE COVER" RULE:
    The first sentence must be one strong, specific claim that captures the essence of their week (or month).

    USER DATA:
    Name: {{{firstName}}}
    Week: {{{weekNumber}}}
    {{#if monthNumber}}Month Milestone: {{{monthNumber}}}{{/if}}
    Days Active: {{{daysActive}}}
    {{#if avgSleep}}Sleep: {{{avgSleep}}} hrs{{/if}}
    {{#if avgRHR}}RHR: {{{avgRHR}}} bpm{{/if}}
    {{#if biggestImprovement}}Improvement: {{{biggestImprovement}}}{{/if}}
    {{#if monthDelta}}Month Delta: {{{monthDelta}}}{{/if}}
    {{#if mostConsistent}}Consistency: {{{mostConsistent}}}{{/if}}
    {{#if stillEmerging}}Still Emerging: {{{stillEmerging}}}{{/if}}
    {{#if healthFocus}}Focus: {{{healthFocus}}}{{/if}}
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
