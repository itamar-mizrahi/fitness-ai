/**
 * Tremor Detection Service
 * 
 * Analyzes pose landmarks to detect and quantify tremors in hands, head, and legs.
 * Used for monitoring Parkinson's disease and other movement disorders.
 */

import type { Landmark, TremorMeasurement } from '../../../../shared/types'

interface TremorConfig {
  windowSize: number // Number of frames to analyze
  minAmplitudeThreshold: number // Minimum movement to consider tremor (pixels)
  samplingRate: number // FPS
}

export class TremorDetector {
  private landmarkHistory: Landmark[][] = []
  private config: TremorConfig
  private timestamps: number[] = []

  constructor(config: Partial<TremorConfig> = {}) {
    this.config = {
      windowSize: config.windowSize || 60, // 2 seconds at 30fps
      minAmplitudeThreshold: config.minAmplitudeThreshold || 2,
      samplingRate: config.samplingRate || 30,
      ...config,
    }
  }

  /**
   * Add new pose landmarks to analysis window
   */
  addFrame(landmarks: Landmark[], timestamp: number) {
    this.landmarkHistory.push(landmarks)
    this.timestamps.push(timestamp)

    // Keep only the window we need
    if (this.landmarkHistory.length > this.config.windowSize) {
      this.landmarkHistory.shift()
      this.timestamps.shift()
    }
  }

