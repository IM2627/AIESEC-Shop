import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          setUser(null)
          setIsAdmin(false)
          return
        }

        if (session?.user) {
          console.log('✅ User session found:', session.user.email)
          setUser(session.user)
          
          // Check if user is admin by querying your admins table or checking email
          const isAdminUser = session.user.email === 'informationmanagementun26.27@gmail.com'
          setIsAdmin(isAdminUser)
          console.log('🔐 Is admin:', isAdminUser)
        } else {
          console.log('❌ No active session')
          setUser(null)
          setIsAdmin(false)
        }
      } catch (err) {
        console.error('❌ Session check failed:', err)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)
        
        if (session?.user) {
          setUser(session.user)
          const isAdminUser = session.user.email === 'informationmanagementun26.27@gmail.com'
          setIsAdmin(isAdminUser)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return { user, isAdmin, loading }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return data
}
