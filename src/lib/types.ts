
export type LifeStage = 'Regular' | 'TTC' | 'Pregnancy' | 'Perimenopause';
export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export type Patient = {
  name: string;
  avatarUrl: string;
  lifeStage: LifeStage;
  details: {
    age: number;
    gender: string;
    bloodType: string;
    allergies: string[];
    height?: number;
    weight?: number;
  };
  medicalHistory: string;
  cycleData: {
    lastPeriodStart: Date;
    avgCycleLength: number;
    currentDay: number;
    predictedPhase: CyclePhase;
  };
  vitals: Vital[];
  labResults: LabResult[];
  symptoms: SymptomLog[];
  journalEntries?: JournalEntry[];
};

export type SymptomLog = {
  id: string;
  timestamp: Date;
  type: 'Mood' | 'Energy' | 'Pain' | 'Acne' | 'Libido' | 'Sleep' | 'Stress' | 'Digestive';
  value: number; // 1-5
  note?: string;
};

export type Vital = {
  name: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'stable';
};

export type LabResult = {
  name: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'stable';
};

export type MedicalRecord = {
  id: string;
  capturedAt: Date;
  imageUrl: string;
  summary: string;
  keyFindings?: string[];
  nextSteps?: string[];
};

export type JournalEntry = {
  id: string;
  timestamp: Date;
  content: string;
  summary: string;
  category: string;
  tags: string[];
};
