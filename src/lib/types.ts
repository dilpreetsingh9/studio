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
  medications?: Medication[];
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

export type ReportMarker = {
  name: string;
  value: number;
  unit: string;
  trend: string;
  interpretation?: string;
};

export type Report = {
  id: string;
  report_type: string;
  lab_name: string;
  report_date: string;
  scan_date: any; // Firestore timestamp
  markers: ReportMarker[];
  jeiva_summary: string;
  ocr_confidence: number;
  unclear_markers: string[];
  imageUrl?: string;
};

export type HistorySynthesis = {
  content: string;
  generated_at: any;
  reports_included: string[];
};

export type JournalEntry = {
  id: string;
  timestamp: Date;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  sentiment?: 'positive' | 'neutral' | 'low';
  foodItem?: string | null;
  foodConnection?: string;
  flagForSynthesis?: boolean;
  jeiva_observation?: string;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  priority: 'Essential' | 'Supportive' | 'Occasional';
  reminderTime: string;
  streak?: number;
  lastTaken?: string; // ISO date string
};

export type RelationshipState = {
  days_active: number;
  relationship_maturity: 'new' | 'developing' | 'established' | 'deep';
  most_consistent_behaviour?: string;
  biggest_change?: string;
};
