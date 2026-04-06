import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // Using the standard stable model identifier as the default for the instance
  model: 'googleai/gemini-1.5-flash',
});

/**
 * Helper to run a prompt with a fallback mechanism.
 * It tries the default model first, and falls back to 1.5 Pro if a 404 or 429 error occurs.
 */
export async function runWithModelFallback<TInput, TOutput>(
  promptFn: (input: TInput, config?: any) => Promise<{ output?: TOutput }>,
  input: TInput
): Promise<TOutput> {
  try {
    // Attempt with the default model (configured as 1.5 Flash in the genkit instance)
    const { output } = await promptFn(input);
    if (!output) throw new Error('AI returned no output');
    return output;
  } catch (error: any) {
    const errorMessage = error.message || '';
    const isQuotaError = 
      errorMessage.includes('429') || 
      errorMessage.toLowerCase().includes('quota') ||
      error.status === 429;

    const isNotFoundError = 
      errorMessage.includes('404') || 
      errorMessage.toLowerCase().includes('not found') ||
      error.status === 404;

    if (isQuotaError || isNotFoundError) {
      try {
        // Fallback to 1.5 Pro which is often available if Flash has registration issues
        const { output } = await promptFn(input, { model: 'googleai/gemini-1.5-pro' });
        if (!output) throw new Error('AI fallback returned no output');
        return output;
      } catch (fallbackError) {
        // If fallback also fails, throw the original error to preserve the stack trace
        throw error;
      }
    }
    // Re-throw if it's not a recoverable error
    throw error;
  }
}
