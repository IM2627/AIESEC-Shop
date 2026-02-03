import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

/**
 * Check if a user is an admin
 * @param {string} userId - The user's ID from auth.users
 * @returns {Promise<boolean>} - True if user is admin
 */
export async function isUserAdmin(userId) {
  if (!userId) {
    console.log('isUserAdmin: No userId provided')
    return false
  }
  
  console.log('Checking admin status for user:', userId)
  
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    
    console.log('Admin check result:', { data, error, isAdmin: !error && data !== null })
    
    return !error && data !== null
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
