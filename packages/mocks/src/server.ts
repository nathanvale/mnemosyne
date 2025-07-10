// src/mocks/server.ts
import { setupServer } from 'msw/node'

import { successProfileHandler } from './handlers/profileHandlers'

export const server = setupServer(successProfileHandler)
