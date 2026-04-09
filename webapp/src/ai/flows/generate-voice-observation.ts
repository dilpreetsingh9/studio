'use server';

/**
 * @fileOverview Jeiva's Voice Observation Flow (L-4)
 * Generates a one-line observation that goes one level deeper than the user's words.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const VoiceObservationInputSchema = z.object({
  transcript: z.string().describe('The raw user voice transcript.'),
  tags: z.array(z.string()).describe('Auto-tags from Flow L-1.'),
  timeOfDay: z.string(),
  phase: z.string().optional(),
  hrvTrend: z.string().optional(),
  energyScore: z.number().optional(),
  targetLanguage: z.string().optional().default('English'),
});
export type VoiceObservationInput = z.infer<typeof VoiceObservationInputSchema>;

const VoiceObservationOutputSchema = z.object({
  observation: z.string().describe('1 specific sentence observation. Max 16 words.'),
});
export type VoiceObservationOutput = z.infer<typeof VoiceObservationOutputSchema>;

export async function generateVoiceObservation(input: VoiceObservationInput): Promise<VoiceObservationOutput> {
  return voiceObservationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVoiceObservationPrompt',
  input: { schema: VoiceObservationInputSchema },
  output: { schema: VoiceObservationOutputSchema },
  prompt: `
    ROLE: Jeiva. TASK: Write 1 specific line naming what you noticed in the transcript.
    
    LOGIC:
    - Read {{{transcript}}} + {{{tags}}}. Identify deepest signal.
    - FOOD: Connect to energy/body. "Dal-chawal at lunch tends to do that — fast carbs, then a dip."
    - TIRED/HEAVY: Connect to time ({{{timeOfDay}}}) or phase ({{{phase}}}). No advice.
    - POSITIVE: Reflect warmly. "That is your follicular phase doing its thing."
    - SHORT/AMBIGUOUS: "Noted. Jeiva will hold this."
    
    PHILOSOPHY:
    - Prove you heard them by being specific.
    - Generic lines lose trust. Specific lines build connection.
    - One level deeper than a summary.
    
    CONSTRAINTS:
    - 1 sentence. Max 16 words.
    - No clinical language. No summary.
    - No exclamation marks. No hollow affirmations.
    - Output in {{{targetLanguage}}}.

    DATA: 
    Transcript: "{{{transcript}}}" | Tags: {{{tags}}} 
    Time: {{{timeOfDay}}} | Phase: {{{phase}}} | Energy: {{{energyScore}}}
  `,
});

const voiceObservationFlow = ai.defineFlow(
  {
    name: 'voiceObservationFlow',
    inputSchema: VoiceObservationInputSchema,
    outputSchema: VoiceObservationOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
