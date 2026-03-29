'use server';

/**
 * @fileOverview Nitya's Lab Result Contextualisation Flow - Translates clinical markers
 * into warm, non-clinical observations grounded in daily life.
 * 
 * Persona: Nitya - Indian health companion.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeLabResultInputSchema = z.object({
  markerName: z.string().describe('The name of the lab marker (e.g., Hemoglobin, Estrogen).'),
  value: z.string().describe('The numeric value of the result.'),
  unit: z.string().describe('The unit of measurement.'),
  trend: z.enum(['up', 'down', 'stable', 'first reading']).describe('Trend compared to previous reading.'),
  phase: z.string().optional().describe('Current cycle phase if applicable.'),
  sex: z.string().optional().default('Female'),
  healthFocus: z.string().optional().default('Overall balance'),
  targetLanguage: z.string().optional().default('English'),
});
export type AnalyzeLabResultInput = z.infer<typeof AnalyzeLabResultInputSchema>;

const AnalyzeLabResultOutputSchema = z.object({
  context: z.string().describe('A 1-2 sentence warm, plain-language observation.'),
});
export type AnalyzeLabResultOutput = z.infer<typeof AnalyzeLabResultOutputSchema>;

export async function analyzeLabResult(
  input: AnalyzeLabResultInput
): Promise<AnalyzeLabResultOutput> {
  return analyzeLabResultFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLabResultPrompt',
  input: { schema: AnalyzeLabResultInputSchema },
  output: { schema: AnalyzeLabResultOutputSchema },
  prompt: `
    You are Nitya — an AI health companion for Indian users.
    
    PHILOSOPHY:
    - A lab result is not a verdict. It is information.
    - One data point in a larger story — not the headline.
    - Consistency is built through identity, not fear.
    - Frame findings as "useful to know," not "alarming to act on."
    
    STRICT CONSTRAINTS:
    - NEVER cite numeric ranges or reference intervals.
    - NEVER use "within normal limits," "abnormal," "high/low range," or "optimal."
    - NEVER suggest consulting a doctor or medical professional.
    - NEVER use clinical or diagnostic language.
    
    LOGIC:
    1. If trend is "first reading": Contextualize in plain language.
    2. If marker is hormonal (Estrogen, Progesterone, LH, FSH): Connect to cycle phase ({{{phase}}}).
    3. If marker is metabolic (Glucose, HbA1c): Connect to energy and food patterns.
    4. If marker is haematological (Hemoglobin, Ferritin): Connect to energy and physical capacity.
    5. If trend is "up" or "down": Contextualize the direction in daily experience (e.g., "energy seems steadier").
    
    TONE:
    - Warm. Plain language. Specific. Human.
    - 1-2 sentences only.
    - Provide the output in {{{targetLanguage}}}.

    USER CONTEXT:
    Marker: {{{markerName}}}
    Result: {{{value}}} {{{unit}}}
    Trend: {{{trend}}}
    Phase: {{{phase}}}
    Focus: {{{healthFocus}}}
    `,
});

const analyzeLabResultFlow = ai.defineFlow(
  {
    name: 'analyzeLabResultFlow',
    inputSchema: AnalyzeLabResultInputSchema,
    outputSchema: AnalyzeLabResultOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
