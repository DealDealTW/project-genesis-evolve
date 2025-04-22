import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ckyrwfpdsnnhblvwcksr.supabase.co'
// Make sure to use the environment variable in a real application for security
// const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY 
// For now, using the provided key directly:
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreXJ3ZnBkc25uaGJsdndja3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MDQ0NDUsImV4cCI6MjA2MDI4MDQ0NX0.wPOujPcI3rEEkBkr-GJrsLgHfA2tdsYQJxxynM3T4AU'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseKey) 