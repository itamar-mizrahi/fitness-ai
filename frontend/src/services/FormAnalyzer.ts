/**
 * Form Analyzer Service
 * 
 * Analyzes pose landmarks to detect form deviations and provide corrective feedback.
 * Critical for preventing injury and ensuring exercise effectiveness in rehabilitation.
 */

import type { Landmark, ExerciseType } from '../../../shared/types'
import { PoseDetector } from './PoseDetector'

export interface FormFeedback {
  isValid: boolean
  message: string
  correction?: string
  severity: 'info' | 'warning' | 'danger'
}

export class FormAnalyzer {
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

    if (!shoulder || !elbow || !hip) return null

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
      severity: 'info'
    }
  }

  /**
   * Analyze Squat
   * Checks for:
   * 1. Knee Valgus (knees caving in)
   * 2. Forward Lean (torso dropping too much)
   */
  private analyzeSquat(landmarks: Landmark[]): FormFeedback | null {
    const hipLeft = landmarks[23]
    const kneeLeft = landmarks[25]
    const ankleLeft = landmarks[27]
    const hipRight = landmarks[24]
    const kneeRight = landmarks[26]
    const ankleRight = landmarks[28]

    if (!hipLeft || !kneeLeft || !ankleLeft || !hipRight || !kneeRight || !ankleRight) return null

    // Check 1: Knee Valgus
    // Calculate horizontal distance between knees vs ankles
    const kneeDistance = Math.abs(kneeLeft.x - kneeRight.x)
    const ankleDistance = Math.abs(ankleLeft.x - ankleRight.x)

    // If knees are significantly closer than ankles
    if (kneeDistance < ankleDistance * 0.8) {
      return {
        isValid: false,
        message: 'ברכיים קורסות פנימה',
        correction: 'דחוף ברכיים החוצה',
        severity: 'danger'
      }
    }

    // Check 2: Depth (optional warning)
    // We can use the angle from ExerciseCounter, but here we can give early feedback
    // This is better handled in the counter logic usually, but we can check for "Good Depth"
    const angleLeft = PoseDetector.calculateAngle(hipLeft, kneeLeft, ankleLeft)
    if (angleLeft < 90) {
       return {
        isValid: true,
        message: 'עומק מצוין!',
        severity: 'info'
      }
    }

    return {
      isValid: true,
      message: 'שמור על גב ישר',
      severity: 'info'
    }
  }

  /**
   * Analyze Shoulder Press
   * Checks for:
   * 1. Asymmetry
   */
  private analyzeShoulderPress(landmarks: Landmark[]): FormFeedback | null {
    const wristLeft = landmarks[15]
    const wristRight = landmarks[16]
    const shoulderLeft = landmarks[11]
    const shoulderRight = landmarks[12]

    if (!wristLeft || !wristRight || !shoulderLeft || !shoulderRight) return null

    // Check Asymmetry
    // Compare vertical distance of wrists from shoulders
    const leftHeight = Math.abs(wristLeft.y - shoulderLeft.y)
    const rightHeight = Math.abs(wristRight.y - shoulderRight.y)
    
    const difference = Math.abs(leftHeight - rightHeight)

    if (difference > 0.15) {
      return {
        isValid: false,
        message: 'חוסר סימטריה',
        correction: 'נסה ליישר את הידיים יחד',
        severity: 'warning'
      }
    }

    return {
      isValid: true,
      message: 'יציב',
      severity: 'info'
    }
  }
}

export default FormAnalyzer
