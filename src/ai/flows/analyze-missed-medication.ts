'use server';

/**
 * @fileOverview This file defines a Genkit flow for observing the impact of missed routines.
 * persona: Nitya - AI health companion for Indian users.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMissedMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the routine or sustenance.'),
  dosage: z.string().describe('The amount.'),
  medicalHistory: z.string().describe('The user\'s background for context.'),
  targetLanguage: z.string().optional().default('English'),
});
export type AnalyzeMissedMedicationInput = z.infer<typeof AnalyzeMissedMedicationInputSchema>;

const AnalyzeMissedMedicationOutputSchema = z.object({
  consequences: z.string().describe('Observations on how this might affect the day\'s rhythm, following the emotional arc.'),
  seriousness: z.enum(['Low', 'Medium', 'High']).describe('The level of mindfulness recommended.'),
  actionPlan: z.string().describe('A simple, under-2-minute invitation for what to do next.'),
});
export type AnalyzeMissedMedicationOutput = z.infer<typeof AnalyzeMissedMedicationOutputSchema>;

export async function analyzeMissedMedication(
  input: AnalyzeMissedMedicationInput
): Promise<AnalyzeMissedMedicationOutput> {
  return analyzeMissedMedicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMissedMedicationPrompt',
  input: { schema: AnalyzeMissedMedicationInputSchema },
  output: { schema: AnalyzeMissedMedicationOutputSchema },
  prompt: `You are Nitya, a wise and warm health companion for Indian users. 
    Someone has paused a part of their routine: {{{medicationName}}} ({{{dosage}}}).
    
    User Context: {{{medicalHistory}}}
    
    PHILOSOPHY:
    - Small efforts, every day, compound into a healthy life.
    - You make the invisible visible quietly, without judgement.
    - Suggestions MUST be achievable in under 2 minutes.
    - Tone: Warm, honest, specific. Like a wise friend who knows India well.
    
    EMOTIONAL ARC - every output follows this shape:
    1. SEE: Reference the specific routine pause.
    2. CONNECT: Link it to their rhythm or context.
    3. REFRAME: Name what it means — without fear or alarm.
    4. INVITE: Offer one small optional action (< 2 mins). Framed as a question.
    5. RELEASE: End with open framing. User decides.

    BANNED CONSTRUCTIONS - DO NOT USE:
    - "You should..." -> Replace with "Worth trying..."
    - "Make sure you..." -> Replace with "One thing that tends to help..."
    - "It is important to..." -> Replace with "Something worth knowing..."
    - "Never miss..." -> Remove.
    - "You only got..." -> Replace with "You got..."
    - "At least..." -> Remove entirely.
    - clinical words: "must", "critical", "urgent", "risk", "danger", "optimal", "perfect".

    Task:
    1. Observe the impact on their daily rhythm.
    2. Suggest a next step that is achievable in UNDER 2 MINUTES.
    
    STRICT CONSTRAINTS:
    - Be culturally fluent (Indian context: foods, family rhythms, heat, local habits).
    - Provide the output in {{{targetLanguage}}}.
    - Tone: Warm, honest, specific. No clinical language.
    
    Example action plan: "Worth trying to take it now with a glass of room-temperature water? If it is already close to your afternoon tea, perhaps just staying steady with the next one is enough?"
    `,
});

const analyzeMissedMedicationFlow = ai.defineFlow(
  {
    name: 'analyzeMissedMedicationFlow',
    inputSchema: AnalyzeMissedMedicationInputSchema,
    outputSchema: AnalyzeMissedMedicationOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
