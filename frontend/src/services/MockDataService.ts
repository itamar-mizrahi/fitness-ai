import { ExerciseType, type ExerciseSession, type TremorMeasurement, type ExerciseQuality } from '../../../shared/types'

export class MockDataService {
  // Generate last 30 days of data
  static getWorkoutHistory(): ExerciseSession[] {
    const sessions: ExerciseSession[] = []
    const today = new Date()
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Randomly decide if workout happened (70% chance)
      if (Math.random() > 0.3) {
        const session: ExerciseSession = {
          id: `session-${i}`,
          userId: 'mock-user',
          exerciseType: Math.random() > 0.5 ? ExerciseType.BICEP_CURL : ExerciseType.SQUAT,
          startTime: date,
          reps: Math.floor(Math.random() * 15) + 5, // 5-20 reps
          sets: Math.floor(Math.random() * 3) + 1, // 1-4 sets
          quality_score: Math.floor(Math.random() * 30) + 70, // 70-100 score
        }
        sessions.push(session)
      }
    }
    return sessions
  }

  static getTremorHistory(): TremorMeasurement[] {
    const measurements: TremorMeasurement[] = []
    const today = new Date()
    
    // Simulate improvement over 30 days
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Base amplitude decreases over time (improvement)
      const baseAmp = 10 - (i < 15 ? 0 : (15 - i) * 0.2) // starts at 10, goes down
      const noise = Math.random() * 2 - 1
      
      measurements.push({
        id: `tremor-${i}`,
        userId: 'mock-user',
        timestamp: date,
        bodyPart: 'hand_right',
        amplitude: Math.max(0, baseAmp + noise),
        frequency: 4 + Math.random(), // 4-5 Hz
        duration: 10,
        severity: baseAmp > 7 ? 'moderate' : 'mild'
      })
    }
    return measurements
  }

  static getCurrentQuality(): ExerciseQuality {
    return {
      overallScore: 85,
      stability: 82,
      symmetry: 88,
      rangeOfMotion: 90,
      tempo: 75,
      feedback: []
    }
  }
}
