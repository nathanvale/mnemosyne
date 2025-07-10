import { handlers } from '@studio/mocks'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'

import { FetchUserButton } from '../fetch-user-button'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('loads and shows profile after click', async () => {
  render(<FetchUserButton />)

  const btn = screen.getByRole('button', { name: /load user profile/i })
  await userEvent.click(btn)

  expect(await screen.findByText(/melanie queen/i)).toBeInTheDocument()
})
