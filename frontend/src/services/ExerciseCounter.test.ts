import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ExerciseCounter } from './ExerciseCounter'
import { ExerciseType } from '../../../shared/types'

describe('ExerciseCounter', () => {
  let counter: ExerciseCounter

  beforeEach(() => {
    vi.useFakeTimers()
    counter = new ExerciseCounter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Shoulder Press', () => {
    it('should count a valid rep using angles with debounce', () => {
      // 1. Start Down
      const down = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 1 })
      down[11] = { x: 0.5, y: 0.5, z: 0, visibility: 1 } // Shoulder
      down[13] = { x: 0.8, y: 0.5, z: 0, visibility: 1 } // Elbow
      down[15] = { x: 0.6, y: 0.4, z: 0, visibility: 1 } // Wrist
      
      counter.processFrame(down, ExerciseType.SHOULDER_PRESS)
      expect(counter.processFrame(down, ExerciseType.SHOULDER_PRESS).stage).toBe('למטה')

      // Advance time
      const start = Date.now()
      vi.setSystemTime(start + 1000) // Wait 1s

      // 2. Go Up (Arms extended AND wrists above shoulders)
      const up = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 1 })
      up[11] = { x: 0.5, y: 0.5, z: 0, visibility: 1 } // Shoulder
      up[13] = { x: 0.5, y: 0.2, z: 0, visibility: 1 } // Elbow
      up[15] = { x: 0.5, y: 0.0, z: 0, visibility: 1 } // Wrist (y=0 is top, so 0.0 < 0.5)

      // Must hold for 2 frames
      counter.processFrame(up, ExerciseType.SHOULDER_PRESS)
      
      // 2nd frame should trigger count
      const result = counter.processFrame(up, ExerciseType.SHOULDER_PRESS)
      expect(result.count).toBe(1)
      expect(result.stage).toBe('למעלה')
    })
  })

  describe('Squat', () => {
    it('should count a valid rep with relaxed threshold and debounce', () => {
      // 1. Start Up (establish baseline)
      const up = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 1 })
      up[23] = { x: 0.5, y: 0.5, z: 0, visibility: 1 } // Hip (baseline at 0.5)
      up[25] = { x: 0.5, y: 0.8, z: 0, visibility: 1 } // Knee
      up[27] = { x: 0.5, y: 1.0, z: 0, visibility: 1 } // Ankle

      counter.processFrame(up, ExerciseType.SQUAT)
      
      // 2. Go Down (hip drops significantly: 0.5 -> 0.6 = 0.1 drop > 0.08 threshold)
      const down = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 1 })
      down[23] = { x: 0.5, y: 0.6, z: 0, visibility: 1 } // Hip (dropped by 0.1)
      down[25] = { x: 0.7, y: 0.7, z: 0, visibility: 1 } // Knee
      down[27] = { x: 0.5, y: 1.0, z: 0, visibility: 1 } // Ankle

      const downResult = counter.processFrame(down, ExerciseType.SQUAT)
      expect(downResult.stage).toBe('למטה')

      // Advance time
      const start = Date.now()
      vi.setSystemTime(start + 1000)

      // 3. Return Up (hip at baseline)
      // Hold for 2 frames
      counter.processFrame(up, ExerciseType.SQUAT)

      const finalResult = counter.processFrame(up, ExerciseType.SQUAT)
      expect(finalResult.count).toBe(1)
      expect(finalResult.stage).toBe('למעלה')
    })

    it('should NOT count when standing with arms up (no hip drop)', () => {
      // Establish baseline while standing
      const standing = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 1 })
      standing[23] = { x: 0.5, y: 0.5, z: 0, visibility: 1 } // Hip
      standing[25] = { x: 0.5, y: 0.8, z: 0, visibility: 1 } // Knee
      standing[27] = { x: 0.5, y: 1.0, z: 0, visibility: 1 } // Ankle
      
      counter.processFrame(standing, ExerciseType.SQUAT)
      
      // Small knee movement (e.g. raising arms causes slight sway)
      // but no significant hip drop (only 0.02 drop < 0.08 threshold)
      const slightMovement = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 1 })
      slightMovement[23] = { x: 0.5, y: 0.52, z: 0, visibility: 1 } // Hip (tiny movement)
      slightMovement[25] = { x: 0.6, y: 0.8, z: 0, visibility: 1 } // Knee
      slightMovement[27] = { x: 0.5, y: 1.0, z: 0, visibility: 1 } // Ankle
      
      const result = counter.processFrame(slightMovement, ExerciseType.SQUAT)
      expect(result.count).toBe(0)
      expect(result.stage).not.toBe('למטה')
    })

    it('should ignore low visibility landmarks', () => {
      const lowVis = Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0.1 })
      // Even if coordinates are perfect for a rep
      lowVis[23] = { x: 0.5, y: 0.6, z: 0, visibility: 0.1 } // Hip
      lowVis[25] = { x: 0.7, y: 0.6, z: 0, visibility: 0.1 } // Knee
      lowVis[27] = { x: 0.5, y: 1.0, z: 0, visibility: 0.1 } // Ankle

      const result = counter.processFrame(lowVis, ExerciseType.SQUAT)
      expect(result.feedback).toContain('לא מזהה')
    })
  })
})
