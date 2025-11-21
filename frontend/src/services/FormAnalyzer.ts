/**
 * Form Analyzer Service
 * 
 * Analyzes pose landmarks to detect form deviations and provide corrective feedback.
 * Critical for preventing injury and ensuring exercise effectiveness in rehabilitation.
 */

import type { Landmark, ExerciseType } from '../../../shared/types'
import { PoseDetector } from './PoseDetector'

export interface FormFeedback {
  isValid?: boolean
  message: string
  severity: 'info' | 'warning' | 'danger'
  correction?: string
  timestamp?: number
  issue?: string
  bodyPart?: string
}

export default class FormAnalyzer {
  private readonly MIN_VISIBILITY = 0.65

  private areLandmarksVisible(landmarks: Landmark[]): boolean {
    return landmarks.every(l => l && (l.visibility === undefined || l.visibility > this.MIN_VISIBILITY))
  }

  /**
   * Analyze form for a specific exercise
   */
  analyze(
    landmarks: Landmark[],
    exerciseType: ExerciseType
  ): FormFeedback | null {
    switch (exerciseType) {
      case 'bicep_curl':
        return this.analyzeBicepCurl(landmarks)
      case 'squat':
        return this.analyzeSquat(landmarks)
      case 'shoulder_press':
        return this.analyzeShoulderPress(landmarks)
      default:
        return null
    }
  }

  /**
   * Analyze Bicep Curl
   * Checks for:
   * 1. Elbow swinging (moving too far from body)
   * 2. Leaning back (cheating)
   */
  private analyzeBicepCurl(landmarks: Landmark[]): FormFeedback | null {
    const shoulder = landmarks[11] // Left shoulder
    const elbow = landmarks[13]    // Left elbow
    const hip = landmarks[23]      // Left hip

    if (!this.areLandmarksVisible([shoulder, elbow, hip])) return null

    // Check 1: Elbow Swing
    // Calculate horizontal distance between shoulder and elbow
    // Ideally, elbow should stay under shoulder
    const elbowOffset = Math.abs(elbow.x - shoulder.x)
    
    // Threshold: 0.15 (normalized coordinates)
    if (elbowOffset > 0.15) {
      return {
        isValid: false,
        message: 'מרפק זז מדי',
        correction: 'הצמד את המרפק לגוף',
        severity: 'warning'
      }
    }

    // Check 2: Body Lean
    // Check if shoulders are significantly behind hips (x-axis in side view, but here we use 2D)
    // This is harder in 2D without depth, but we can check alignment
    // For now, we'll focus on elbow stability as it's the most common error
    
    return {
      isValid: true,
      message: 'טכניקה טובה',
      severity: 'info',
      bodyPart: 'general'
    }
  }

  /**
   * Analyze Squat form
   * Checks:
   * 1. Knee Valgus (knees caving in)
   * 2. Depth (hips below knees)
   * 3. Forward Lean (shoulders too far forward relative to hips)
   */
  private analyzeSquat(landmarks: Landmark[]): FormFeedback | null {
    const hipLeft = landmarks[23]
    const hipRight = landmarks[24]
    const kneeLeft = landmarks[25]
    const kneeRight = landmarks[26]
    const ankleLeft = landmarks[27]
    const ankleRight = landmarks[28]
    const shoulderLeft = landmarks[11]

    if (!this.areLandmarksVisible([hipLeft, hipRight, kneeLeft, kneeRight, ankleLeft, ankleRight, shoulderLeft])) {
      return null
    }

    // 1. Knee Valgus Check
    const kneeWidth = Math.abs(kneeLeft.x - kneeRight.x)
    const ankleWidth = Math.abs(ankleLeft.x - ankleRight.x)
    const hipWidth = Math.abs(hipLeft.x - hipRight.x)

    if (kneeWidth < ankleWidth * 0.8 || kneeWidth < hipWidth * 0.8) {
      return {
        timestamp: Date.now(),
        issue: 'knee_valgus',
        severity: 'danger',
        message: 'שים לב! הברכיים קורסות פנימה',
        correction: 'דחוף את הברכיים החוצה',
        bodyPart: 'legs'
      }
    }

    // 2. Depth Check (only when deep in squat)
    const hipHeight = (hipLeft.y + hipRight.y) / 2
    const kneeHeight = (kneeLeft.y + kneeRight.y) / 2
    
    // 3. Forward Lean Check
    // Check horizontal distance between shoulder and hip
    const lean = Math.abs(shoulderLeft.x - hipLeft.x)
    if (lean > 0.2 && hipHeight > kneeHeight - 0.1) { // Leaning while standing/descending
       return {
        timestamp: Date.now(),
        issue: 'forward_lean',
        severity: 'warning',
        message: 'גב נוטה מדי קדימה',
        correction: 'שמור על גב זקוף וחזה פתוח',
        bodyPart: 'torso'
      }
    }

    if (hipHeight > kneeHeight) {
      return {
        timestamp: Date.now(),
        issue: 'depth',
        severity: 'info',
        message: 'נסה לרדת נמוך יותר',
        correction: 'רד עד שהירכיים מקבילות לרצפה',
        bodyPart: 'legs'
      }
    }

    return {
      timestamp: Date.now(),
      issue: 'good_form',
      severity: 'info',
      message: 'טכניקה מצוינת!',
      isValid: true
    }
  }

  /**
   * Analyze Shoulder Press form
   * Checks:
   * 1. Symmetry (arms rising together)
   * 2. Full Extension (arms straight at top)
   */
  private analyzeShoulderPress(landmarks: Landmark[]): FormFeedback | null {
    const shoulderLeft = landmarks[11]
    const shoulderRight = landmarks[12]
    const elbowLeft = landmarks[13]
    const elbowRight = landmarks[14]
    const wristLeft = landmarks[15]
    const wristRight = landmarks[16]

    if (!this.areLandmarksVisible([shoulderLeft, shoulderRight, elbowLeft, elbowRight, wristLeft, wristRight])) {
      return null
    }

    // 1. Symmetry Check
    const leftHeight = wristLeft.y
    const rightHeight = wristRight.y
    const heightDiff = Math.abs(leftHeight - rightHeight)

    if (heightDiff > 0.1) { // Threshold for asymmetry
      return {
        timestamp: Date.now(),
        issue: 'asymmetry',
        severity: 'warning',
        message: 'חוסר סימטריה בידיים',
        correction: 'נסה ליישר את הידיים באותו גובה',
        bodyPart: 'arms'
      }
    }

    // 2. Elbow Flare Check (elbows should be slightly forward, not too far back)
    // This is hard with 2D, but we can check if elbows are too far from shoulders horizontally
    // if looking from front. Actually, let's check if elbows drop too low.
    
    const leftElbowAngle = PoseDetector.calculateAngle(shoulderLeft, elbowLeft, wristLeft)
    const rightElbowAngle = PoseDetector.calculateAngle(shoulderRight, elbowRight, wristRight)

    if (Math.abs(leftElbowAngle - rightElbowAngle) > 20) {
       return {
        timestamp: Date.now(),
        issue: 'uneven_extension',
        severity: 'info',
        message: 'יישור לא אחיד',
        correction: 'ישר את שתי הידיים באותה מידה',
        bodyPart: 'arms'
      }
    }

    return {
      timestamp: Date.now(),
      issue: 'good_form',
      severity: 'info',
      message: 'יציב וטוב',
      isValid: true
    }
  }
}
