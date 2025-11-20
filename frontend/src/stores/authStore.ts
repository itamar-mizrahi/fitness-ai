import { create } from 'zustand'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { User, UserRole } from '../../../shared/types'

interface AuthState {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ error: null })
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  register: async (email: string, password: string) => {
    try {
      set({ error: null })
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  logout: async () => {
    try {
      await signOut(auth)
      set({ user: null, firebaseUser: null })
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  setUser: (user: User | null) => {
    set({ user, loading: false })
  },
  
  setLoading: (loading: boolean) => {
    set({ loading })
  },
}))

// Initialize auth listener
export const initAuthListener = () => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: UserRole.PATIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      useAuthStore.getState().setUser(user)
    } else {
      useAuthStore.getState().setUser(null)
    }
  })
}
