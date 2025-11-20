import { useState, useEffect, useRef } from 'react'
import { PoseDetector } from '../services/PoseDetector'
import { TremorDetector } from '../services/TremorDetector'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { POSE_CONNECTIONS } from '@mediapipe/pose'
import type { TremorMeasurement } from '../../../shared/types'
import './TremorAnalysis.css'

const TremorAnalysis = () => {
    const [isActive, setIsActive] = useState(false)
    const [selectedBodyPart, setSelectedBodyPart] = useState<
        'hand_left' | 'hand_right' | 'head' | 'leg_left' | 'leg_right'
    >('hand_right')
    const [currentMeasurement, setCurrentMeasurement] = useState<TremorMeasurement | null>(null)
    const [measurements, setMeasurements] = useState<TremorMeasurement[]>([])
    const [bufferProgress, setBufferProgress] = useState(0)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const poseDetectorRef = useRef<PoseDetector | null>(null)
    const tremorDetectorRef = useRef<TremorDetector | null>(null)

    useEffect(() => {
        // Initialize detectors
        poseDetectorRef.current = new PoseDetector({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        })

        tremorDetectorRef.current = new TremorDetector({
            windowSize: 90, // 3 seconds at 30fps
            minAmplitudeThreshold: 2,
            samplingRate: 30,
        })

        return () => {
            poseDetectorRef.current?.destroy()
        }
    }, [])

    const startAnalysis = async () => {
        if (!videoRef.current || !poseDetectorRef.current) return

        try {
            await poseDetectorRef.current.start(videoRef.current)

            // Subscribe to pose results
            poseDetectorRef.current.onResults((results) => {
                // Draw on canvas
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        ctx.save()
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

                        // Draw video frame
                        ctx.drawImage(
                            videoRef.current!,
                            0,
                            0,
                            canvasRef.current.width,
                            canvasRef.current.height
                        )

                        // Draw pose landmarks
                        if (results.landmarks.length > 0) {
                            const landmarksForDrawing = results.landmarks.map((lm) => ({
                                x: lm.x,
                                y: lm.y,
                                z: lm.z,
                                visibility: lm.visibility,
                            }))

                            drawConnectors(ctx, landmarksForDrawing, POSE_CONNECTIONS, {
                                color: '#00FF00',
                                lineWidth: 2,
                            })
                            drawLandmarks(ctx, landmarksForDrawing, {
                                color: '#FF0000',
                                lineWidth: 1,
                                radius: 3,
                            })

                            // Highlight selected body part
                            highlightBodyPart(ctx, landmarksForDrawing, selectedBodyPart)
                        }

                        ctx.restore()
                    }
                }

                // Add to tremor detector
                if (tremorDetectorRef.current) {
                    tremorDetectorRef.current.addFrame(results.landmarks, results.timestamp)

                    // Update buffer progress
                    const progress =
                        (tremorDetectorRef.current.getBufferSize() / 90) * 100
                    setBufferProgress(Math.min(progress, 100))

                    // Analyze tremor when ready
                    if (tremorDetectorRef.current.isReady()) {
                        const measurement = tremorDetectorRef.current.analyzeTremor(
                            selectedBodyPart,
                            'current-user' // Replace with actual user ID
                        )

                        if (measurement) {
                            setCurrentMeasurement(measurement)
                        }
                    }
                }
            })

            setIsActive(true)
        } catch (error) {
            console.error('Failed to start analysis:', error)
            alert('שגיאה בהפעלת המצלמה')
        }
    }

    const stopAnalysis = () => {
        poseDetectorRef.current?.stop()
        setIsActive(false)
        setBufferProgress(0)
    }

    const saveMeasurement = () => {
        if (currentMeasurement) {
            setMeasurements((prev) => [...prev, currentMeasurement])
            alert('✅ המדידה נשמרה בהצלחה!')

            // Reset tremor detector for new measurement
            tremorDetectorRef.current?.reset()
            setCurrentMeasurement(null)
            setBufferProgress(0)
        }
    }

    const highlightBodyPart = (
        ctx: CanvasRenderingContext2D,
        landmarks: any[],
        bodyPart: string
    ) => {
        const indices: Record<string, number[]> = {
            hand_left: [15],
            hand_right: [16],
            head: [0, 7, 8],
            leg_left: [27],
            leg_right: [28],
        }

        const landmarkIndices = indices[bodyPart] || []

        ctx.fillStyle = 'rgba(255, 255, 0, 0.6)'
        landmarkIndices.forEach((idx) => {
            const lm = landmarks[idx]
            if (lm && lm.visibility > 0.5) {
                ctx.beginPath()
                ctx.arc(lm.x * 640, lm.y * 480, 10, 0, 2 * Math.PI)
                ctx.fill()
            }
        })
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'mild':
                return '#10b981' // green
            case 'moderate':
                return '#f59e0b' // orange
            case 'severe':
                return '#ef4444' // red
            default:
                return '#6b7280' // gray
        }
    }

    const getSeverityText = (severity: string) => {
        switch (severity) {
            case 'mild':
                return 'קל'
            case 'moderate':
                return 'בינוני'
            case 'severe':
                return 'חמור'
            default:
                return 'לא ידוע'
        }
    }

    return (
        <div className="tremor-analysis-container">
            <header className="tremor-header">
                <h1>🧠 ניתוח רעידות</h1>
                <p>מערכת לזיהוי וכימות רעידות לניטור פרקינסון ומצבים נוירולוגיים</p>
            </header>

            <div className="tremor-content">
                {/* Video Section */}
                <div className="video-section">
                    <div className="video-container">
                        <video
                            ref={videoRef}
                            style={{ display: 'none' }}
                            autoPlay
                            playsInline
                        />
                        <canvas ref={canvasRef} width={640} height={480} />

                        {/* Buffer Progress */}
                        {isActive && bufferProgress < 100 && (
                            <div className="buffer-overlay">
                                <div className="buffer-message">
                                    <div>מאסף נתונים...</div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${bufferProgress}%` }}
                                        />
                                    </div>
                                    <div>{Math.round(bufferProgress)}%</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="controls">
                        <div className="control-group">
                            <label>איבר לניתוח:</label>
                            <select
                                value={selectedBodyPart}
                                onChange={(e) =>
                                    setSelectedBodyPart(
                                        e.target.value as typeof selectedBodyPart
                                    )
                                }
                                disabled={isActive}
                            >
                                <option value="hand_right">יד ימין</option>
                                <option value="hand_left">יד שמאל</option>
                                <option value="head">ראש</option>
                                <option value="leg_right">רגל ימין</option>
                                <option value="leg_left">רגל שמאל</option>
                            </select>
                        </div>

                        <div className="control-buttons">
                            {!isActive ? (
                                <button onClick={startAnalysis} className="btn btn-primary">
                                    🎥 התחל ניתוח
                                </button>
                            ) : (
                                <button onClick={stopAnalysis} className="btn btn-secondary">
                                    ⏸️ עצור
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="results-section">
                    <h2>תוצאות נוכחיות</h2>

                    {currentMeasurement ? (
                        <div className="measurement-card">
                            <div className="measurement-header">
                                <span className="body-part-label">
                                    {
                                        {
                                            hand_right: '✋ יד ימין',
                                            hand_left: '✋ יד שמאל',
                                            head: '🧠 ראש',
                                            leg_right: '🦵 רגל ימין',
                                            leg_left: '🦵 רגל שמאל',
                                        }[currentMeasurement.bodyPart]
                                    }
                                </span>
                                <span
                                    className="severity-badge"
                                    style={{
                                        background: getSeverityColor(currentMeasurement.severity),
                                    }}
                                >
                                    {getSeverityText(currentMeasurement.severity)}
                                </span>
                            </div>

                            <div className="metrics-grid">
                                <div className="metric">
                                    <div className="metric-label">אמפליטודה</div>
                                    <div className="metric-value">
                                        {currentMeasurement.amplitude.toFixed(2)} px
                                    </div>
                                </div>

                                <div className="metric">
                                    <div className="metric-label">תדירות</div>
                                    <div className="metric-value">
                                        {currentMeasurement.frequency.toFixed(2)} Hz
                                    </div>
                                </div>

                                <div className="metric">
                                    <div className="metric-label">משך</div>
                                    <div className="metric-value">
                                        {currentMeasurement.duration.toFixed(1)} שניות
                                    </div>
                                </div>

                                <div className="metric">
                                    <div className="metric-label">UPDRS Score</div>
                                    <div className="metric-value">
                                        {currentMeasurement.updrsScore}/4
                                    </div>
                                </div>
                            </div>

                            <button onClick={saveMeasurement} className="btn btn-success">
                                💾 שמור מדידה
                            </button>
                        </div>
                    ) : (
                        <div className="no-data">
                            {isActive
                                ? 'ממתין למספיק נתונים לניתוח...'
                                : 'התחל ניתוח כדי לראות תוצאות'}
                        </div>
                    )}

                    {/* Saved Measurements */}
                    {measurements.length > 0 && (
                        <div className="saved-measurements">
                            <h3>מדידות שמורות ({measurements.length})</h3>
                            <div className="measurements-list">
                                {measurements.map((m, idx) => (
                                    <div key={idx} className="measurement-item">
                                        <div className="measurement-info">
                                            <span>
                                                {
                                                    {
                                                        hand_right: '✋ ימין',
                                                        hand_left: '✋ שמאל',
                                                        head: '🧠 ראש',
                                                        leg_right: '🦵 ימין',
                                                        leg_left: '🦵 שמאל',
                                                    }[m.bodyPart]
                                                }
                                            </span>
                                            <span>{m.amplitude.toFixed(1)} px</span>
                                            <span>{m.frequency.toFixed(1)} Hz</span>
                                            <span
                                                style={{
                                                    color: getSeverityColor(m.severity),
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {getSeverityText(m.severity)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TremorAnalysis
