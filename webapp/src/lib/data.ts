
import type { Patient } from '@/lib/types';
import { HeartPulse, Activity, Flame, TrendingUp, Droplets, Sun, Zap, FlaskConical } from 'lucide-react';

export const patientData: Patient = {
  name: 'Saher Sharma',
  avatarUrl: 'https://picsum.photos/seed/patient-saher/100/100',
  lifeStage: 'Regular',
  details: {
    age: 28,
    gender: 'Female',
    bloodType: 'O+',
    allergies: ['Peanuts'],
    height: 165,
    weight: 60,
  },
  medicalHistory: 'Regular cycles, history of mild endometriosis. Focus on hormone balance and optimizing energy.',
  cycleData: {
    lastPeriodStart: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    avgCycleLength: 28,
    currentDay: 12,
    predictedPhase: 'Follicular',
  },
  vitals: [
    { name: 'RHR', value: '64', unit: 'bpm', icon: HeartPulse, trend: 'stable' },
    { name: 'BBT', value: '36.4', unit: '°C', icon: Droplets, trend: 'stable' },
    { name: 'Sleep', value: '7.5', unit: 'hrs', icon: Activity, trend: 'up' },
    { name: 'HRV', value: '55', unit: 'ms', icon: Zap, trend: 'up' },
  ],
  labResults: [
    { name: 'Progesterone', value: '1.2', unit: 'ng/mL', icon: FlaskConical, trend: 'stable' },
    { name: 'Estrogen', value: '120', unit: 'pg/mL', icon: FlaskConical, trend: 'up' },
    { name: 'LH', value: '8.4', unit: 'mIU/mL', icon: FlaskConical, trend: 'up' },
    { name: 'FSH', value: '5.2', unit: 'mIU/mL', icon: FlaskConical, trend: 'stable' },
  ],
  symptoms: [
    { id: '1', timestamp: new Date(), type: 'Energy', value: 4, note: 'Feeling productive' },
    { id: '2', timestamp: new Date(), type: 'Mood', value: 5, note: 'Very positive today' },
  ],
  journalEntries: [
    {
      id: '1',
      timestamp: new Date(Date.now() - 86400000),
      content: 'Starting the follicular phase. Feeling a surge in energy and mental clarity.',
      summary: 'High energy follicular phase start.',
      category: 'General',
      tags: ['follicular', 'energy'],
    }
  ]
};
