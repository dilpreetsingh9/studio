import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit instance configured with Gemini 1.5 Flash as default.
 * gemini-2.0-flash is currently avoided as default to prevent quota exceeded (429) errors
 * in environments where 2.0 metrics are restricted.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});

/**
 * Executes a Genkit prompt function with robust fallback logic.
 * Handles 429 (Quota Exceeded) and 404 (Model Not Found) errors by trying
 * alternative stable models.
 * 
 * @param promptFn - The Genkit prompt function to execute.
 * @param input - The input data for the prompt.
 * @returns The structured output from the model.
 */
export async function runWithModelFallback<TInput, TOutput>(
  promptFn: (input: TInput, config?: any) => Promise<{ output?: TOutput }>,
  input: TInput
): Promise<TOutput> {
  try {
    // Attempt with default model (Gemini 1.5 Flash)
    const { output } = await promptFn(input);
    if (!output) throw new Error('AI returned no output');
    return output;
  } catch (error: any) {
    const msg = error?.message?.toLowerCase?.() || '';
    const status = error?.status || (error?.originalError?.status);

    // Detect quota exceeded or model not found errors
    const isQuotaError = msg.includes('429') || msg.includes('quota') || status === 429;
    const isNotFoundError = msg.includes('404') || status === 404;

    if (isQuotaError || isNotFoundError) {
      console.warn(`Primary model failed (${status || 'quota/not-found'}). Attempting fallback to gemini-1.5-pro...`);
      try {
        // Fallback: Gemini 1.5 Pro (Stable identifier)
        const { output } = await promptFn(input, { model: 'googleai/gemini-1.5-pro' });
        if (output) return output;
      } catch (fallbackError: any) {
        console.error('All AI fallback attempts exhausted.');
        throw error;
      }
    }
    
    // If not a quota/not-found error, or if fallbacks failed, re-throw the original error
    throw error;
  }
}
