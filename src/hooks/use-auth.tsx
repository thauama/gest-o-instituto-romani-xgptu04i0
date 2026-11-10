import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface UserProfile extends RecordModel {
  email: string
  name: string
  role: 'admin' | 'equipe'
  avatar?: string
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  role: 'admin' | 'equipe'
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, pass: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    pass: string,
    name: string,
    role?: 'admin' | 'equipe',
  ) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  confirmPasswordReset: (token: string, pass: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(pb.authStore.record as UserProfile | null)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(pb.authStore.record as UserProfile | null)
    setToken(pb.authStore.token)
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((token, record) => {
      setToken(token)
      setUser(record as UserProfile | null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const role: 'admin' | 'equipe' = (user?.role as 'admin' | 'equipe') || 'admin'
  const isAdmin = role === 'admin'

  const signIn = async (email: string, pass: string) => {
    try {
      const res = await pb.collection('users').authWithPassword(email.trim(), pass)
      setUser(res.record as UserProfile)
      setToken(res.token)
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signUp = async (
    email: string,
    pass: string,
    name: string,
    userRole: 'admin' | 'equipe' = 'equipe',
  ) => {
    try {
      const rec = await pb.collection('users').create({
        email: email.trim(),
        password: pass,
        passwordConfirm: pass,
        name: name.trim(),
        role: userRole,
      })
      try {
        await pb.collection('users').requestVerification(email.trim())
      } catch {
        /* best effort */
      }
      // Log in right away
      await pb.collection('users').authWithPassword(email.trim(), pass)
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const confirmPasswordReset = async (token: string, pass: string) => {
    try {
      await pb.collection('users').confirmPasswordReset(token, pass, pass)
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        confirmPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
