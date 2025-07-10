// src/mocks/handlers/profileHandlers.ts
import { http, HttpResponse } from 'msw'

export const successProfileHandler = http.get('/profile', () =>
  HttpResponse.json({ firstName: 'Melanie', lastName: 'Queen' }),
)

export const errorProfileHandler = http.get(
  '/profile',
  () => new HttpResponse(null, { status: 404 }),
)

// Optional factory
export const createProfileHandler = (response: unknown, status = 200) =>
  http.get(
    '/profile',
    () =>
      new HttpResponse(JSON.stringify(response), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