  /**
   * Analyze tremor for a specific body part
   * MediaPipe Pose landmarks: https://google.github.io/mediapipe/solutions/pose.html
   * 
   * Hand landmarks: 15 (left wrist), 16 (right wrist)
   * Head landmarks: 0 (nose), 7 (left ear), 8 (right ear)
   * Leg landmarks: 23 (left hip), 24 (right hip), 27 (left ankle), 28 (right ankle)
   */
  analyzeTremor(
    bodyPart: 'hand_left' | 'hand_right' | 'head' | 'leg_left' | 'leg_right',
    userId: string
  ): TremorMeasurement | null {
    if (this.landmarkHistory.length < this.config.windowSize) {
      return null // Not enough data yet
    }

    const landmarkIndices = this.getLandmarkIndices(bodyPart)
    const positions = this.extractPositions(landmarkIndices)
    
    if (positions.length === 0) {
      return null
    }

    // Calculate tremor metrics
    const amplitude = this.calculateAmplitude(positions)
    const frequency = this.calculateFrequency(positions)
    const severity = this.classifySeverity(amplitude, frequency)
    const updrsScore = this.calculateUPDRSScore(amplitude, frequency)

    const duration = 
      (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000

    return {
      id: crypto.randomUUID(),
      userId,
      timestamp: new Date(),
      bodyPart,
      amplitude,
      frequency,
      duration,
      severity,
      updrsScore,
    }
  }

  /**
   * Get landmark indices for body part
   */
  private getLandmarkIndices(
    bodyPart: 'hand_left' | 'hand_right' | 'head' | 'leg_left' | 'leg_right'
  ): number[] {
    const map = {
      hand_left: [15], // Left wrist
      hand_right: [16], // Right wrist
      head: [0, 7, 8], // Nose, left ear, right ear
      leg_left: [27], // Left ankle
      leg_right: [28], // Right ankle
    }
    return map[bodyPart]
  }

  /**
   * Extract 2D positions from landmark history
   */
  private extractPositions(landmarkIndices: number[]): { x: number; y: number }[] {
    return this.landmarkHistory.map((landmarks) => {
      // Average position of all specified landmarks
      const validLandmarks = landmarkIndices
        .map((idx) => landmarks[idx])
        .filter((lm) => lm && lm.visibility && lm.visibility > 0.5)

      if (validLandmarks.length === 0) {
        return null
      }

      const avgX = validLandmarks.reduce((sum, lm) => sum + lm.x, 0) / validLandmarks.length
      const avgY = validLandmarks.reduce((sum, lm) => sum + lm.y, 0) / validLandmarks.length

      return { x: avgX * 640, y: avgY * 480 } // Convert to pixel coordinates
    }).filter((pos): pos is { x: number; y: number } => pos !== null)
  }

  /**
   * Calculate amplitude (peak-to-peak displacement in pixels)
   */
  private calculateAmplitude(positions: { x: number; y: number }[]): number {
    if (positions.length < 2) return 0

    // Remove linear trend (drift)
    const detrended = this.detrend(positions)

    // Calculate Euclidean distances from center
    const centerX = detrended.reduce((sum, p) => sum + p.x, 0) / detrended.length
    const centerY = detrended.reduce((sum, p) => sum + p.y, 0) / detrended.length

    const distances = detrended.map((p) =>
      Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
    )

    // Peak-to-peak amplitude
    const max = Math.max(...distances)
    const min = Math.min(...distances)
    
    return max - min
  }

  /**
   * Calculate dominant frequency using zero-crossing method
   */
  private calculateFrequency(positions: { x: number; y: number }[]): number {
    if (positions.length < 10) return 0

    const detrended = this.detrend(positions)
    
    // Use X-axis for frequency calculation
    const signal = detrended.map((p) => p.x)
    
    // Remove mean
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length
    const centered = signal.map((val) => val - mean)

    // Count zero crossings
    let crossings = 0
    for (let i = 1; i < centered.length; i++) {
      if (
        (centered[i - 1] >= 0 && centered[i] < 0) ||
        (centered[i - 1] < 0 && centered[i] >= 0)
      ) {
        crossings++
      }
    }

    // Frequency = crossings / (2 * duration)
    const duration =
      (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000
    const frequency = crossings / (2 * duration)

    return frequency
  }

  /**
   * Remove linear trend from positions
   */
  private detrend(positions: { x: number; y: number }[]): { x: number; y: number }[] {
    if (positions.length < 2) return positions

    // Simple linear detrending
    const n = positions.length
    const xs = positions.map((_, i) => i)
    
    // Detrend X
    const meanX = positions.reduce((sum, p) => sum + p.x, 0) / n
    const meanIdx = (n - 1) / 2
    const slopeX =
      positions.reduce((sum, p, i) => sum + (i - meanIdx) * (p.x - meanX), 0) /
      positions.reduce((sum, _, i) => sum + Math.pow(i - meanIdx, 2), 0)

    // Detrend Y
    const meanY = positions.reduce((sum, p) => sum + p.y, 0) / n
    const slopeY =
      positions.reduce((sum, p, i) => sum + (i - meanIdx) * (p.y - meanY), 0) /
      positions.reduce((sum, _, i) => sum + Math.pow(i - meanIdx, 2), 0)

    return positions.map((p, i) => ({
      x: p.x - (meanX + slopeX * (i - meanIdx)),
      y: p.y - (meanY + slopeY * (i - meanIdx)),
    }))
  }

  /**
   * Classify tremor severity
   * Based on clinical observations:
   * - Mild: < 10 pixels, 4-6 Hz
   * - Moderate: 10-20 pixels, 4-6 Hz
   * - Severe: > 20 pixels, any frequency
   */
  private classifySeverity(
    amplitude: number,
    frequency: number
  ): 'mild' | 'moderate' | 'severe' {
    if (amplitude > 20) return 'severe'
    if (amplitude > 10) return 'moderate'
    return 'mild'
  }

  /**
   * Calculate UPDRS-like tremor score (0-4)
   * Unified Parkinson's Disease Rating Scale
   * 
   * 0 = No tremor
   * 1 = Slight; amplitude < 5 pixels
   * 2 = Mild; amplitude 5-10 pixels
   * 3 = Moderate; amplitude 10-20 pixels
   * 4 = Severe; amplitude > 20 pixels
   */
  private calculateUPDRSScore(amplitude: number, frequency: number): number {
    if (amplitude < this.config.minAmplitudeThreshold) return 0
    if (amplitude < 5) return 1
    if (amplitude < 10) return 2
    if (amplitude < 20) return 3
    return 4
  }

  /**
   * Reset the detector
   */
  reset() {
    this.landmarkHistory = []
    this.timestamps = []
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.landmarkHistory.length
  }

  /**
   * Check if enough data for analysis
   */
  isReady(): boolean {
    return this.landmarkHistory.length >= this.config.windowSize
  }
}

export default TremorDetector
