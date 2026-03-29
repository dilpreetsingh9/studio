'use server';

/**
 * @fileOverview Jeiva's New Medication Acknowledgement Flow - Generates 
 * a warm expectation-setting note when a user adds a new routine.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AcknowledgeNewMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the new routine.'),
  medicationType: z.string().describe('The type or priority of the medication.'),
  scheduledTime: z.string().describe('The time it is scheduled for.'),
  isHormonal: z.boolean().optional().default(false).describe('True if the medication is identified as hormonal.'),
  targetLanguage: z.string().optional().default('English'),
});
export type AcknowledgeNewMedicationInput = z.infer<typeof AcknowledgeNewMedicationInputSchema>;

const AcknowledgeNewMedicationOutputSchema = z.object({
  acknowledgement: z.string().describe('A max 2-sentence warm confirmation and expectation setter.'),
});
export type AcknowledgeNewMedicationOutput = z.infer<typeof AcknowledgeNewMedicationOutputSchema>;

export async function acknowledgeNewMedication(
  input: AcknowledgeNewMedicationInput
): Promise<AcknowledgeNewMedicationOutput> {
  return acknowledgeNewMedicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'acknowledgeNewMedicationPrompt',
  input: { schema: AcknowledgeNewMedicationInputSchema },
  output: { schema: AcknowledgeNewMedicationOutputSchema },
  prompt: `
    You are Jeiva — a wise health companion.
    
    LOGIC:
    1. Confirm the addition of {{{medicationName}}} warmly.
    2. Reference the scheduled time ({{{scheduledTime}}}) naturally in the flow of the sentences.
    3. Set the expectation that over the next two weeks, Jeiva will learn this into the user's daily rhythm.
    4. IF isHormonal is true: Acknowledge that this may interact with cycle patterns and mention that Jeiva will be tracking those connections quietly.
    
    STRICT CONSTRAINTS:
    - Maximum 2 sentences.
    - No clinical information, warnings, or side effects.
    - Warm, supportive tone. No exclamation marks.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Medication: {{{medicationName}}}
    Type: {{{medicationType}}}
    Time: {{{scheduledTime}}}
    Hormonal: {{{isHormonal}}}
    `,
});

const acknowledgeNewMedicationFlow = ai.defineFlow(
  {
    name: 'acknowledgeNewMedicationFlow',
    inputSchema: AcknowledgeNewMedicationInputSchema,
    outputSchema: AcknowledgeNewMedicationOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
