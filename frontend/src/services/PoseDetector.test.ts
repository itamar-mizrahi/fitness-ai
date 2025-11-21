import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PoseDetector } from './PoseDetector'

// Mock MediaPipe Pose
const mockOnResults = vi.fn()
const mockSetOptions = vi.fn()
const mockSend = vi.fn()
const mockClose = vi.fn()

vi.mock('@mediapipe/pose', () => {
  return {
    Pose: vi.fn().mockImplementation(() => ({
      onResults: mockOnResults,
      setOptions: mockSetOptions,
      send: mockSend,
      close: mockClose,
    })),
  }
})

// Mock MediaPipe Camera
const mockCameraStart = vi.fn()
const mockCameraStop = vi.fn()

vi.mock('@mediapipe/camera_utils', () => {
  return {
    Camera: vi.fn().mockImplementation((video, options) => {
      // Store callback to trigger it manually if needed
      if (options && options.onFrame) {
        // options.onFrame() 
      }
      return {
        start: mockCameraStart,
        stop: mockCameraStop,
      }
    }),
  }
})

describe('PoseDetector', () => {
  let detector: PoseDetector
  let mockVideo: HTMLVideoElement

  beforeEach(() => {
    vi.clearAllMocks()
    detector = new PoseDetector()
    mockVideo = {
      readyState: 2,
    } as unknown as HTMLVideoElement
  })

  afterEach(() => {
    detector.destroy()
  })

  it('should initialize Pose on construction', () => {
    expect(mockSetOptions).toHaveBeenCalled()
    expect(mockOnResults).toHaveBeenCalled()
  })

  it('should start camera and detection', async () => {
    await detector.start(mockVideo)
    expect(mockCameraStart).toHaveBeenCalled()
    expect(detector.getIsRunning()).toBe(true)
  })

  it('should stop camera and detection', async () => {
    await detector.start(mockVideo)
    detector.stop()
    expect(mockCameraStop).toHaveBeenCalled()
    expect(detector.getIsRunning()).toBe(false)
  })

  it('should update configuration', () => {
    detector.updateConfig({ modelComplexity: 2 })
    expect(mockSetOptions).toHaveBeenCalledWith(expect.objectContaining({
      modelComplexity: 2
    }))
  })

  it('should handle results and notify subscribers', () => {
    const callback = vi.fn()
    detector.onResults(callback)

    // Simulate result from MediaPipe
    // We need to get the callback passed to onResults
    const onResultsCallback = mockOnResults.mock.calls[0][0]
    
    const mockResults = {
      poseLandmarks: [
        { x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 }
      ]
    }

    onResultsCallback(mockResults)

    expect(callback).toHaveBeenCalled()
    const result = callback.mock.calls[0][0]
    expect(result.landmarks).toHaveLength(1)
    expect(result.landmarks[0].x).toBe(0.1)
  })

  it('should calculate angle correctly', () => {
    const a = { x: 1, y: 0, z: 0, visibility: 1 }
    const b = { x: 0, y: 0, z: 0, visibility: 1 }
    const c = { x: 0, y: 1, z: 0, visibility: 1 }

    const angle = PoseDetector.calculateAngle(a, b, c)
    expect(angle).toBeCloseTo(90)
  })
})
