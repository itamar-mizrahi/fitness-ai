import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDzgdcJASKzZz9azdNrmrJz3MWhlBcdvyg",
  authDomain: "fitness-auth-54d4d.firebaseapp.com",
  projectId: "fitness-auth-54d4d",
  storageBucket: "fitness-auth-54d4d.firebasestorage.app",
  messagingSenderId: "355871344430",
  appId: "1:355871344430:web:3cedacd33df478bf665cbf",
  measurementId: "G-QXP15SPSHC",
}

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
