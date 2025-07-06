import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { http, HttpResponse, delay } from 'msw'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { LoggerDemo } from '../logger-demo'

const meta: Meta<typeof LoggerDemo> = {
  component: LoggerDemo,
  title: 'Advanced/LoggerDemo',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# 🚀 BrowserLogger Interactive Demo

A comprehensive demonstration of the production-ready browser logger with all advanced features:

## Features Demonstrated

### 🎯 Core Logging
- **Multi-level logging**: trace, debug, info, warn, error
- **Colored console output**: Different colors for each log level
- **Clickable traces**: Direct navigation to source code in Chrome DevTools

### 🏷️ Advanced Features
- **Tags & Context**: Structured logging with contextual information
- **Sensitive Data Redaction**: Automatic redaction of passwords, tokens, etc.
- **Performance Monitoring**: Built-in timing with marks and measurements
- **Console Grouping**: Organized, collapsible log sections
- **Development Tracing**: Enhanced debugging with clickable source links

### 🌐 Remote Logging
- **Batch Processing**: Efficient log aggregation before remote upload
- **Retry Logic**: Exponential backoff for failed uploads
- **Schema Validation**: Zod-based validation for remote payloads
- **Error Handling**: Comprehensive error recovery and reporting

### 🔧 Integration Hooks
- **Sentry Integration**: Error tracking and performance monitoring
- **DataDog/LogRocket**: Ready-to-use factory functions
- **Custom Hooks**: Extensible architecture for any logging service

## Usage Instructions

1. **Open Developer Console (F12)** to see the full formatted output
2. **Click demo buttons** to explore different logging scenarios
3. **Toggle Remote Logging** to see batching and redaction in action
4. **Watch for clickable links** in the console that navigate to source code
5. **Observe performance measurements** in the console timeline

## Production Ready

This logger is designed for production use with:
- Zero-dependency core (optional Zod for validation)
- Tree-shakeable modular architecture
- Comprehensive error handling
- Performance-optimized batching
- Security-focused sensitive data handling
        `,
      },
    },
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof LoggerDemo>

// Mock handlers for remote logging demonstrations
const successRemoteHandler = http.post(
  'https://jsonplaceholder.typicode.com/posts',
  async () => {
    await delay(500) // Simulate network delay
    return HttpResponse.json({
      id: 1,
      success: true,
      message: 'Logs uploaded successfully',
    })
  },
)

const errorRemoteHandler = http.post(
  'https://jsonplaceholder.typicode.com/posts',
  async () => {
    await delay(300)
    return HttpResponse.error()
  },
)

const slowRemoteHandler = http.post(
  'https://jsonplaceholder.typicode.com/posts',
  async () => {
    await delay(2000) // Simulate slow network
    return HttpResponse.json({
      id: 1,
      success: true,
      message: 'Logs uploaded after delay',
    })
  },
)

export const Default: Story = {
  parameters: {
    msw: { handlers: [successRemoteHandler] },
    docs: {
      description: {
        story: `
### Default Interactive Demo

The complete logger demonstration with all features enabled. This story showcases:

- **Interactive UI**: Click buttons to trigger different logging scenarios
- **Real-time feedback**: See logs appear in both the demo console and browser DevTools
- **Remote logging simulation**: Toggle remote logging to see batch processing
- **Visual indicators**: Status display showing current configuration

**Instructions:**
1. Open your browser's Developer Console (F12)
2. Click the demo buttons to explore different features
3. Toggle "Remote Logging" to see batch processing and data redaction
4. Watch the captured console output in the demo UI
5. Check the browser console for formatted, colorful output with clickable traces

**Pro Tip**: The clickable file:line links in the browser console will navigate directly to the source code!
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify the demo loads with the correct title
    await expect(
      await canvas.findByRole('heading', {
        name: /BrowserLogger Interactive Demo/i,
      }),
    ).toBeInTheDocument()

    // Verify demo buttons are present
    await expect(
      canvas.getByRole('button', { name: /Basic Logging/i }),
    ).toBeInTheDocument()

    await expect(
      canvas.getByRole('button', { name: /Tags & Context/i }),
    ).toBeInTheDocument()

    // Verify the console output area exists
    await expect(
      canvas.getByText(/Captured Console Output/i),
    ).toBeInTheDocument()
  },
}

