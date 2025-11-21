import { useState, useEffect, useRef } from 'react'
import { PoseDetector } from '../services/PoseDetector'
import { ExerciseCounter } from '../services/ExerciseCounter'
import FormAnalyzer, { type FormFeedback } from '../services/FormAnalyzer'
import { AudioFeedback } from '../services/AudioFeedback'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { POSE_CONNECTIONS } from '@mediapipe/pose'
import { ExerciseType } from '../../../shared/types'
import './WorkoutSession.css'

const WorkoutSession = () => {
    const [isActive, setIsActive] = useState(false)
    const [selectedExercise, setSelectedExercise] = useState<ExerciseType>(ExerciseType.BICEP_CURL)
    const [reps, setReps] = useState(0)
    const [sets, setSets] = useState(0)
    const [currentSet, setCurrentSet] = useState(1)
    const [feedback, setFeedback] = useState('מוכן להתחיל?')
    const [angle, setAngle] = useState<number | undefined>()
    const [error, setError] = useState<string | null>(null)
    const [cameraReady, setCameraReady] = useState(false)
    const [clinicalMode, setClinicalMode] = useState(false)
    const [formFeedback, setFormFeedback] = useState<FormFeedback | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const poseDetectorRef = useRef<PoseDetector | null>(null)
    const exerciseCounterRef = useRef<ExerciseCounter | null>(null)
    const formAnalyzerRef = useRef<FormAnalyzer | null>(null)
    const audioFeedbackRef = useRef<AudioFeedback | null>(null)

    useEffect(() => {
        // Initialize detectors
        poseDetectorRef.current = new PoseDetector({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
        })

        exerciseCounterRef.current = new ExerciseCounter()
        formAnalyzerRef.current = new FormAnalyzer()
        audioFeedbackRef.current = new AudioFeedback()

        return () => {
            stopWorkout()
            poseDetectorRef.current?.destroy()
        }
    }, [])

    const startWorkout = async () => {
        if (!videoRef.current || !poseDetectorRef.current || !exerciseCounterRef.current) return

        try {
            setError(null)
            setCameraReady(false)

            // Reset counter for new workout
            exerciseCounterRef.current.reset()
            setReps(0)
            setFeedback('מוכן להתחיל!')
            audioFeedbackRef.current?.speak('מתחילים אימון, בהצלחה!', 'low')

            // Start pose detector
            await poseDetectorRef.current.start(videoRef.current)
            setCameraReady(true)

            // Subscribe to pose results
            poseDetectorRef.current.onResults((results) => {
                // Draw on canvas
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        ctx.save()
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

                        // Draw video frame
                        if (videoRef.current) {
                            ctx.drawImage(
                                videoRef.current,
                                0,
                                0,
                                canvasRef.current.width,
                                canvasRef.current.height
                            )
                        }

                        // Draw pose landmarks
                        if (results.landmarks.length > 0) {
                            const landmarksForDrawing = results.landmarks.map((lm: any) => ({
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
                        }

                        ctx.restore()
                    }
                }

                // Process exercise
                if (exerciseCounterRef.current && formAnalyzerRef.current) {
                    // 1. Analyze Form
                    const formResult = formAnalyzerRef.current.analyze(
                        results.landmarks,
                        selectedExercise
                    )
                    setFormFeedback(formResult)

                    if (formResult && !formResult.isValid) {
                        // Speak correction if urgent
                        if (formResult.severity === 'danger' || formResult.severity === 'warning') {
                            audioFeedbackRef.current?.speak(formResult.correction || formResult.message, 'high')
                        }
                    }

                    // 2. Count Reps
                    const result = exerciseCounterRef.current.processFrame(
                        results.landmarks,
                        selectedExercise
                    )

                    // Only count if form is valid (in clinical mode)
                    if (!clinicalMode || (formResult?.isValid ?? true)) {
                        if (result.count > reps) {
                            audioFeedbackRef.current?.speak(result.count.toString(), 'low')
                        }
                        setReps(result.count)
                    }

                    setFeedback(result.feedback || '')
                    setAngle(result.angle)
                }
            })

            setIsActive(true)
        } catch (error: any) {
            console.error('Failed to start workout:', error)
            let errorMessage = 'שגיאה בהפעלת המצלמה'

            if (error.name === 'NotAllowedError') {
                errorMessage = 'יש לאפשר גישה למצלמה כדי להשתמש בכלי זה'
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'לא נמצאה מצלמה במכשיר'
            } else if (error.message) {
                errorMessage = error.message
            }

            setError(errorMessage)
        }
    }

    const stopWorkout = () => {
        poseDetectorRef.current?.stop()
        setIsActive(false)
        setCameraReady(false)
        audioFeedbackRef.current?.speak('אימון נעצר', 'low')
    }

    const finishSet = () => {
        if (reps > 0) {
            setSets(sets + 1)
            setCurrentSet(currentSet + 1)
            exerciseCounterRef.current?.reset()
            setReps(0)
            setFeedback(`סט ${currentSet} הושלם! מוכן לסט הבא?`)
            audioFeedbackRef.current?.speak(`כל הכבוד! סיימת את הסט ה-${currentSet}`, 'low')
        }
    }

    const saveWorkout = () => {
        const workoutData = {
            exercise: selectedExercise,
            sets: sets,
            totalReps: reps,
            date: new Date().toISOString(),
            clinicalMode: clinicalMode
        }

        console.log('Saving workout:', workoutData)
        // TODO: Save to backend
        alert(`✅ האימון נשמר!\n${sets} סטים, סה"כ חזרות: ${reps}`)
    }

    const getExerciseName = (exercise: ExerciseType): string => {
        const names: Record<ExerciseType, string> = {
            bicep_curl: '🏋️ ביצפס',
            squat: '🦵 כפיפות ברכיים',
            shoulder_press: '💪 לחיצת כתפיים',
            leg_raise: '🦿 הרמת רגליים',
            seated_exercises: '🪑 תרגילי ישיבה',
        }
        return names[exercise]
    }

    return (
        <div className="workout-session-container">
            <header className="workout-header">
                <h1>🏋️ סשן אימון</h1>
                <p>ספירת חזרות אוטומטית עם ניתוח תנוחה</p>
            </header>

            <div className="workout-content">
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

                        {/* Rep Counter Overlay */}
                        {isActive && (
                            <div className="counter-overlay">
                                <div className="rep-count">{reps}</div>
                                <div className="rep-label">חזרות</div>
                                {angle !== undefined && (
                                    <div className="angle-display">{angle}°</div>
                                )}
                            </div>
                        )}

                        {/* Feedback Overlay */}
                        {isActive && feedback && (
                            <div className="feedback-overlay">
                                {feedback}
                            </div>
                        )}

                        {/* Form Feedback Overlay */}
                        {isActive && formFeedback && !formFeedback.isValid && (
                            <div className={`form-feedback-overlay ${formFeedback.severity}`}>
                                ⚠️ {formFeedback.message}
                                {formFeedback.correction && (
                                    <div className="correction">{formFeedback.correction}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="error-banner">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Camera Status */}
                    {isActive && cameraReady && (
                        <div className="camera-status">
                            <span className="status-dot"></span>
                            <span>מצלמה פעילה</span>
                            {clinicalMode && <span className="clinical-badge">🔬 מצב מחקר</span>}
                        </div>
                    )}

                    {/* Controls */}
                    <div className="controls">
                        <div className="control-group">
                            <label>תרגיל:</label>
                            <select
                                value={selectedExercise}
                                onChange={(e) => setSelectedExercise(e.target.value as ExerciseType)}
                                disabled={isActive}
                            >
                                <option value={ExerciseType.BICEP_CURL}>🏋️ ביצפס</option>
                                <option value={ExerciseType.SQUAT}>🦵 כפיפות ברכיים</option>
                                <option value={ExerciseType.SHOULDER_PRESS}>💪 לחיצת כתפיים</option>
                            </select>
                        </div>

                        <div className="control-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={clinicalMode}
                                    onChange={(e) => setClinicalMode(e.target.checked)}
                                    disabled={isActive}
                                />
                                מצב מחקר (Clinical Mode)
                            </label>
                        </div>

                        <div className="control-buttons">
                            {!isActive ? (
                                <button onClick={startWorkout} className="btn btn-primary">
                                    🎥 התחל אימון
                                </button>
                            ) : (
                                <>
                                    <button onClick={finishSet} className="btn btn-success">
                                        ✅ סיים סט
                                    </button>
                                    <button onClick={stopWorkout} className="btn btn-secondary">
                                        ⏸️ עצור
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="stats-section">
                    <h2>סטטיסטיקות</h2>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🏋️</div>
                            <div className="stat-value">{getExerciseName(selectedExercise)}</div>
                            <div className="stat-label">תרגיל נוכחי</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">🔢</div>
                            <div className="stat-value">{reps}</div>
                            <div className="stat-label">חזרות בסט</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-value">{sets}</div>
                            <div className="stat-label">סטים שהושלמו</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">💯</div>
                            <div className="stat-value">{currentSet}</div>
                            <div className="stat-label">סט נוכחי</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            onClick={saveWorkout}
                            className="btn btn-success"
                            disabled={sets === 0 && reps === 0}
                        >
                            💾 שמור אימון
                        </button>
                        <button
                            onClick={() => {
                                exerciseCounterRef.current?.reset()
                                setReps(0)
                                setSets(0)
                                setCurrentSet(1)
                                setFeedback('מוכן להתחיל?')
                            }}
                            className="btn btn-secondary"
                            disabled={isActive}
                        >
                            🔄 אפס
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="instructions">
                        <h3>📝 הוראות</h3>
                        <ul>
                            <li>בחר תרגיל מהרשימה</li>
                            <li>סמן "מצב מחקר" אם ברצונך להקפיד על טכניקה מושלמת</li>
                            <li>לחץ "התחל אימון" והרשה גישה למצלמה</li>
                            <li>עמוד מול המצלמה כך שכל הגוף נראה</li>
                            <li>בצע את התרגיל - המערכת תספור ותיתן משוב קולי!</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkoutSession
