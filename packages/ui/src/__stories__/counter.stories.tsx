import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { expect, userEvent, within } from '@storybook/test'

import { Counter } from '../counter'

const meta: Meta<typeof Counter> = {
  title: 'Components/Counter',
  tags: ['autodocs'],
  component: Counter,
}

export default meta

type Story = StoryObj<typeof Counter>

export const Default: Story = {
  render: () => <Counter />,
}

export const Incremented: Story = {
  render: () => <Counter />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const incrementButton = canvas.getByRole('button', { name: /increment/i })

    await userEvent.click(incrementButton)

    const countDisplay = await canvas.findByText('Count: 1')
    await expect(countDisplay).toBeInTheDocument()
  },
}
