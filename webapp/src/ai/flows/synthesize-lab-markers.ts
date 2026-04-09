'use server';

/**
 * @fileOverview Jeiva's Historical Synthesis Flow (R-2)
 * Synthesises across all historical medical reports into a single coherent narrative.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const SynthesizeLabMarkersInputSchema = z.object({
  allReportsJson: z.string().describe('Full history of extracted markers and dates.'),
  recurringLow: z.string().optional().describe('Markers that are consistently low.'),
  recurringStable: z.string().optional().describe('Markers that are consistently stable.'),
  trends: z.string().optional().describe('Notable trends across time.'),
  sex: z.string(),
  healthFocus: z.string(),
  daysActive: z.number(),
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
    ROLE: Jeiva (Wise Indian Health Companion).
    TASK: Synthesise across all historical medical reports into one coherent picture.
    
    LOGIC:
    - IDENTIFY the single most meaningful cross-report pattern.
    - LEAD with what is stable — reassurance before observation.
    - NAME one thing worth watching — framed as useful to know, never as alarming.
    - IF a marker connects to check-in logs: Name the connection explicitly.
    - CONFIDENCE: If all markers are stable, say so confidently. "Everything holding steady."
    
    BANNED:
    - NO bullet points.
    - NO clinical terminology.
    - NO alarming language.
    
    DATA:
    Reports: {{{allReportsJson}}}
    Recurring Low: {{{recurringLow}}}
    Recurring Stable: {{{recurringStable}}}
    Trends: {{{trends}}}
    Context: Sex: {{{sex}}} | Focus: {{{healthFocus}}} | Days Active: {{{daysActive}}}
    Target Language: {{{targetLanguage}}}
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
