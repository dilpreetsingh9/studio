'use server';

/**
 * @fileOverview Nitya's Weekly Insight Letter Flow - Generates a warm, 3-paragraph reflective
 * letter summarizing the user's past 7 days.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWeeklyLetterInputSchema = z.object({
  firstName: z.string(),
  weekNumber: z.number(),
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
  biggestImprovement: z.string(),
  biggestWatch: z.string(),
  targetLanguage: z.string().optional().default('English'),
});

export type GenerateWeeklyLetterInput = z.infer<typeof GenerateWeeklyLetterInputSchema>;

const GenerateWeeklyLetterOutputSchema = z.object({
  letterContent: z.string().describe('The full 3-paragraph warm letter (150-220 words).'),
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
    
    PHILOSOPHY:
    - The weekly letter witnesses. It does not evaluate.
    - It reflects the week back through the lens of progress, not performance.
    - The user should finish reading it feeling clearer, not pressured.
    - It must feel like Nitya noticed something — not that an algorithm ran.
    
    STRUCTURE:
    - Exactly 3 natural paragraphs. No headers. No bullets. A letter.
    - Total length: 150–220 words.
    
    LOGIC:
    - Paragraph 1: What went well. Lead with {{{biggestImprovement}}}. Be specific to their data.
    - Paragraph 2: One pattern worth noticing. Connect 2 signals (e.g., HRV and Sleep, or RHR and Cycle Phase). Frame as interesting, not concerning.
    - Paragraph 3: One small focus for next week. The smallest possible version (under 2 mins). Never more than one focus.
    
    MILESTONES:
    - If weekNumber is 1: Acknowledge the start of our journey explicitly.
    - If weekNumber is 4, 8, or 12: Acknowledge the month milestone warmly.
    
    CULTURAL FLUENCY:
    - Use Indian-fluent rhythms and references (chai, family dynamics, specific foods).
    
    TONE:
    - Warm. Honest. Specific. Like a friend who respects their intelligence.
    - BANNED: "should", "must", "important", "never miss", "critical", "optimal".
    
    USER CONTEXT:
    Name: {{{firstName}}}
    Week: {{{weekNumber}}}
    Sleep: {{{avgSleep}}} hrs (Prior: {{{priorAvgSleep}}})
    RHR: {{{avgRHR}}} bpm (Prior: {{{priorAvgRHR}}})
    HRV: {{{avgHRV}}} ms (Prior: {{{priorAvgHRV}}})
    Activity: {{{activityDays}}}/7 days
    Medication: {{{medsOnTimePct}}}%
    Phase: {{{phaseThisWeek}}}
    Mood: {{{dominantMood}}}, Energy: {{{dominantEnergy}}}
    Events: {{#each notableEvents}}{{{this}}}, {{/each}}
    Improvement: {{{biggestImprovement}}}
    Watch: {{{biggestWatch}}}

    OUTPUT: Provide the letterContent (3 paragraphs) and a unique, warm closingLine.
    Provide the output in {{{targetLanguage}}}.
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
