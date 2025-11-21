import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface WorkoutSessionData {
  userId: string
  exerciseType: string
  reps: number
  duration: number // in seconds
  accuracy: number // percentage 0-100
  timestamp: number
  caloriesBurned?: number
}

export const WorkoutService = {
  /**
   * Save a new workout session
   */
  async saveSession(data: WorkoutSessionData) {
    try {
      const docRef = await addDoc(collection(db, 'workouts'), {
        ...data,
        createdAt: Timestamp.fromMillis(data.timestamp)
      })
      console.log('Workout saved with ID: ', docRef.id)
      return docRef.id
    } catch (e) {
      console.error('Error adding document: ', e)
      throw e
    }
  },

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string) {
    try {
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (WorkoutSessionData & { id: string })[]
    } catch (e) {
      console.error('Error getting documents: ', e)
      throw e
    }
  },

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const sessions = await this.getUserSessions(userId)
    
    if (sessions.length === 0) {
      return {
        totalWorkouts: 0,
        totalReps: 0,
        totalDuration: 0,
        averageAccuracy: 0,
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0]
      }
    }

    const totalWorkouts = sessions.length
    const totalReps = sessions.reduce((sum, s) => sum + s.reps, 0)
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalWorkouts

    // Calculate weekly progress (last 7 days)
    const weeklyProgress = new Array(7).fill(0)
    const now = new Date()
    const oneDay = 24 * 60 * 60 * 1000

    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp)
      const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / oneDay)
      
      if (diffDays >= 0 && diffDays < 7) {
        // Index 6 is today, 0 is 6 days ago
        const index = 6 - diffDays
        weeklyProgress[index] += session.duration / 60 // Convert to minutes
      }
    })

    return {
      totalWorkouts,
      totalReps,
      totalDuration, // in seconds
      averageAccuracy,
      weeklyProgress
    }
  }
}
