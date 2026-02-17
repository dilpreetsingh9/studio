export type Patient = {
  name: string;
  avatarUrl: string;
  details: {
    age: number;
    gender: string;
    bloodType: string;
    allergies: string[];
  };
  medicalHistory: string;
  healthGoals: HealthGoal[];
  vitals: Vital[];
  appointments: Appointment[];
  messages: Message[];
};

export type Vital = {
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
};
