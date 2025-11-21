import { useState, useEffect } from 'react'
import { MockDataService } from '../services/MockDataService'
import { RepsChart, TremorChart, QualityRadar } from '../components/DashboardCharts'
import type { ExerciseSession, TremorMeasurement, ExerciseQuality } from '../../../shared/types'
import './AnalyticsDashboard.css'
import { useAuthStore } from '../stores/authStore'
import { WorkoutService, type WorkoutSessionData } from '../services/WorkoutService'

const AnalyticsDashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'tremor' | 'quality'>('overview')
    const [sessions, setSessions] = useState<ExerciseSession[]>([])
    const [tremorData, setTremorData] = useState<TremorMeasurement[]>([])
    const [qualityData, setQualityData] = useState<ExerciseQuality | null>(null)

    // ... (inside component)
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    setLoading(true)
                    const userSessions = await WorkoutService.getUserSessions(user.id)

                    const formattedSessions: ExerciseSession[] = userSessions.map((s: WorkoutSessionData & { id: string }) => ({
                        id: s.id,
                        userId: s.userId,
                        exerciseType: s.exerciseType as any,
                        startTime: new Date(s.timestamp),
                        endTime: new Date(s.timestamp + (s.duration * 1000)),
                        reps: s.reps,
                        quality_score: s.accuracy
                    }))

                    setSessions(formattedSessions)

                    // Keep mock data for tremor/quality for now as we don't save them yet
                    setTremorData(MockDataService.getTremorHistory())
                    setQualityData(MockDataService.getCurrentQuality())
                } catch (error) {
                    console.error('Error loading analytics:', error)
                } finally {
                    setLoading(false)
                }
            } else {
                // Fallback to mock data if not logged in
                setSessions(MockDataService.getWorkoutHistory())
                setTremorData(MockDataService.getTremorHistory())
                setQualityData(MockDataService.getCurrentQuality())
                setLoading(false)
            }
        }

        loadData()
    }, [user])

    const totalReps = sessions.reduce((acc, curr) => acc + curr.reps, 0)
    const avgQuality = Math.round(
        sessions.reduce((acc, curr) => acc + (curr.quality_score || 0), 0) / sessions.length || 0
    )

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <h1>📊 לוח בקרה וניתוח נתונים</h1>
                <p>מעקב אחר התקדמות שיקום, רעד ואיכות ביצוע</p>
            </header>

            <div className="dashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    סקירה כללית
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tremor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tremor')}
                >
                    ניתוח רעד
                </button>
                <button
                    className={`tab-btn ${activeTab === 'quality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quality')}
                >
                    איכות תנועה
                </button>
            </div>

            <div className="dashboard-content">
                {activeTab === 'overview' && (
                    <>
                        <div className="summary-cards">
                            <div className="summary-card">
                                <h3>סה"כ אימונים (30 יום)</h3>
                                <div className="value">{sessions.length}</div>
                                <div className="trend positive">↑ 12% מהחודש שעבר</div>
                            </div>
                            <div className="summary-card">
                                <h3>סה"כ חזרות</h3>
                                <div className="value">{totalReps}</div>
                            </div>
                            <div className="summary-card">
                                <h3>ציון איכות ממוצע</h3>
                                <div className="value">{avgQuality}</div>
                                <div className="trend positive">↑ 5% שיפור</div>
                            </div>
                        </div>
                        <div className="chart-card">
                            <RepsChart sessions={sessions} />
                        </div>
                    </>
                )}

                {activeTab === 'tremor' && (
                    <div className="chart-grid">
                        <div className="chart-card">
                            <TremorChart measurements={tremorData} />
                        </div>
                        <div className="summary-card">
                            <h3>סטטוס רעד נוכחי</h3>
                            <div className="value">
                                {tremorData[tremorData.length - 1]?.severity === 'mild' ? 'קל' : 'בינוני'}
                            </div>
                            <p>נצפתה ירידה בעוצמת הרעד ב-30 הימים האחרונים.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'quality' && qualityData && (
                    <div className="chart-grid">
                        <div className="chart-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <QualityRadar quality={qualityData} />
                        </div>
                        <div className="summary-cards">
                            <div className="summary-card">
                                <h3>יציבות</h3>
                                <div className="value">{qualityData.stability}%</div>
                            </div>
                            <div className="summary-card">
                                <h3>סימטריה</h3>
                                <div className="value">{qualityData.symmetry}%</div>
                            </div>
                            <div className="summary-card">
                                <h3>טווח תנועה</h3>
                                <div className="value">{qualityData.rangeOfMotion}%</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AnalyticsDashboard
