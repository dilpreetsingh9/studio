export type Patient = {
  name: string;
  avatarUrl: string;
  details: {
    age: number;
    gender: string;
    bloodType: string;
    allergies: string[];
    height?: number; // in cm
    weight?: number; // in kg
  };
  medicalHistory: string;
  healthGoals: HealthGoal[];
  vitals: Vital[];
  labResults: LabResult[];
  appointments: Appointment[];
  messages: Message[];
  medications?: Medication[];
  journalEntries?: JournalEntry[];
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

export type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
};

export type Message = {
  id: string;
  sender: string;
  avatarUrl: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
};

export type HealthGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

export type MedicalRecord = {
  id: string;
  capturedAt: Date;
  imageUrl: string;
  summary: string;
  keyFindings?: string[];
  nextSteps?: string[];
};

export type MedicationPriority = 'Cannot Miss' | 'Good to have' | 'Can Skip';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  priority: MedicationPriority;
  reminderTime: string;
};

export type JournalEntry = {
  id: string;
  timestamp: Date;
  content: string;
  summary: string;
  category: string;
  tags: string[];
};
