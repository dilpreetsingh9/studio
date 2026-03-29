'use server';

/**
 * @fileOverview Jeiva's Relationship Milestone Flow - Generates a warm,
 * reflective acknowledgement when a user reaches a significant day count.
 * 
 * Persona: Jeiva - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const RelationshipMilestoneInputSchema = z.object({
  firstName: z.string(),
  daysActive: z.number(),
  milestoneDays: z.number(),
  mostConsistent: z.string().describe('A consistent behavior observed by Jeiva.'),
  visibleChange: z.string().describe('A visible shift in biometrics or logs.'),
  targetLanguage: z.string().optional().default('English'),
});
export type RelationshipMilestoneInput = z.infer<typeof RelationshipMilestoneInputSchema>;

const RelationshipMilestoneOutputSchema = z.object({
  note: z.string().describe('A 2-3 sentence warm, reflective note. No exclamation marks.'),
});
export type RelationshipMilestoneOutput = z.infer<typeof RelationshipMilestoneOutputSchema>;

export async function generateRelationshipMilestone(
  input: RelationshipMilestoneInput
): Promise<RelationshipMilestoneOutput> {
  return generateRelationshipMilestoneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRelationshipMilestonePrompt',
  input: { schema: RelationshipMilestoneInputSchema },
  output: { schema: RelationshipMilestoneOutputSchema },
  prompt: `
    You are Jeiva — a wise health companion for Indian users.
    
    TASK:
    Write a quiet acknowledgement of a relationship milestone ({{{milestoneDays}}} days).
    
    PHILOSOPHY:
    - This is not a trophy. It is a moment of witnessing.
    - "Thirty days" should feel like: "Jeiva knows you better now."
    - The tone is warm gravity. Deep, not party energy.
    - No exclamation marks. No hollow celebrations.
    
    LOGIC:
    1. Name the milestone naturally (e.g., "We have been together for thirty days now").
    2. Connect it to {{{mostConsistent}}} as a foundation of the relationship.
    3. Reference {{{visibleChange}}} as a sign of compounding effort.
    4. Close with one forward-looking line that feels like a possibility, not a goal or a score.
    
    STRICT CONSTRAINTS:
    - 2-3 sentences total.
    - Warm. Personal. Specific.
    - No "You did it!", "Keep going!", or "Amazing streak!"
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Name: {{{firstName}}}
    Days: {{{daysActive}}}
    Consistent: {{{mostConsistent}}}
    Visible shift: {{{visibleChange}}}
    `,
});

const generateRelationshipMilestoneFlow = ai.defineFlow(
  {
    name: 'generateRelationshipMilestoneFlow',
    inputSchema: RelationshipMilestoneInputSchema,
    outputSchema: RelationshipMilestoneOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
