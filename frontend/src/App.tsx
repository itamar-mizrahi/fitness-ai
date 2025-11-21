import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, initAuthListener } from './stores/authStore'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/DashboardPlaceholder'
import WorkoutSession from './pages/WorkoutSession'
import TremorAnalysis from './pages/TremorAnalysis'
import PatientManagement from './pages/PatientManagementPlaceholder'
import AnalyticsDashboard from './pages/AnalyticsDashboard'

function App() {
    const { user, loading } = useAuthStore()

    useEffect(() => {
        // Initialize Firebase auth listener
        initAuthListener()
    }, [])

    if (loading) {
        return <div className="loading-screen">Loading...</div>
    }

    return (
        <Router basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/workout" element={user ? <WorkoutSession /> : <Navigate to="/login" />} />
                <Route path="/tremor" element={user ? <TremorAnalysis /> : <Navigate to="/login" />} />
                <Route path="/patients" element={user ? <PatientManagement /> : <Navigate to="/login" />} />
                <Route path="/analytics" element={user ? <AnalyticsDashboard /> : <Navigate to="/login" />} />

                <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            </Routes>
        </Router>
    )
}

export default App
