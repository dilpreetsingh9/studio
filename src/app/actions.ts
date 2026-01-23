'use server';

import { getPersonalizedInsights } from '@/ai/flows/get-personalized-insights';
import { patientData } from '@/lib/data';

export async function fetchPersonalizedInsights() {
  try {
    const medicalDataString = `
      Patient Details: 
      - Age: ${patientData.details.age}
      - Gender: ${patientData.details.gender}
      - Blood Type: ${patientData.details.bloodType}
      - Allergies: ${patientData.details.allergies.join(', ')}

      Medical History:
      ${patientData.medicalHistory}

      Recent Vitals:
      ${patientData.vitals.map(v => `- ${v.name}: ${v.value} ${v.unit}`).join('\n')}
    `;

    const response = await getPersonalizedInsights({
      medicalData: medicalDataString,
    });

    return response.insights;
  } catch (error) {
    console.error('Error fetching personalized insights:', error);
    return 'Could not load AI-powered insights at this time. Please try again later.';
  }
}
