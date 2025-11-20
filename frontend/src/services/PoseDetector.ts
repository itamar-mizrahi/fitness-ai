/**
 * Enhanced Pose Detection Service
 * 
 * Wraps MediaPipe Pose with additional functionality for exercise detection
 * and tremor analysis.
 */

import { Pose, Results } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import type { Landmark, PoseResults, ExerciseType } from '../../../../shared/types'

export interface PoseDetectorConfig {
  modelComplexity?: 0 | 1 | 2
  smoothLandmarks?: boolean
  minDetectionConfidence?: number
  minTrackingConfidence?: number
  enableSegmentation?: boolean
}

export type PoseCallback = (results: PoseResults) => void

export class PoseDetector {
  private pose: Pose | null = null
  private camera: Camera | null = null
  private callbacks: PoseCallback[] = []
  private isRunning = false

  constructor(private config: PoseDetectorConfig = {}) {
    this.initializePose()
  }

  /**
   * Initialize MediaPipe Pose
   */
  private initializePose() {
    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      },
    })

    this.pose.setOptions({
      modelComplexity: this.config.modelComplexity ?? 1,
      smoothLandmarks: this.config.smoothLandmarks ?? true,
      minDetectionConfidence: this.config.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: this.config.minTrackingConfidence ?? 0.5,
      enableSegmentation: this.config.enableSegmentation ?? false,
    })

    this.pose.onResults((results: Results) => {
      this.handleResults(results)
    })
  }

  /**
   * Start camera and pose detection
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.pose) {
      throw new Error('Pose detector not initialized')
    }

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.pose && videoElement.readyState >= 2) {
          await this.pose.send({ image: videoElement })
        }
      },
      width: 640,
      height: 480,
    })

    await this.camera.start()
    this.isRunning = true
  }

  /**
   * Stop detection
   */
  stop() {
    if (this.camera) {
      this.camera.stop()
      this.camera = null
    }
    this.isRunning = false
  }

  /**
   * Handle pose detection results
   */
  private handleResults(results: Results) {
    if (!results.poseLandmarks) {
      return
    }

    const poseResults: PoseResults = {
      landmarks: results.poseLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      })),
      timestamp: Date.now(),
    }

    // Notify all callbacks
    this.callbacks.forEach((cb) => cb(poseResults))
  }

  /**
   * Subscribe to pose results
   */
  onResults(callback: PoseCallback): () => void {
    this.callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  /**
   * Calculate angle between three landmarks
   */
  static calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs((radians * 180.0) / Math.PI)
    if (angle > 180.0) {
      angle = 360 - angle
    }
    return angle
  }

  /**
   * Calculate distance between two landmarks
   */
  static calculateDistance(a: Landmark, b: Landmark): number {
    return Math.sqrt(
      Math.pow(b.x - a.x, 2) + 
      Math.pow(b.y - a.y, 2) + 
      Math.pow(b.z - a.z, 2)
    )
  }

  /**
   * Check if pose is running
   */
  getIsRunning(): boolean {
    return this.isRunning
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PoseDetectorConfig>) {
    this.config = { ...this.config, ...config }
    if (this.pose) {
      this.pose.setOptions({
        modelComplexity: this.config.modelComplexity ?? 1,
        smoothLandmarks: this.config.smoothLandmarks ?? true,
        minDetectionConfidence: this.config.minDetectionConfidence ?? 0.5,
        minTrackingConfidence: this.config.minTrackingConfidence ?? 0.5,
        enableSegmentation: this.config.enableSegmentation ?? false,
      })
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop()
    if (this.pose) {
      this.pose.close()
      this.pose = null
    }
    this.callbacks = []
  }
}

export default PoseDetector
