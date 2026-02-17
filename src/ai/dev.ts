import { config } from 'dotenv';
config();

import '@/ai/flows/generate-health-recommendations.ts';
import '@/ai/flows/summarize-medical-records.ts';
import '@/ai/flows/analyze-medical-document.ts';
