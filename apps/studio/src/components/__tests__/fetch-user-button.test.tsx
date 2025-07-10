// tests/components/fetch-user-button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FetchUserButton } from '../fetch-user-button'
it('loads and shows profile after click', async () => {
  render(<FetchUserButton />)

  const btn = screen.getByRole('button', { name: /load user profile/i })
  await userEvent.click(btn)

  expect(await screen.findByText(/melanie queen/i)).toBeInTheDocument()
})
