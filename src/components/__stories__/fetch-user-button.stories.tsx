import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { http, HttpResponse, delay } from 'msw'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import {
  successProfileHandler,
  errorProfileHandler,
} from '@/mocks/handlers/profileHandlers'

import { FetchUserButton } from '../fetch-user-button'

const meta: Meta<typeof FetchUserButton> = {
  component: FetchUserButton,
  title: 'Components/FetchUserButton',
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof FetchUserButton>

export const Success: Story = {
  parameters: {
    msw: { handlers: [successProfileHandler] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText((content) => content.includes('Load User')),
    ).toBeInTheDocument()
  },
}

export const Error: Story = {
  parameters: {
    msw: { handlers: [errorProfileHandler] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /load user/i }))

    // Find the alert by its role first, which is more robust.
    const alert = await canvas.findByRole('alert')

    // Then, assert that the alert contains the correct error message.
    const { getByText } = within(alert)
    expect(getByText(/failed to fetch user/i)).toBeInTheDocument()
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/profile', async () => {
          await delay(1000)
          return HttpResponse.json({ firstName: 'Nathan', lastName: 'King' })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /load user/i })
    await userEvent.click(button)

    // Wait for the button to enter the loading state
    await waitFor(() => {
      expect(button).toBeDisabled()
    })

    // Check for the loading text within the button
    expect(button).toHaveTextContent(/loading.../i)
    await expect(button).toHaveAttribute('aria-busy', 'true')
  },
}
