import { describe, it, expect, beforeEach } from 'vitest'
import { TremorDetector } from './TremorDetector'
import type { Landmark } from '../../../shared/types'

describe('TremorDetector', () => {
  let detector: TremorDetector

  beforeEach(() => {
    detector = new TremorDetector({
      windowSize: 10,
      minAmplitudeThreshold: 2,
      samplingRate: 30,
    })
  })

  it('should initialize with default config', () => {
    const d = new TremorDetector()
    expect(d.getBufferSize()).toBe(0)
    expect(d.isReady()).toBe(false)
  })

  it('should add frames and manage buffer size', () => {
    const mockLandmark: Landmark = { x: 0.5, y: 0.5, z: 0, visibility: 1 }
    const mockLandmarks = Array(33).fill(mockLandmark)

    // Add 5 frames
    for (let i = 0; i < 5; i++) {
      detector.addFrame(mockLandmarks, Date.now() + i * 33)
    }
    expect(detector.getBufferSize()).toBe(5)
    expect(detector.isReady()).toBe(false)

    // Add 6 more frames (total 11, window size 10)
    for (let i = 0; i < 6; i++) {
      detector.addFrame(mockLandmarks, Date.now() + (i + 5) * 33)
    }
    expect(detector.getBufferSize()).toBe(10) // Should be capped at windowSize
    expect(detector.isReady()).toBe(true)
  })

  it('should analyze tremor correctly for static pose (no tremor)', () => {
    const mockLandmark: Landmark = { x: 0.5, y: 0.5, z: 0, visibility: 1 }
    const mockLandmarks = Array(33).fill(mockLandmark)

    // Fill buffer with identical frames
    for (let i = 0; i < 10; i++) {
      detector.addFrame(mockLandmarks, Date.now() + i * 33)
    }

    const result = detector.analyzeTremor('hand_right', 'test-user')
    
    expect(result).not.toBeNull()
    if (result) {
      expect(result.amplitude).toBeLessThan(0.001)
      expect(result.severity).toBe('mild')
      expect(result.updrsScore).toBe(0)
    }
  })

  it('should detect simulated tremor', () => {
    // Simulate 5Hz tremor with amplitude approx 20 pixels (0.03 in normalized coords approx)
    // 640px width * 0.03 = 19.2px
    const center = 0.5
    const amplitude = 0.03 
    const frequency = 5 // Hz
    const samplingRate = 30
    
    for (let i = 0; i < 15; i++) {
      const t = i / samplingRate
      const offset = amplitude * Math.sin(2 * Math.PI * frequency * t)
      
      const landmarks = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 })
      // Set right wrist (index 16)
      landmarks[16] = { 
        x: center + offset, 
        y: center, 
        z: 0, 
        visibility: 1 
      }
      
      detector.addFrame(landmarks, t * 1000)
    }

    const result = detector.analyzeTremor('hand_right', 'test-user')
    
    expect(result).not.toBeNull()
    if (result) {
      // Amplitude should be roughly peak-to-peak (2 * amplitude * 640)
      // 2 * 0.03 * 640 = 38.4 pixels
      expect(result.amplitude).toBeGreaterThan(10) 
      
      // Frequency detection might be rough with short window, but check range
      expect(result.frequency).toBeGreaterThan(0)
    }
  })

  it('should return null if not enough data', () => {
    const result = detector.analyzeTremor('hand_right', 'test-user')
    expect(result).toBeNull()
  })

  it('should reset correctly', () => {
    const mockLandmark: Landmark = { x: 0.5, y: 0.5, z: 0, visibility: 1 }
    const mockLandmarks = Array(33).fill(mockLandmark)

    for (let i = 0; i < 10; i++) {
      detector.addFrame(mockLandmarks, Date.now() + i * 33)
    }
    
    expect(detector.isReady()).toBe(true)
    detector.reset()
    expect(detector.getBufferSize()).toBe(0)
    expect(detector.isReady()).toBe(false)
  })
})
