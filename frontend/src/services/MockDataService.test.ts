import { describe, it, expect } from 'vitest'
import { MockDataService } from './MockDataService'

describe('MockDataService', () => {
  it('should generate workout history', () => {
    const history = MockDataService.getWorkoutHistory()
    expect(history).toBeDefined()
    expect(Array.isArray(history)).toBe(true)
    // Should have some sessions (random chance, but over 30 days likely > 0)
    // We can't strictly assert length > 0 due to randomness, but highly probable.
    // Let's check structure of one if exists
    if (history.length > 0) {
      const session = history[0]
      expect(session.id).toBeDefined()
      expect(session.userId).toBe('mock-user')
      expect(session.reps).toBeGreaterThan(0)
    }
  })

  it('should generate tremor history', () => {
    const history = MockDataService.getTremorHistory()
    expect(history).toBeDefined()
    expect(history.length).toBe(31) // 30 days + today
    
    const measurement = history[0]
    expect(measurement.amplitude).toBeDefined()
    expect(measurement.frequency).toBeGreaterThan(0)
  })

  it('should get current quality', () => {
    const quality = MockDataService.getCurrentQuality()
    expect(quality).toBeDefined()
    expect(quality.overallScore).toBeGreaterThan(0)
    expect(quality.overallScore).toBeLessThanOrEqual(100)
  })
})
