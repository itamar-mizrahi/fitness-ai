import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'

const DashboardPlaceholder = () => {
    const { user, logout } = useAuthStore()

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>📊 דשבורד</h1>
                    <button onClick={logout} className="btn btn-secondary">יציאה</button>
                </div>

                <p style={{ marginBottom: '1rem' }}>שלום, {user?.email}!</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div className="card">
                        <h3>🏋️ אימונים</h3>
                        <p>מעקב אחר האימונים שלך</p>
                        <Link to="/workout" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            התחל אימון
                        </Link>
                    </div>

                    <div className="card">
                        <h3>🧠 ניתוח רעידות</h3>
                        <p>ניטור רעידות ופרקינסון</p>
                        <Link to="/tremor" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            התחל ניתוח
                        </Link>
                    </div>

                    <div className="card">
                        <h3>📈 סטטיסטיקות</h3>
                        <p>צפייה בהתקדמות</p>
                        <Link to="/analytics" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            צפה בנתונים
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardPlaceholder
