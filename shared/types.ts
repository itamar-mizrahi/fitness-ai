/**
 * Shared TypeScript types between frontend and backend
 */

// ==================== User & Authentication ====================

export enum UserRole {
  ADMIN = 'admin',
  RESEARCHER = 'researcher',
  THERAPIST = 'therapist',
  PATIENT = 'patient',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Exercise Types ====================

export enum ExerciseType {
  BICEP_CURL = 'bicep_curl',
  SQUAT = 'squat',
  SHOULDER_PRESS = 'shoulder_press',
  LEG_RAISE = 'leg_raise',
  SEATED_EXERCISES = 'seated_exercises',
  // Add more as needed
}

export enum BodyCondition {
  SARCOPENIA = 'sarcopenia',
  PARKINSONS = 'parkinsons',
  STROKE_RECOVERY = 'stroke_recovery',
  GENERAL_WEAKNESS = 'general_weakness',
  HEALTHY = 'healthy',
}

// ==================== Pose & Landmarks ====================

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  landmarks: Landmark[];
  timestamp: number;
}

// ==================== Exercise Session ====================

export interface ExerciseSession {
  id: string;
  userId: string;
  exerciseType: ExerciseType;
  startTime: Date;
  endTime?: Date;
  reps: number;
  sets?: number;
  quality_score?: number; // 0-100
  notes?: string;
}

// ==================== Tremor Detection ====================

export interface TremorMeasurement {
  id: string;
  userId: string;
  timestamp: Date;
  bodyPart: 'hand_left' | 'hand_right' | 'head' | 'leg_left' | 'leg_right';
  amplitude: number; // pixels or mm
  frequency: number; // Hz
  duration: number; // seconds
  severity: 'mild' | 'moderate' | 'severe';
  updrsScore?: number; // 0-4 scale
}

export interface TremorAnalysis {
  measurements: TremorMeasurement[];
  averageAmplitude: number;
  averageFrequency: number;
  trend: 'improving' | 'stable' | 'worsening';
  comparisonToBaseline?: number; // percentage change
}

// ==================== IMBODY Data ====================

export interface ImbodyData {
  id: string;
  sessionId: string;
  timestamp: Date;
  force: number; // Newtons
  power: number; // Watts
  velocity: number; // m/s
  rom: number; // degrees
  timeUnderTension: number; // seconds
}

export interface ImbodySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  measurements: ImbodyData[];
  avgForce: number;
  maxForce: number;
  totalWork: number; // Joules
}

// ==================== Progress & Analytics ====================

export interface ProgressMetrics {
  userId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'all';
  totalSessions: number;
  totalReps: number;
  averageQuality: number;
  improvementRate: number; // percentage
  consistency: number; // 0-100
  tremorReduction?: number; // percentage
}

export interface GoalProgress {
  goalId: string;
  userId: string;
  goalType: 'reps' | 'sessions' | 'quality' | 'tremor_reduction';
  target: number;
  current: number;
  deadline: Date;
  progress: number; // 0-100
  status: 'on_track' | 'behind' | 'completed';
}

// ==================== Study Protocol ====================

export interface StudyProtocol {
  id: string;
  name: string;
  description: string;
  condition: BodyCondition;
  interventionGroup: string[];
  controlGroup: string[];
  duration: number; // weeks
  assessmentSchedule: string[]; // e.g., ['baseline', 'week4', 'week8', 'week12']
  status: 'planning' | 'recruiting' | 'active' | 'completed';
}

export interface ConsentForm {
  id: string;
  userId: string;
  studyId: string;
  signedAt: Date;
  signature: string; // base64 encoded
  ipAddress?: string;
}

// ==================== Questionnaires ====================

export interface Questionnaire {
  id: string;
  name: string;
  type: 'pre' | 'post' | 'followup';
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'number' | 'scale' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  questionnaireId: string;
  answers: Record<string, string | number>;
  completedAt: Date;
}

// ==================== Form Analysis ====================

export interface FormFeedback {
  timestamp: number;
  issue: string;
  severity: 'info' | 'warning' | 'error';
  bodyPart?: string;
  suggestion?: string;
}

export interface ExerciseQuality {
  overallScore: number; // 0-100
  stability: number; // 0-100
  symmetry: number; // 0-100
  rangeOfMotion: number; // 0-100
  tempo: number; // 0-100
  feedback: FormFeedback[];
}
