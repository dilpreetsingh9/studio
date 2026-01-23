import type { Patient } from '@/lib/types';
import { HeartPulse, Droplets, Thermometer, Activity } from 'lucide-react';

export const patientData: Patient = {
  name: 'Sarah Connor',
  avatarUrl: 'https://picsum.photos/seed/patient-sarah/100/100',
  details: {
    age: 35,
    gender: 'Female',
    bloodType: 'O+',
    allergies: ['Peanuts', 'Penicillin'],
  },
  medicalHistory:
    'Diagnosed with Type 2 Diabetes in 2022. History of seasonal allergies. No major surgeries. Family history of heart disease.',
  healthGoals: [
    { id: '1', name: 'Weekly Steps', current: 25000, target: 35000, unit: 'steps' },
    { id: '2', name: 'Hydration', current: 6, target: 8, unit: 'glasses/day' },
    { id: '3', name: 'Mindful Minutes', current: 60, target: 100, unit: 'mins/week' },
  ],
  vitals: [
    { name: 'Heart Rate', value: '72', unit: 'bpm', icon: HeartPulse, trend: 'stable' },
    { name: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Droplets, trend: 'stable' },
    { name: 'Temperature', value: '98.6', unit: '°F', icon: Thermometer, trend: 'stable' },
    { name: 'Activity', value: '3,450', unit: 'steps', icon: Activity, trend: 'down' },
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
  messages: [
    {
      id: '1',
      sender: 'Dr. Evelyn Reed',
      avatarUrl: 'https://picsum.photos/seed/dr-reed/100/100',
      lastMessage: 'Your recent test results are in. We should...',
      timestamp: '1 day ago',
      unreadCount: 1,
    },
    {
      id: '2',
      sender: 'John Connor (Son)',
      avatarUrl: 'https://picsum.photos/seed/john-connor/100/100',
      lastMessage: 'Hey Mom, are you free for a call this evening?',
      timestamp: '3 days ago',
      unreadCount: 0,
    },
  ],
};
