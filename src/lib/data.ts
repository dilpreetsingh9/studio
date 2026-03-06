import type { Patient } from '@/lib/types';
import { HeartPulse, Activity, Flame, TrendingUp, Droplets, Sun, Zap, FlaskConical } from 'lucide-react';

export const patientData: Patient = {
  name: 'Saher Sharma',
  avatarUrl: 'https://picsum.photos/seed/patient-saher/100/100',
  details: {
    age: 35,
    gender: 'Female',
    bloodType: 'O+',
    allergies: ['Peanuts', 'Penicillin'],
    height: 165,
    weight: 62,
  },
  medicalHistory:
    'Diagnosed with Type 2 Diabetes in 2022. History of seasonal allergies. No major surgeries. Family history of heart disease.',
  healthGoals: [
    { id: '1', name: 'Weekly Steps', current: 25000, target: 35000, unit: 'steps' },
    { id: '2', name: 'Hydration', current: 6, target: 8, unit: 'glasses/day' },
    { id: '3', name: 'Mindful Minutes', current: 60, target: 100, unit: 'mins/week' },
  ],
  vitals: [
    { name: 'HR', value: '72', unit: 'bpm', icon: HeartPulse, trend: 'stable' },
    { name: 'Activity', value: '8,450', unit: 'steps', icon: Activity, trend: 'up' },
    { name: 'Calories', value: '1,840', unit: 'kcal', icon: Flame, trend: 'stable' },
    { name: 'Stairs', value: '12', unit: 'floors', icon: TrendingUp, trend: 'up' },
  ],
  labResults: [
    { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', icon: Droplets, trend: 'stable' },
    { name: 'Vitamin D3', value: '28', unit: 'ng/mL', icon: Sun, trend: 'down' },
    { name: 'Vitamin B12', value: '450', unit: 'pg/mL', icon: Zap, trend: 'up' },
    { name: 'Cholesterol', value: '185', unit: 'mg/dL', icon: FlaskConical, trend: 'stable' },
  ],
  appointments: [
    {
      id: '1',
      doctor: 'Dr. Evelyn Reed',
      specialty: 'Cardiologist',
      date: '2024-08-15',
      time: '10:00 AM',
      status: 'upcoming',
    },
    {
      id: '2',
      doctor: 'Dr. Kyle Reese',
      specialty: 'Endocrinologist',
      date: '2024-07-22',
      time: '02:30 PM',
      status: 'completed',
    },
  ],
  medications: [
    {
      id: '1',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      priority: 'Cannot Miss',
      reminderTime: '08:00 AM',
    },
    {
      id: '2',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      priority: 'Cannot Miss',
      reminderTime: '09:00 AM',
    },
    {
      id: '3',
      name: 'Vitamin D3',
      dosage: '2000 IU',
      frequency: 'Once daily',
      priority: 'Good to have',
      reminderTime: '10:00 AM',
    }
  ],
  journalEntries: [
    {
      id: '1',
      timestamp: new Date(Date.now() - 86400000),
      content: 'Woke up feeling a bit sluggish. Did 30 mins of light cardio and felt better. Had a high protein breakfast.',
      summary: 'Morning exercise and high-protein breakfast. Improved mood post-cardio.',
      category: 'Exercise',
      tags: ['cardio', 'breakfast', 'sluggish'],
    }
  ]
};
