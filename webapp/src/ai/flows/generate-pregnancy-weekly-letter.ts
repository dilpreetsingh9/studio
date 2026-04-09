'use server';

/**
 * @fileOverview Jeiva's Pregnancy Weekly Letter Flow (P-5)
 * Generates a warm, four-paragraph Sunday reflection for expectant mothers.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePregnancyWeeklyLetterInputSchema = z.object({
  firstName: z.string(),
  currentWeek: z.number().describe('Week completing.'),
  trimester: z.number().describe('Current trimester (1, 2, or 3).'),
  weeksRemaining: z.number(),
  avgSleep: z.number().describe('7-day average sleep hours.'),
  sleepTrend: z.enum(['improving', 'declining', 'stable']),
  avgRHR: z.number().describe('7-day average resting heart rate.'),
  weightChange: z.number().describe('Weight change this week in kg.'),
  checkinCount: z.number().describe('Check-ins completed (0-7).'),
  topSymptom: z.string().optional().describe('Most frequent symptom noted.'),
  movementFeltCount: z.number().optional().describe('Movement felt this week (week 18+).'),
  routineStreak: z.number().describe('Routine adherence streak in days.'),
  nextWeek: z.number(),
  upcomingMilestone: z.string().nullable().describe('Milestone for next week (e.g. anomaly scan).'),
  lastInsightTheme: z.string().optional().describe('Previous theme to avoid repetition.'),
  targetLanguage: z.string().optional().default('English'),
});

export type GeneratePregnancyWeeklyLetterInput = z.infer<typeof GeneratePregnancyWeeklyLetterInputSchema>;

const GeneratePregnancyWeeklyLetterOutputSchema = z.object({
  letterContent: z.string().describe('The full 4-paragraph continuous prose letter.'),
});

export type GeneratePregnancyWeeklyLetterOutput = z.infer<typeof GeneratePregnancyWeeklyLetterOutputSchema>;

export async function generatePregnancyWeeklyLetter(
  input: GeneratePregnancyWeeklyLetterInput
): Promise<GeneratePregnancyWeeklyLetterOutput> {
  return generatePregnancyWeeklyLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePregnancyWeeklyLetterPrompt',
  input: { schema: GeneratePregnancyWeeklyLetterInputSchema },
  output: { schema: GeneratePregnancyWeeklyLetterOutputSchema },
  prompt: `
    You are Jeiva — a warm, culturally fluent health companion for Indian women.
    MASTER SYSTEM ALWAYS APPLIES (no diagnosis, no alarm, Indian context).

    TASK:
    Write the Sunday pregnancy weekly letter for {{{firstName}}}.
    Four short paragraphs. No headers. Continuous prose.

    USER CONTEXT:
    Week completing: {{{currentWeek}}} (Trimester {{{trimester}}})
    Weeks remaining: {{{weeksRemaining}}}

    WEEK IN REVIEW:
    - Average sleep: {{{avgSleep}}} hours (Trend: {{{sleepTrend}}})
    - Average RHR: {{{avgRHR}}} bpm
    - Weight change: {{{weightChange}}} kg
    - Check-ins: {{{checkinCount}}}/7
    - Top signal: {{{topSymptom}}}
    {{#if movementFeltCount}}- Movement felt: {{{movementFeltCount}}} times{{/if}}
    - Routine: {{{routineStreak}}} days

    UPCOMING NEXT WEEK:
    Next week: {{{nextWeek}}}
    Milestone: {{{upcomingMilestone}}}

    LETTER STRUCTURE:
    Paragraph 1 — This week's pattern: What Jeiva noticed about the week from the review data. One specific observation. Not a summary.
    Paragraph 2 — What the body is doing: One thing happening in the pregnancy this week (baby or body). Warm, Indian context where possible.
    Paragraph 3 — What is coming: Look ahead to next week. Name the milestone warmly if present, or one thing to look forward to.
    Paragraph 4 — One small focus: A single achievable focus (Indian food, movement, rest, conversation). < 2 mins.

    RULES:
    - Exactly 4 paragraphs. Prose only.
    - Paragraph length: 2–3 sentences each.
    - TONE: Warm witness. Never coach. Never alarm. Never hollow praise.
    - DO NOT use headers or bullet points.
    - DO NOT begin with "Dear {{{firstName}}}". Start directly.
    - DO NOT end with a sign-off.
    - Language: {{{targetLanguage}}}.
    `,
});

const generatePregnancyWeeklyLetterFlow = ai.defineFlow(
  {
    name: 'generatePregnancyWeeklyLetterFlow',
    inputSchema: GeneratePregnancyWeeklyLetterInputSchema,
    outputSchema: GeneratePregnancyWeeklyLetterOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
