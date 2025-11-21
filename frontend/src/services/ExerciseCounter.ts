/**
 * Exercise Rep Counter
 * 
 * Detects and counts exercise repetitions based on pose landmarks.
 * Supports multiple exercise types.
 */

import type { Landmark, ExerciseType } from '../../../shared/types'
import { PoseDetector } from './PoseDetector'

interface RepState {
  count: number
  stage: 'up' | 'down' | 'neutral'
  lastAngle: number
  lastRepTime: number
  stateHoldFrames: number
  baselineHipHeight?: number // For squat: track initial standing position
}

export class ExerciseCounter {
  private repState: RepState = {
    count: 0,
    stage: 'neutral',
    lastAngle: 0,
    lastRepTime: 0,
    stateHoldFrames: 0,
    baselineHipHeight: undefined,
  }

  private readonly MIN_VISIBILITY = 0.65
  private readonly MIN_REP_INTERVAL = 800 // ms (minimum time between reps)
  private readonly STATE_HOLD_THRESHOLD = 2 // frames (must hold position for X frames)
  private readonly MIN_HIP_DROP = 0.08 // Minimum hip vertical displacement for valid squat (8% of frame height)

  /**
   * Helper to check if landmarks are visible
   */
  private areLandmarksVisible(landmarks: Landmark[]): boolean {
    return landmarks.every(l => l && (l.visibility === undefined || l.visibility > this.MIN_VISIBILITY))
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

    if (!this.areLandmarksVisible([shoulder, elbow, wrist])) {
      return {
        count: this.repState.count,
        stage: this.repState.stage,
        feedback: 'לא מזהה זרוע (התרחק מהמצלמה)',
      }
    }

    const angle = PoseDetector.calculateAngle(shoulder, elbow, wrist)
    this.repState.lastAngle = angle

    let feedback = ''

    // Down position (arm extended)
    if (angle > 160) {
      if (this.repState.stage === 'up') {
        // Check debounce
        const now = Date.now()
        if (now - this.repState.lastRepTime > this.MIN_REP_INTERVAL) {
          this.repState.stateHoldFrames++

          if (this.repState.stateHoldFrames >= this.STATE_HOLD_THRESHOLD) {
            this.repState.count++
            this.repState.stage = 'down'
            this.repState.lastRepTime = now
            this.repState.stateHoldFrames = 0
            feedback = 'מעולה! 👍'
          }
        }
      } else {
        this.repState.stage = 'down'
      }
    } else {
      // Reset hold counter if condition lost
      if (this.repState.stage === 'up') {
        this.repState.stateHoldFrames = 0
      }
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

    if (!this.areLandmarksVisible([hip, knee, ankle])) {
      return {
        count: this.repState.count,
        stage: this.repState.stage,
        feedback: 'לא מזהה רגליים (התרחק מהמצלמה)',
      }
    }

    const angle = PoseDetector.calculateAngle(hip, knee, ankle)
    this.repState.lastAngle = angle

    // Track baseline hip height when standing
    if (this.repState.baselineHipHeight === undefined && angle > 160) {
      this.repState.baselineHipHeight = hip.y
    }

    let feedback = ''

    // Down position (knees bent) - Relaxed to 100 degrees for rehab
    // AND hip must drop significantly from baseline
    const hipDrop = this.repState.baselineHipHeight !== undefined 
      ? hip.y - this.repState.baselineHipHeight 
      : 0
    
    if (angle < 100 && hipDrop > this.MIN_HIP_DROP) {
      if (this.repState.stage === 'up' || this.repState.stage === 'neutral') {
        this.repState.stage = 'down'
        feedback = 'מצוין! עכשיו קום 👆'
      }
    }

    // Up position (knees extended AND hip returned to baseline)
    const isStandingUpright = angle > 160 && Math.abs(hipDrop) < 0.05

    if (isStandingUpright) {
      if (this.repState.stage === 'down') {
        // Check debounce
        const now = Date.now()
        if (now - this.repState.lastRepTime > this.MIN_REP_INTERVAL) {
          this.repState.stateHoldFrames++

          if (this.repState.stateHoldFrames >= this.STATE_HOLD_THRESHOLD) {
            this.repState.count++
            this.repState.stage = 'up'
            this.repState.lastRepTime = now
            this.repState.stateHoldFrames = 0
            // Reset baseline for next rep
            this.repState.baselineHipHeight = hip.y
            feedback = 'מעולה! תרד שוב 👇'
          }
        }
      } else if (this.repState.stage === 'neutral') {
        this.repState.stage = 'up'
      }
    } else {
      // Reset hold counter if condition lost
      if (this.repState.stage === 'down') {
        this.repState.stateHoldFrames = 0
      }
    }

    return {
      count: this.repState.count,
      stage: this.repState.stage === 'down' ? 'למטה' : 'למעלה',
      angle: Math.round(angle),
      feedback: feedback || (this.repState.stage === 'down' ? 'קום למעלה 👆' : 'תרד למטה 👇'),
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

    if (!this.areLandmarksVisible([shoulder, elbow, wrist])) {
      return {
        count: this.repState.count,
        stage: this.repState.stage,
        feedback: 'לא מזהה זרוע (התרחק מהמצלמה)',
      }
    }

    // Calculate elbow angle
    const angle = PoseDetector.calculateAngle(shoulder, elbow, wrist)
    this.repState.lastAngle = angle

    let feedback = ''

    // Down position (arms bent, hands near shoulders)
    // Angle should be acute (< 90)
    if (angle < 90) {
      if (this.repState.stage === 'up' || this.repState.stage === 'neutral') {
        this.repState.stage = 'down'
        feedback = 'מוכן! דחוף למעלה 👆'
      }
    }

    // Up position (arms extended overhead)
    // Angle should be obtuse (> 150) AND wrists must be ABOVE shoulders
    const isArmsOverhead = wrist.y < shoulder.y // y is smaller when higher
    
    if (angle > 150 && isArmsOverhead) {
      if (this.repState.stage === 'down') {
        // Check debounce
        const now = Date.now()
        if (now - this.repState.lastRepTime > this.MIN_REP_INTERVAL) {
          this.repState.stateHoldFrames++
          
          if (this.repState.stateHoldFrames >= this.STATE_HOLD_THRESHOLD) {
            this.repState.count++
            this.repState.stage = 'up'
            this.repState.lastRepTime = now
            this.repState.stateHoldFrames = 0
            feedback = 'מעולה! 🎯'
          }
        }
      } else if (this.repState.stage === 'neutral') {
        this.repState.stage = 'up'
      }
    } else {
      // Reset hold counter if condition lost
      if (this.repState.stage === 'down') {
        this.repState.stateHoldFrames = 0
      }
    }

    return {
      count: this.repState.count,
      stage: this.repState.stage === 'down' ? 'למטה' : 'למעלה',
      angle: Math.round(angle),
      feedback: feedback || (this.repState.stage === 'down' ? 'דחוף למעלה 👆' : 'תוריד למטה 👇'),
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
      lastRepTime: 0,
      stateHoldFrames: 0,
      baselineHipHeight: undefined,
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