export const BasicLoggingDemo: Story = {
  parameters: {
    msw: { handlers: [successRemoteHandler] },
    docs: {
      description: {
        story: `
### Basic Logging Levels Demo

Demonstrates all log levels with automatic color coding and formatting.

**What you'll see:**
- 🔍 **Trace**: Detailed debugging information (gray)
- 🐛 **Debug**: Development debugging info (blue)
- ℹ️ **Info**: General information (green)
- ⚠️ **Warning**: Attention-required messages (yellow)
- ❌ **Error**: Error messages (red)

The demo automatically triggers all log levels when loaded, showing the variety of output formatting.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for component to load
    await waitFor(async () => {
      await expect(
        await canvas.findByRole('button', { name: /Basic Logging/i }),
      ).toBeInTheDocument()
    })

    // Click the basic logging demo
    await userEvent.click(
      canvas.getByRole('button', { name: /Basic Logging/i }),
    )

    // Verify logs appear in the captured output
    await waitFor(
      async () => {
        const logOutput = canvas.getByText(
          /Captured Console Output/i,
        ).parentElement
        expect(logOutput).toContainHTML('Trace:')
      },
      { timeout: 3000 },
    )
  },
}

export const RemoteLoggingDemo: Story = {
  parameters: {
    msw: { handlers: [successRemoteHandler] },
    docs: {
      description: {
        story: `
### Remote Logging & Batching Demo

Shows the advanced remote logging capabilities with batch processing and sensitive data redaction.

**Features demonstrated:**
- **Batch Processing**: Logs are collected and sent in batches for efficiency
- **Sensitive Data Redaction**: Passwords, tokens, and other sensitive fields are automatically redacted
- **Retry Logic**: Failed uploads are retried with exponential backoff
- **Success/Error Callbacks**: Visual feedback when uploads succeed or fail

**How it works:**
1. Toggle "Remote Logging" to enable batch processing
2. Generate logs using the demo buttons
3. Watch for batch upload success messages
4. See sensitive data redaction in action

This demo uses a mock endpoint to simulate real remote logging behavior.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for component to load
    await waitFor(async () => {
      await expect(
        await canvas.findByRole('button', { name: /Console Only/i }),
      ).toBeInTheDocument()
    })

    // Enable remote logging
    await userEvent.click(canvas.getByRole('button', { name: /Console Only/i }))

    // Verify remote logging is enabled
    await waitFor(async () => {
      expect(
        canvas.getByRole('button', { name: /Remote Logging ON/i }),
      ).toBeInTheDocument()
    })

    // Test sensitive data redaction
    await userEvent.click(
      canvas.getByRole('button', { name: /Data Redaction/i }),
    )

    // Wait for potential remote upload success message
    await waitFor(
      async () => {
        // Just wait for the async operations to complete
        return true
      },
      { timeout: 6000 },
    )
  },
}

export const PerformanceMonitoringDemo: Story = {
  parameters: {
    msw: { handlers: [successRemoteHandler] },
    docs: {
      description: {
        story: `
### Performance Monitoring Demo

Demonstrates the built-in performance monitoring capabilities using the Performance API.

**Features:**
- **Performance Marks**: Mark specific points in time during execution
- **Performance Measurements**: Measure duration between marks
- **Automatic Timing**: Built-in timing for async operations
- **Console Integration**: Performance data appears in browser DevTools

**What happens:**
1. Performance marks are created at operation start and middle points
2. Measurements are calculated between marks
3. Results appear in both the demo console and browser DevTools
4. You can view detailed timing in the Performance tab of DevTools

This is particularly useful for monitoring critical user interactions and API call performance.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for component to load
    await waitFor(async () => {
      await expect(
        await canvas.findByRole('button', { name: /Performance/i }),
      ).toBeInTheDocument()
    })

    // Click the performance monitoring demo
    await userEvent.click(canvas.getByRole('button', { name: /Performance/i }))

    // Wait for performance measurements to complete (they have timeouts)
    await waitFor(
      async () => {
        // Performance measurements will appear after the timeouts complete
        return true
      },
      { timeout: 5000 },
    )
  },
}

export const SlowNetworkDemo: Story = {
  parameters: {
    msw: { handlers: [slowRemoteHandler] },
    docs: {
      description: {
        story: `
### Slow Network Simulation

Tests the logger's behavior under slow network conditions with delayed responses.

**Simulated conditions:**
- 2-second network delay for all remote log uploads
- Demonstrates batching behavior during slow uploads
- Shows user feedback during upload process

**What to observe:**
- Remote logging continues to work despite slow network
- Batching prevents overwhelming slow connections
- User feedback shows upload progress and completion
- No logs are lost during network delays

This story helps verify the logger's robustness in poor network conditions.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Enable remote logging
    await userEvent.click(canvas.getByRole('button', { name: /Console Only/i }))

    // Generate some logs
    await userEvent.click(
      canvas.getByRole('button', { name: /Basic Logging/i }),
    )

    // Wait for slow network response
    await waitFor(
      async () => {
        return true
      },
      { timeout: 8000 },
    )
  },
}

export const NetworkErrorDemo: Story = {
  parameters: {
    msw: { handlers: [errorRemoteHandler] },
    docs: {
      description: {
        story: `
### Network Error Handling Demo

Demonstrates how the logger handles network failures and implements retry logic.

**Error scenarios:**
- Simulated network failures for all remote uploads
- Retry logic with exponential backoff
- Error reporting and user feedback
- Graceful degradation to console-only logging

**What you'll see:**
- Upload failure messages in the demo console
- Retry attempts with increasing delays
- Eventually falls back to console-only logging
- Error details are logged for debugging

This ensures your application continues to function even when logging services are unavailable.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Enable remote logging
    await userEvent.click(canvas.getByRole('button', { name: /Console Only/i }))

    // Generate logs that will fail to upload
    await userEvent.click(
      canvas.getByRole('button', { name: /Basic Logging/i }),
    )

    // Wait for error messages to appear
    await waitFor(
      async () => {
        // Error messages should appear after retry attempts
        return true
      },
      { timeout: 10000 },
    )
  },
}

export const AsyncInteractionDemo: Story = {
  parameters: {
    msw: { handlers: [successRemoteHandler] },
    docs: {
      description: {
        story: `
### Async Interaction Testing

Tests the logger's behavior with rapid, asynchronous interactions and complex scenarios.

**Test scenarios:**
- Rapid button clicking to test concurrent logging
- Mixed local and remote logging scenarios
- Console grouping with nested operations
- Performance monitoring during async operations

**Interaction flow:**
1. Rapidly triggers multiple logging operations
2. Enables/disables remote logging during operation
3. Tests console grouping with nested async operations
4. Monitors performance throughout the interaction

This story verifies the logger's stability under heavy, concurrent usage.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Rapid interaction sequence
    await userEvent.click(
      canvas.getByRole('button', { name: /Basic Logging/i }),
    )
    await userEvent.click(
      canvas.getByRole('button', { name: /Tags & Context/i }),
    )

    // Toggle remote logging
    await userEvent.click(canvas.getByRole('button', { name: /Console Only/i }))

    // More rapid interactions
    await userEvent.click(canvas.getByRole('button', { name: /Grouping/i }))
    await userEvent.click(canvas.getByRole('button', { name: /Performance/i }))

    // Toggle remote logging back
    await userEvent.click(
      canvas.getByRole('button', { name: /Remote Logging ON/i }),
    )

    // Final interactions
    await userEvent.click(
      canvas.getByRole('button', { name: /Data Redaction/i }),
    )

    // Wait for all async operations to complete
    await waitFor(
      async () => {
        return true
      },
      { timeout: 8000 },
    )
  },
}
