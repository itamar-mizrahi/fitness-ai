import { describe, it, expect, beforeEach } from 'vitest'
import { FormAnalyzer } from './FormAnalyzer'
import { ExerciseType } from '../../../shared/types'
import type { Landmark } from '../../../shared/types'

describe('FormAnalyzer', () => {
  let analyzer: FormAnalyzer

  beforeEach(() => {
    analyzer = new FormAnalyzer()
  })

  it('should return null for unknown exercise', () => {
    const result = analyzer.analyze([], 'unknown' as ExerciseType)
    expect(result).toBeNull()
  })

  describe('Bicep Curl Analysis', () => {
    it('should detect good form', () => {
      // Mock landmarks for good form (elbow close to body)
      const landmarks = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 })
      landmarks[11] = { x: 0.5, y: 0.2, z: 0, visibility: 1 } // Shoulder
      landmarks[13] = { x: 0.5, y: 0.5, z: 0, visibility: 1 } // Elbow (aligned)
      landmarks[23] = { x: 0.5, y: 0.8, z: 0, visibility: 1 } // Hip

      const result = analyzer.analyze(landmarks, ExerciseType.BICEP_CURL)
      
      expect(result).not.toBeNull()
      expect(result?.isValid).toBe(true)
      expect(result?.severity).toBe('info')
    })

    it('should detect elbow swing', () => {
      // Mock landmarks for bad form (elbow far from body)
      const landmarks = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 })
      landmarks[11] = { x: 0.5, y: 0.2, z: 0, visibility: 1 } // Shoulder
      landmarks[13] = { x: 0.7, y: 0.5, z: 0, visibility: 1 } // Elbow (swinging out)
      landmarks[23] = { x: 0.5, y: 0.8, z: 0, visibility: 1 } // Hip

      const result = analyzer.analyze(landmarks, ExerciseType.BICEP_CURL)
      
      expect(result).not.toBeNull()
      expect(result?.isValid).toBe(false)
      expect(result?.message).toContain('מרפק')
      expect(result?.severity).toBe('warning')
    })
  })

  describe('Squat Analysis', () => {
    it('should detect knee valgus', () => {
      // Mock landmarks for knee valgus (knees closer than ankles)
      const landmarks = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 })
      
      // Left leg
      landmarks[23] = { x: 0.4, y: 0.5, z: 0, visibility: 1 } // Hip
      landmarks[25] = { x: 0.45, y: 0.7, z: 0, visibility: 1 } // Knee (caving in)
      landmarks[27] = { x: 0.4, y: 0.9, z: 0, visibility: 1 } // Ankle

      // Right leg
      landmarks[24] = { x: 0.6, y: 0.5, z: 0, visibility: 1 } // Hip
      landmarks[26] = { x: 0.55, y: 0.7, z: 0, visibility: 1 } // Knee (caving in)
      landmarks[28] = { x: 0.6, y: 0.9, z: 0, visibility: 1 } // Ankle

      const result = analyzer.analyze(landmarks, ExerciseType.SQUAT)
      
      expect(result).not.toBeNull()
      expect(result?.isValid).toBe(false)
      expect(result?.message).toContain('ברכיים')
      expect(result?.severity).toBe('danger')
    })
  })
})
