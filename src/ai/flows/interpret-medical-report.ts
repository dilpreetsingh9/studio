'use server';

/**
 * @fileOverview Jeiva's Medical Report Interpretation Flow (R-1)
 * Translates structural OCR data into a warm, plain-language 1-2 sentence interpretation.
 */

import { ai, runWithModelFallback } from '@/ai/genkit';
import { z } from 'genkit';

const InterpretMedicalReportInputSchema = z.object({
  reportType: z.string().describe('e.g., Blood Test, Ultrasound'),
  labName: z.string().optional(),
  reportDate: z.string().optional(),
  markers: z.array(z.object({
    name: z.string(),
    value: z.string(),
    unit: z.string(),
  })).describe('JSON array of extracted markers.'),
  priorReadings: z.array(z.any()).optional().default([]).describe('Historical readings for trend analysis.'),
  sex: z.string(),
  phase: z.string().optional(),
  healthFocus: z.string().optional(),
  targetLanguage: z.string().optional().default('English'),
});

export type InterpretMedicalReportInput = z.infer<typeof InterpretMedicalReportInputSchema>;

const InterpretMedicalReportOutputSchema = z.object({
  interpretation: z.string().describe('1-2 sentence warm, plain-language observation.'),
});

export type InterpretMedicalReportOutput = z.infer<typeof InterpretMedicalReportOutputSchema>;

export async function interpretMedicalReport(
  input: InterpretMedicalReportInput
): Promise<InterpretMedicalReportOutput> {
  return interpretMedicalReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretMedicalReportPrompt',
  input: { schema: InterpretMedicalReportInputSchema },
  output: { schema: InterpretMedicalReportOutputSchema },
  prompt: `
    ROLE: Jeiva (Wise Indian Health Companion). 
    TASK: Write a holistic interpretation for a scanned medical report.
    
    LOGIC:
    - 1-2 sentences only. Appear inline on report card.
    - Connect markers to user context (Sex: {{{sex}}}, Phase: {{{phase}}}, Focus: {{{healthFocus}}}).
    - TRENDS: If priorReadings exist, note the direction. "Vitamin D has been lower across two reports now."
    - FIRST READING: Contextualise marker roles in plain language. No reference ranges.
    - UNREMARKABLE: If all looks clear, say so warmly. "Nothing here asking for attention."
    
    BANNED:
    - NO numeric reference ranges.
    - NO BANNED WORDS: abnormal, concerning, elevated (as warning), deficient, critical, urgent.
    - NO "see a doctor" or "consult professional".
    - NO diagnosis.
    
    PHILOSOPHY:
    Trust must be honoured with utility. Say something the user could not understand from numbers alone.
    
    DATA:
    Type: {{{reportType}}} | Date: {{{reportDate}}}
    Markers: {{#each markers}}{{{name}}}: {{{value}}} {{{unit}}}; {{/each}}
    Target Language: {{{targetLanguage}}}
  `,
});

const interpretMedicalReportFlow = ai.defineFlow(
  {
    name: 'interpretMedicalReportFlow',
    inputSchema: InterpretMedicalReportInputSchema,
    outputSchema: InterpretMedicalReportOutputSchema,
  },
  async (input) => {
    return runWithModelFallback(prompt, input);
  }
);
