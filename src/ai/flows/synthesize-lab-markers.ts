'use server';

/**
 * @fileOverview Nitya's Lab Synthesis Flow - Synthesises across multiple markers
 * into a single, warm story about the user's current health state.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const SynthesizeLabMarkersInputSchema = z.object({
  labResults: z.array(z.object({
    name: z.string(),
    value: z.string(),
    unit: z.string(),
    trend: z.string(),
  })).describe('An array of markers and their latest readings.'),
  phase: z.string().optional().describe('Current cycle phase if applicable.'),
  sex: z.string().optional().default('Female'),
  healthFocus: z.string().optional().default('Overall balance'),
  lastLabDate: z.string().optional().describe('The date of the previous lab upload.'),
  targetLanguage: z.string().optional().default('English'),
});
export type SynthesizeLabMarkersInput = z.infer<typeof SynthesizeLabMarkersInputSchema>;

const SynthesizeLabMarkersOutputSchema = z.object({
  synthesis: z.string().describe('A 2-3 sentence warm, plain-language story synthesising the data.'),
});
export type SynthesizeLabMarkersOutput = z.infer<typeof SynthesizeLabMarkersOutputSchema>;

export async function synthesizeLabMarkers(
  input: SynthesizeLabMarkersInput
): Promise<SynthesizeLabMarkersOutput> {
  return synthesizeLabMarkersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'synthesizeLabMarkersPrompt',
  input: { schema: SynthesizeLabMarkersInputSchema },
  output: { schema: SynthesizeLabMarkersOutputSchema },
  prompt: `
    You are Nitya — a wise health companion for Indian users.
    
    TASK:
    Synthesise across multiple lab markers into one story.
    
    LOGIC:
    1. DO NOT list numbers or markers back. 
    2. Lead with what is going well based on the trends and values.
    3. Name one trend worth watching as "useful information" rather than a clinical risk.
    4. End with one lifestyle observation or reflection (framed as curiosity, not instruction).
    5. If prior labs exist (lastLabDate: {{{lastLabDate}}}), compare to that time naturally (e.g., "Since your last check in [month]...").
    
    STRICT CONSTRAINTS:
    - Exactly 2-3 sentences.
    - Warm. Plain. Human.
    - NO bullet points.
    - NO clinical terminology (normal, abnormal, range, high/low risk).
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Markers: {{#each labResults}}{{{name}}} ({{{value}}} {{{unit}}}, trend: {{{trend}}}); {{/each}}
    Phase: {{{phase}}}
    Focus: {{{healthFocus}}}
    Last Upload: {{{lastLabDate}}}
    `,
});

const synthesizeLabMarkersFlow = ai.defineFlow(
  {
    name: 'synthesizeLabMarkersFlow',
    inputSchema: SynthesizeLabMarkersInputSchema,
    outputSchema: SynthesizeLabMarkersOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
