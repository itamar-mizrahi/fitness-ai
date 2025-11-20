/**
 * Exercise Rep Counter
 * 
 * Detects and counts exercise repetitions based on pose landmarks.
 * Supports multiple exercise types.
 */

import type { Landmark, ExerciseType } from '../../../../shared/types'
import { PoseDetector } from './PoseDetector'

interface RepState {
  count: number
  stage: 'up' | 'down' | 'neutral'
  lastAngle: number
}

export class ExerciseCounter {
  private repState: RepState = {
    count: 0,
    stage: 'neutral',
    lastAngle: 0,
  }

  /**
   * Process landmarks for rep counting
   */
  processFrame(
    landmarks: Landmark[],
    exerciseType: ExerciseType
  ): {
    count: number
    stage: string
    angle?: number
    feedback?: string
  } {
    switch (exerciseType) {
      case 'bicep_curl':
        return this.countBicepCurl(landmarks)
      case 'squat':
        return this.countSquat(landmarks)
      case 'shoulder_press':
        return this.countShoulderPress(landmarks)
      default:
        return {
          count: this.repState.count,
          stage: this.repState.stage,
        }
    }
  }

  /**
   * Count bicep curls
   * Uses left arm: shoulder (11), elbow (13), wrist (15)
   */
  private countBicepCurl(landmarks: Landmark[]) {
    const shoulder = landmarks[11]
    const elbow = landmarks[13]
    const wrist = landmarks[15]

    if (!shoulder || !elbow || !wrist) {
      return {
        count: this.repState.count,
        stage: this.repState.stage,
        feedback: 'לא מזהה זרוע',
      }
    }

    const angle = PoseDetector.calculateAngle(shoulder, elbow, wrist)
    this.repState.lastAngle = angle

    let feedback = ''

    // Down position (arm extended)
    if (angle > 160) {
      if (this.repState.stage === 'up') {
        // Complete rep
        this.repState.count++
        feedback = 'מעולה! 👍'
      }
      this.repState.stage = 'down'
    }

    // Up position (arm contracted)
    if (angle < 30 && this.repState.stage === 'down') {
      this.repState.stage = 'up'
      feedback = 'המשך למטה 👇'
    }

    return {
      count: this.repState.count,
      stage: this.repState.stage === 'down' ? 'למטה' : 'למעלה',
      angle: Math.round(angle),
      feedback: feedback || (this.repState.stage === 'down' ? 'היער למעלה 👆' : 'תוריד למטה 👇'),
    }
  }

  /**
   * Count squats
   * Uses hip (23), knee (25), ankle (27)
   */
  private countSquat(landmarks: Landmark[]) {
    const hip = landmarks[23]
    const knee = landmarks[25]
    const ankle = landmarks[27]

    if (!hip || !knee || !ankle) {
      return {
        count: this.repState.count,
        stage: this.repState.stage,
        feedback: 'לא מזהה רגליים',
      }
    }

    const angle = PoseDetector.calculateAngle(hip, knee, ankle)
    this.repState.lastAngle = angle

    let feedback = ''

    // Down position (knees bent)
    if (angle < 90) {
      if (this.repState.stage === 'neutral' || this.repState.stage === 'up') {
        this.repState.stage = 'down'
        feedback = 'טוב! עכשיו קום 👆'
      }
    }

    // Up position (knees extended)
    if (angle > 160 && this.repState.stage === 'down') {
      this.repState.count++
      this.repState.stage = 'up'
      feedback = 'מעולה! תרד שוב 👇'
    }

    return {
      count: this.repState.count,
      stage: this.repState.stage === 'down' ? 'למטה' : 'למעלה',
      angle: Math.round(angle),
      feedback: feedback || (angle > 160 ? 'תרד למטה 👇' : 'המשך למעלה 👆'),
    }
  }

  /**
   * Count shoulder press
   * Uses shoulder (11), elbow (13), wrist (15)
   */
  private countShoulderPress(landmarks: Landmark[]) {
    const shoulder = landmarks[11]
    const elbow = landmarks[13]
    const wrist = landmarks[15]

    if (!shoulder || !elbow || !wrist) {
      return {
        count: this.repState.count,
        stage: this.repState.stage,
        feedback: 'לא מזהה זרוע',
      }
    }

    // Calculate vertical angle (elbow height relative to shoulder)
    const elbowHeight = elbow.y - shoulder.y
    const wristHeight = wrist.y - elbow.y

    let feedback = ''

    // Down position (elbow below shoulder)
    if (elbowHeight > 0.1) {
      this.repState.stage = 'down'
    }

    // Up position (wrist above elbow)
    if (wristHeight < -0.1 && this.repState.stage === 'down') {
      this.repState.count++
      this.repState.stage = 'up'
      feedback = 'מעולה! 🎯'
    }

    return {
      count: this.repState.count,
      stage: this.repState.stage === 'down' ? 'למטה' : 'למעלה',
      feedback: feedback || (this.repState.stage === 'down' ? 'לחץ למעלה 👆' : 'תוריד למטה 👇'),
    }
  }

  /**
   * Reset counter
   */
  reset() {
    this.repState = {
      count: 0,
      stage: 'neutral',
      lastAngle: 0,
    }
  }

  /**
   * Get current count
   */
  getCount(): number {
    return this.repState.count
  }

  /**
   * Set count manually
   */
  setCount(count: number) {
    this.repState.count = count
  }
}

export default ExerciseCounter
