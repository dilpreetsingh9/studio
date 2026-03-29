'use server';

/**
 * @fileOverview Nitya's Weekly Insight Letter Flow - Generates a warm, reflective
 * letter summarizing the user's past 7 days.
 * 
 * Special logic for Week 1: deliver felt value even on thin data to drive retention.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWeeklyLetterInputSchema = z.object({
  firstName: z.string(),
  weekNumber: z.number().describe('The current week number of the user journey.'),
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
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateWeeklyLetterInput = z.infer<typeof GenerateWeeklyLetterInputSchema>;

const GenerateWeeklyLetterOutputSchema = z.object({
  letterContent: z.string().describe('The full 3-paragraph warm letter.'),
  closingLine: z.string().describe('A single, warm, conversational closing line.'),
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
    Write a 3-paragraph reflective letter based on the user's data.
    
    WEEK 1 SPECIAL LOGIC (if weekNumber is 1):
    - PHILOSOPHY: This is the most important retention moment. Prove Nitya noticed something real.
    - TONE: "Week one is done." Witnessing, not condescending. 
    - Paragraph 1: Milestone & Highlight. Lead with {{{biggestImprovement}}} even if small. 
    - Paragraph 2: Specific Observation. Name one thing Nitya noticed even on thin data ({{{biggestWatch}}}).
    - Paragraph 3: Future. One tiny focus for week 2. The smallest possible version (under 2 mins).
    - Length: 100–150 words total. Honest over padding.
    - Context: {{{firstName}}}'s focus is {{{healthFocus}}}. They were active for {{{daysActive}}} days.

    STANDARD LOGIC (if weekNumber > 1):
    - Paragraph 1: What went well. Lead with {{{biggestImprovement}}}.
    - Paragraph 2: One pattern worth noticing. Connect 2 signals (e.g. HRV and Sleep). 
    - Paragraph 3: One small focus for next week.
    - Length: 150–220 words.

    STRICT CONSTRAINTS:
    - Exactly 3 natural paragraphs. 
    - No headers. No bullets.
    - Warm. Honest. Specific. Like a wise friend.
    - BANNED: "should", "must", "important", "critical", "optimal", "you're getting started".
    - Use Indian-fluent rhythms (chai, family, local references).
    - Provide the output in {{{targetLanguage}}}.

    USER DATA:
    Name: {{{firstName}}}
    Week: {{{weekNumber}}}
    Sleep: {{{avgSleep}}} hrs (Prior: {{{priorAvgSleep}}})
    RHR: {{{avgRHR}}} bpm (Prior: {{{priorAvgRHR}}})
    Activity: {{{activityDays}}}/7
    Journal: {{{journalEntryCount}}} entries
    Mood: {{{dominantMood}}}
    Events: {{#each notableEvents}}{{{this}}}, {{/each}}
    Improvement: {{{biggestImprovement}}}
    Watch: {{{biggestWatch}}}
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
