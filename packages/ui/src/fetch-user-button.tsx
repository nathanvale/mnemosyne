'use client'

import axios from 'axios'
import { useState } from 'react'

type User = {
  firstName: string
  lastName: string
}

export function FetchUserButton() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadUser = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await axios.get('/profile')
      setUser(res.data)
    } catch {
      setError('Failed to fetch user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={loadUser}
        disabled={isLoading}
        aria-label="Load user profile"
        aria-busy={isLoading}
      >
        {isLoading ? 'Loading...' : 'Load User'}
      </button>
      {user && (
        <div role="status" aria-live="polite" aria-atomic="true">
          <p id="user-info">
            User: {user.firstName} {user.lastName}
          </p>
        </div>
      )}
      {error && (
        <div role="alert" aria-live="assertive" aria-atomic="true">
          <p id="error-message">{error}</p>
        </div>
      )}
    </div>
  )
}
