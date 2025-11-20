import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages (will be created)
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WorkoutSession from './pages/WorkoutSession'
import TremorAnalysis from './pages/TremorAnalysis'
import PatientManagement from './pages/PatientManagement'
import Analytics from './pages/Analytics'

function App() {
    const { user, loading } = useAuthStore()

    if (loading) {
        return <div className="loading-screen">Loading...</div>
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/workout" element={user ? <WorkoutSession /> : <Navigate to="/login" />} />
                <Route path="/tremor" element={user ? <TremorAnalysis /> : <Navigate to="/login" />} />
                <Route path="/patients" element={user ? <PatientManagement /> : <Navigate to="/login" />} />
                <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />

                <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            </Routes>
        </Router>
    )
}

export default App
