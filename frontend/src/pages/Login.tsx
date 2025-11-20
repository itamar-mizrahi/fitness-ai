import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import './Login.css'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login, register, error } = useAuthStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Try to login first
            await login(email, password)
        } catch (err: any) {
            // If user not found, try to register
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                try {
                    await register(email, password)
                } catch (regError) {
                    console.error('Registration error:', regError)
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>🏋️‍♂️ מערכת שיקום AI</h1>
                <p className="subtitle">התחברות למערכת</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">אימייל</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="הכנס אימייל"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">סיסמה</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="הכנס סיסמה"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'מתחבר...' : 'התחבר / הרשם'}
                    </button>
                </form>

                <p className="info-text">
                    משתמש חדש? המערכת תיצור לך חשבון אוטומטית
                </p>
            </div>
        </div>
    )
}

export default Login
