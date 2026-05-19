import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  isAuthenticated: boolean
  userName: string
  userEmail: string
  signIn: (email: string, name?: string) => void
  signOut: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userName: '',
      userEmail: '',
      signIn: (email, name) => set({
        isAuthenticated: true,
        userEmail: email,
        userName: name ?? email.split('@')[0],
      }),
      signOut: () => set({ isAuthenticated: false, userName: '', userEmail: '' }),
    }),
    { name: 'acme-auth' }
  )
)
