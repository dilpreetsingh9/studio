'use server';

/**
 * @fileOverview Nitya's Food Connection Flow - Connects specific Indian food items 
 * to physiological effects relevant to the user's current state or cycle phase.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const ConnectFoodInputSchema = z.object({
  foodItem: z.string().describe('The Indian food item logged.'),
  timeOfDay: z.string().describe('Morning, afternoon, evening, or night.'),
  phase: z.string().optional().describe('Current cycle phase if applicable.'),
  energyScore: z.number().optional().default(3),
  hoursSinceLastMeal: z.number().optional().default(4),
  fastingToday: z.boolean().optional().default(false),
  targetLanguage: z.string().optional().default('English'),
});
export type ConnectFoodInput = z.infer<typeof ConnectFoodInputSchema>;

const ConnectFoodOutputSchema = z.object({
  connection: z.string().describe('A single warm sentence connecting the food to the user state.'),
});
export type ConnectFoodOutput = z.infer<typeof ConnectFoodOutputSchema>;

export async function connectFoodToState(input: ConnectFoodInput): Promise<ConnectFoodOutput> {
  return connectFoodToStateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'connectFoodToStatePrompt',
  input: { schema: ConnectFoodInputSchema },
  output: { schema: ConnectFoodOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - You prove you understand Indian life through food connections.
    - No calorie counts. No macro tracking. No Western nutrition frameworks.
    - Connect the food to one physiological effect relevant to the user's current state.
    
    CULTURAL KNOWLEDGE (Use these properties naturally):
    - Dal: protein and iron — good for follicular phase or energy recovery.
    - Rice: fast carb — energy spike then dip; pairing with fat/protein slows it.
    - Curd/Lassi: probiotic, cooling, excellent post-workout or in high heat.
    - Jeera water: digestive aid — good after heavy meals or when energy feels sluggish.
    - Rajma: plant protein — steady energy release, better than rice alone.
    - Ghee: fat-soluble nutrient absorption — small amounts aid digestion and skin.
    - Khichdi: grounding, easy on the gut when energy is low or during menstrual phase.

    LOGIC:
    1. If fastingToday is true: Acknowledge the fast warmly. Never suggest breaking it. Connect the food to what will happen when the fast ends (recovery/sustenance).
    2. Phase connection: Link food properties to current phase ({{{phase}}}) if provided.
    3. Energy connection: If energy is low (1-2), suggest how this food supports recovery.
    
    STRICT CONSTRAINTS:
    - Exactly 1 sentence.
    - Specific to {{{foodItem}}} and the user context.
    - Warm. Never preachy. No "should" or "must."
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Food: {{{foodItem}}}
    Phase: {{{phase}}}
    Energy: {{{energyScore}}}/5
    Fasting: {{{fastingToday}}}
    Time: {{{timeOfDay}}}
    `,
});

const connectFoodToStateFlow = ai.defineFlow(
  {
    name: 'connectFoodToStateFlow',
    inputSchema: ConnectFoodInputSchema,
    outputSchema: ConnectFoodOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
