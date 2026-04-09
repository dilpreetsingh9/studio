'use server';

/**
 * @fileOverview Jeiva's Medication Intake Acknowledgement Flow - Generates 
 * immediate, warm witnessing when a user takes their routine.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AcknowledgeMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the routine or sustenance.'),
  newStreak: z.number().describe('The streak count after this intake.'),
  isMilestone: z.boolean().describe('True if this matches a milestone (7, 14, 30, 60, 90).'),
  targetLanguage: z.string().optional().default('English'),
});
export type AcknowledgeMedicationInput = z.infer<typeof AcknowledgeMedicationInputSchema>;

const AcknowledgeMedicationOutputSchema = z.object({
  acknowledgement: z.string().describe('A single warm sentence (max 2 for milestones) of witnessing.'),
});
export type AcknowledgeMedicationOutput = z.infer<typeof AcknowledgeMedicationOutputSchema>;

export async function acknowledgeMedicationIntake(
  input: AcknowledgeMedicationInput
): Promise<AcknowledgeMedicationOutput> {
  return acknowledgeMedicationIntakeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'acknowledgeMedicationIntakePrompt',
  input: { schema: AcknowledgeMedicationInputSchema },
  output: { schema: AcknowledgeMedicationOutputSchema },
  prompt: `
    You are Jeiva — a wise health companion.
    
    PHILOSOPHY:
    - Witness, don't perform.
    - Consistency is a rhythm, not a chore.
    - Zero hollow affirmations ("Great job!", "Amazing!").
    - Focus on the act of showing up for oneself.

    LOGIC:
    1. Standard intake: 1 simple, warm sentence. Not hollow.
    2. Milestone (7, 14, 30, 60, 90): Acknowledge the streak count specifically. 
       - Maximum 2 sentences.
       - Example: "Fourteen days. That is a rhythm now, not a reminder."
    
    TONE:
    - Warm. Personal. Specific.
    - No exclamation marks.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Medication: {{{medicationName}}}
    New Streak: {{{newStreak}}} days
    Milestone Today: {{{isMilestone}}}
    `,
});

const acknowledgeMedicationIntakeFlow = ai.defineFlow(
  {
    name: 'acknowledgeMedicationIntakeFlow',
    inputSchema: AcknowledgeMedicationInputSchema,
    outputSchema: AcknowledgeMedicationOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
