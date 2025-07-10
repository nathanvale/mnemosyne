import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoggerDemo } from '../logger-demo'

describe('LoggerDemo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders the main demo interface', () => {
    render(<LoggerDemo />)

    expect(
      screen.getByRole('heading', {
        name: /BrowserLogger Interactive Demo/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Basic Logging/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Tags & Context/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Data Redaction/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Performance/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Grouping/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Dev Tracing/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Sentry Integration/i }),
    ).toBeInTheDocument()
  })

  it('shows console-only mode by default', () => {
    render(<LoggerDemo />)

    expect(
      screen.getByRole('button', { name: /Console Only/i }),
    ).toBeInTheDocument()
  })

  it('allows toggling remote logging mode', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const toggleButton = screen.getByRole('button', { name: /Console Only/i })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Remote Logging ON/i }),
      ).toBeInTheDocument()
    })
  })

  it('displays current configuration status', () => {
    render(<LoggerDemo />)

    expect(screen.getByText(/Current Configuration/i)).toBeInTheDocument()
    expect(screen.getByText(/Log Level:/i)).toBeInTheDocument()
    expect(screen.getByText(/Remote Logging:/i)).toBeInTheDocument()
    expect(screen.getByText(/Console Colors:/i)).toBeInTheDocument()
    expect(screen.getByText(/Clickable Traces:/i)).toBeInTheDocument()
  })

  it('shows captured console output area', () => {
    render(<LoggerDemo />)

    expect(screen.getByText(/Captured Console Output/i)).toBeInTheDocument()
  })

  it('allows clearing logs', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const clearButton = screen.getByRole('button', { name: /Clear Logs/i })
    await user.click(clearButton)

    // The clear functionality should work without errors
    expect(clearButton).toBeInTheDocument()
  })

  it('can trigger basic logging demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const basicLoggingButton = screen.getByRole('button', {
      name: /Basic Logging/i,
    })
    await user.click(basicLoggingButton)

    // The button should be clickable without errors
    expect(basicLoggingButton).toBeInTheDocument()
  })

  it('can trigger contextual logging demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const contextualButton = screen.getByRole('button', {
      name: /Tags & Context/i,
    })
    await user.click(contextualButton)

    // The button should be clickable without errors
    expect(contextualButton).toBeInTheDocument()
  })

  it('can trigger sensitive data redaction demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const redactionButton = screen.getByRole('button', {
      name: /Data Redaction/i,
    })
    await user.click(redactionButton)

    // The button should be clickable without errors
    expect(redactionButton).toBeInTheDocument()
  })

  it('can trigger performance monitoring demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const performanceButton = screen.getByRole('button', {
      name: /Performance/i,
    })
    await user.click(performanceButton)

    // The button should be clickable without errors
    expect(performanceButton).toBeInTheDocument()
  })

  it('can trigger console grouping demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const groupingButton = screen.getByRole('button', { name: /Grouping/i })
    await user.click(groupingButton)

    // The button should be clickable without errors
    expect(groupingButton).toBeInTheDocument()
  })

  it('can trigger dev tracing demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const devTracingButton = screen.getByRole('button', {
      name: /Dev Tracing/i,
    })
    await user.click(devTracingButton)

    // The button should be clickable without errors
    expect(devTracingButton).toBeInTheDocument()
  })

  it('can trigger sentry integration demo', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    const sentryButton = screen.getByRole('button', {
      name: /Sentry Integration/i,
    })
    await user.click(sentryButton)

    // The button should be clickable without errors
    expect(sentryButton).toBeInTheDocument()
  })

  it('shows helpful pro tips section', () => {
    render(<LoggerDemo />)

    expect(screen.getByText(/💡 Pro Tips/i)).toBeInTheDocument()
    expect(screen.getByText(/Developer Console \(F12\)/i)).toBeInTheDocument()
  })

  it('displays demo descriptions for each feature', () => {
    render(<LoggerDemo />)

    // Check that each demo button has a description
    expect(screen.getByText(/All log levels with colors/i)).toBeInTheDocument()
    expect(screen.getByText(/Structured logging/i)).toBeInTheDocument()
    expect(screen.getByText(/Secure sensitive fields/i)).toBeInTheDocument()
    expect(screen.getByText(/Marks & measurements/i)).toBeInTheDocument()
    expect(screen.getByText(/Organized output/i)).toBeInTheDocument()
    expect(screen.getByText(/Clickable source links/i)).toBeInTheDocument()
    expect(screen.getByText(/Error tracking hooks/i)).toBeInTheDocument()
  })

  it('can handle rapid interactions without errors', async () => {
    const user = userEvent.setup()
    render(<LoggerDemo />)

    // Simulate rapid clicking of different demo buttons
    const buttons = [
      screen.getByRole('button', { name: /Basic Logging/i }),
      screen.getByRole('button', { name: /Tags & Context/i }),
      screen.getByRole('button', { name: /Performance/i }),
      screen.getByRole('button', { name: /Grouping/i }),
    ]

    // Click buttons rapidly
    for (const button of buttons) {
      await user.click(button)
    }

    // Toggle remote logging
    await user.click(screen.getByRole('button', { name: /Console Only/i }))

    // All buttons should still be functional
    for (const button of buttons) {
      expect(button).toBeInTheDocument()
    }
  })
})
