'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  function handleIncrement() {
    setCount((currentCount) => currentCount + 1)
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}
