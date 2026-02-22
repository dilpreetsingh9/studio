import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // We specify a default, but individual flows will now attempt 2.0 first.
  model: 'googleai/gemini-1.5-flash',
});

/**
 * Helper to run a prompt with a fallback mechanism.
 * It tries Gemini 2.0 first, and falls back to 1.5 if a quota error occurs.
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

    if (isQuotaError) {
      // Fallback to 1.5 Flash
      const { output } = await promptFn(input, { model: 'googleai/gemini-1.5-flash' });
      if (!output) throw new Error('AI fallback returned no output');
      return output;
    }
    // Re-throw if it's not a quota error
    throw error;
  }
}
