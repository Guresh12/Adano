import { createClient } from '@supabase/supabase-js'

const url = 'https://uylbvvsnmbdonourgijf.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bGJ2dnNubWJkb25vdXJnaWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjY0MTQsImV4cCI6MjA4NTgwMjQxNH0.hME5Jan8fMXZFc4zLE35e2ZRZgqFKxMbCIqSadgUuKk'

console.log('--- DIAGNOSTIC START ---')
console.log('Testing connection to:', url)

const supabase = createClient(url, key, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
})

async function test() {
    try {
        // Try a simple health check by selecting from a public table or just ensuring the client initializes
        // Since profiles has RLS, this might return 0 rows or an error, but "Failed to fetch" means NO connection.
        const { data, error, status, statusText } = await supabase.from('profiles').select('count', { count: 'exact', head: true })

        console.log('Status:', status, statusText)

        if (error) {
            console.log('Supabase API responded with error (This implies NETWORK IS OK):')
            console.log('Code:', error.code)
            console.log('Message:', error.message)
            // Code 'PGRST116' (JSON object requested, multiple (or no) rows returned) or permission denied is fine.
            // It means we REACHED the server.
        } else {
            console.log('Success! Connected and query executed.')
        }

    } catch (e) {
        console.error('CRITICAL NETWORK ERROR:', e)
    }
    console.log('--- DIAGNOSTIC END ---')
}

test()
