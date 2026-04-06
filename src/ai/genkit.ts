import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export async function runWithModelFallback<TInput, TOutput>(
  promptFn: (input: TInput) => Promise<{ output?: TOutput }>,
  input: TInput
): Promise<TOutput> {
  try {
    const { output } = await promptFn(input);
    if (!output) throw new Error('AI returned no output');
    return output;
  } catch (error: any) {
    const msg = error?.message?.toLowerCase?.() || '';

    const isRecoverable =
      msg.includes('404') ||
      msg.includes('429') ||
      msg.includes('quota') ||
      error?.status === 404 ||
      error?.status === 429;

    if (!isRecoverable) throw error;

    try {
      // fallback MUST use a different Genkit instance behavior
      const fallback = genkit({
        plugins: [googleAI()],
        model: 'googleai/gemini-1.5-pro-latest',
      });

      const result = await fallback.generate({
        prompt: typeof input === 'string' ? input : JSON.stringify(input),
      });

      return result.output as TOutput;
    } catch {
      throw error;
    }
  }
}
