import { useState, useEffect } from 'react'
import { supabase, isUserAdmin } from '../lib/supabase'

const ADMIN_CHECK_TIMEOUT_MS = 8000

export function useAuth() {
  const [state, setState] = useState({
    status: 'loading', // loading | unauthenticated | authorizing | authorized | unauthorized | error
    user: null,
    isAdmin: false,
    error: null,
  })

  useEffect(() => {
    if (!supabase) {
      setState({ status: 'error', user: null, isAdmin: false, error: new Error('Supabase not initialized') })
      return
    }

    let cancelled = false

    const setSafeState = (next) => {
      if (!cancelled) setState(next)
    }

    const runAdminCheck = async (session) => {
      if (!session?.user) {
        setSafeState({ status: 'unauthenticated', user: null, isAdmin: false, error: null })
        return
      }

      setSafeState({ status: 'authorizing', user: session.user, isAdmin: false, error: null })

      try {
        const adminPromise = isUserAdmin(session.user.id)
        const adminStatus = await Promise.race([
          adminPromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error('admin-check-timeout')), ADMIN_CHECK_TIMEOUT_MS))
        ])

        setSafeState({
          status: adminStatus ? 'authorized' : 'unauthorized',
          user: session.user,
          isAdmin: !!adminStatus,
          error: null,
        })
      } catch (err) {
        setSafeState({ status: 'error', user: session.user, isAdmin: false, error: err })
      }
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => runAdminCheck(session))
      .catch((err) => setSafeState({ status: 'error', user: null, isAdmin: false, error: err }))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      runAdminCheck(session)
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  return {
    user: state.user,
    isAdmin: state.isAdmin,
    status: state.status,
    loading: state.status === 'loading' || state.status === 'authorizing',
    error: state.error,
  }
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
