import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // Using the standard stable model identifier
  model: 'googleai/gemini-1.5-flash',
});

/**
 * Helper to run a prompt with a fallback mechanism.
 * It tries Gemini 2.0 first, and falls back to 1.5 if a quota or not found error occurs.
 */
export async function runWithModelFallback<TInput, TOutput>(
  promptFn: (input: TInput, config?: any) => Promise<{ output?: TOutput }>,
  input: TInput
): Promise<TOutput> {
  try {
    // Attempt with 2.0 Flash first
    const { output } = await promptFn(input, { model: 'googleai/gemini-2.0-flash' });
    if (!output) throw new Error('AI returned no output');
    return output;
  } catch (error: any) {
    const isQuotaError = 
      error.message?.includes('429') || 
      error.message?.toLowerCase().includes('quota') ||
      error.status === 429;

    const isNotFoundError = 
      error.message?.includes('404') || 
      error.message?.toLowerCase().includes('not found');

    if (isQuotaError || isNotFoundError) {
      // Fallback to 1.5 Flash using the stable identifier (avoiding -latest alias which can 404)
      const { output } = await promptFn(input, { model: 'googleai/gemini-1.5-flash' });
      if (!output) throw new Error('AI fallback returned no output');
      return output;
    }
    // Re-throw if it's not a recoverable error
    throw error;
  }
}
