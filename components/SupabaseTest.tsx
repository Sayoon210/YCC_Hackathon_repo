'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'

export default function SupabaseTest() {
    const [status, setStatus] = useState('Testing connection...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function checkConnection() {
            try {
                // Try to fetch one row from 'tasks' to check connection
                // Even if table doesn't exist, we'll get a specific error from Supabase/Postgres
                // which confirms we hit the server.
                const { error } = await supabase.from('tasks').select('*').limit(1)

                if (error) {
                    // If table doesn't exist, code is '42P01'. This still means we connected!
                    if (error.code === '42P01') {
                        setStatus('Supabase Connected! (Table "tasks" not found, but connection is good)')
                    } else {
                        throw error
                    }
                } else {
                    setStatus('Supabase Connected! (Table "tasks" found)')
                }
            } catch (e: any) {
                setError(e.message || 'Unknown error')
                setStatus('Connection Failed')
            }
        }
        checkConnection()
    }, [])

    return (
        <div className={`p-4 border rounded mb-4 ${error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <p className="font-bold">{status}</p>
            {error && <p className="text-sm mt-1">{error}</p>}
        </div>
    )
}
