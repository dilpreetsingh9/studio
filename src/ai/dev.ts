
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-health-recommendations.ts';
import '@/ai/flows/summarize-medical-records.ts';
import '@/ai/flows/analyze-medical-document.ts';
import '@/ai/flows/generate-health-goals.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/analyze-missed-medication.ts';
import '@/ai/flows/transcribe-health-dictation.ts';
import '@/ai/flows/generate-cycle-insights.ts';
import '@/ai/flows/generate-phase-guidance.ts';
import '@/ai/flows/analyze-lab-result.ts';
import '@/ai/flows/generate-weekly-letter.ts';
import '@/ai/flows/generate-reengagement-note.ts';
import '@/ai/flows/generate-day-one-welcome.ts';
import '@/ai/flows/generate-recovery-insights.ts';
import '@/ai/flows/acknowledge-symptom-log.ts';
import '@/ai/flows/tag-journal-entry.ts';
import '@/ai/flows/confirm-log-entry.ts';
import '@/ai/flows/connect-food-to-state.ts';
import '@/ai/flows/acknowledge-medication-intake.ts';
import '@/ai/flows/acknowledge-new-medication.ts';
