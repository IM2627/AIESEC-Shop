import { useState, useEffect } from 'react'
import { supabase, isUserAdmin } from '../lib/supabase'

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
          setUser(null)
          setIsAdmin(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          const adminStatus = await isUserAdmin(session.user.id)
          setIsAdmin(adminStatus)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (err) {
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
        try {
          if (session?.user) {
            setUser(session.user)
            const adminStatus = await isUserAdmin(session.user.id)
            setIsAdmin(adminStatus)
          } else {
            setUser(null)
            setIsAdmin(false)
          }
        } catch (err) {
          setUser(null)
          setIsAdmin(false)
        } finally {
          setLoading(false)
        }
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
