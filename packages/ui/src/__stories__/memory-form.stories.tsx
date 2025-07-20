import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ValidationResult } from '@studio/schema'

import { fn } from '@storybook/test'
import { useState } from 'react'

import {
  MemoryForm,
  ValidationDisplay,
  type MemoryFormData,
} from '../memory-form'

const meta: Meta<typeof MemoryForm> = {
  title: 'Components/MemoryForm',
  component: MemoryForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Memory form component with real-time schema validation',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the form is disabled',
    },
  },
  args: {
    onSubmit: fn(),
    onValidationChange: fn(),
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default story
export const Default: Story = {
  args: {},
}

// Pre-filled form
export const PreFilled: Story = {
  args: {
    initialData: {
      id: 'memory-2025-001',
      content: 'Had a great conversation about React patterns with the team',
      timestamp: '2025-01-15T14:30',
      author: {
        id: 'user-123',
        name: 'John Doe',
        role: 'developer',
      },
      participants: [
        { id: 'user-123', name: 'John Doe', role: 'developer' },
        { id: 'user-456', name: 'Jane Smith', role: 'designer' },
      ],
      tags: ['react', 'team-meeting', 'patterns'],
    },
  },
}

// Disabled form
export const Disabled: Story = {
  args: {
    disabled: true,
    initialData: {
      id: 'memory-readonly',
      content: 'This form is disabled for demonstration',
      timestamp: '2025-01-15T14:30',
      author: {
        id: 'user-readonly',
        name: 'Read Only User',
        role: 'viewer',
      },
      tags: ['readonly', 'disabled'],
    },
  },
}

// Interactive story with validation display
export const WithValidationDisplay: Story = {
  render: (args) => {
    const [validationState, setValidationState] =
      useState<ValidationResult | null>(null)
    const [submittedData, setSubmittedData] = useState<MemoryFormData | null>(
      null,
    )
    const [validationResult, setValidationResult] =
      useState<ValidationResult | null>(null)

    const handleSubmit = (
      data: MemoryFormData,
      validation: ValidationResult,
    ) => {
      setSubmittedData(data)
      setValidationResult(validation)
      console.log('Form submitted:', { data, validation })
    }

    return (
      <div className="w-full max-w-4xl space-y-6">
        <MemoryForm
          {...args}
          onSubmit={handleSubmit}
          onValidationChange={setValidationState}
        />

        {validationState && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Real-time Validation</h3>
            <ValidationDisplay validation={validationState} />
          </div>
        )}

        {submittedData && validationResult && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Submission Result</h3>
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Validation Status:</strong>{' '}
                {validationResult.isValid ? '✅ Valid' : '❌ Invalid'}
              </div>
              <div className="text-sm">
                <strong>Memory ID:</strong> {submittedData.id}
              </div>
              <div className="text-sm">
                <strong>Content:</strong>{' '}
                {submittedData.content.substring(0, 100)}...
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Full Data
                </summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    )
  },
  args: {},
  parameters: {
    layout: 'padded',
  },
}

// Error state demonstration
export const WithValidationErrors: Story = {
  args: {
    initialData: {
      id: '', // Missing required field
      content: '', // Missing required field
      timestamp: 'invalid-date', // Invalid format
      author: {
        id: '', // Missing required field
        name: '', // Missing required field
        role: 'unknown-role', // Invalid role
      },
      participants: [],
      tags: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with validation errors to demonstrate error handling',
      },
    },
  },
}

// Long content demonstration
export const LongContent: Story = {
  args: {
    initialData: {
      id: 'memory-long-content',
      content: `This is a very long memory content that demonstrates how the form handles extensive text input. 
      
      It includes multiple paragraphs and detailed information about a complex conversation or event. This could be useful for testing the form's behavior with realistic data that might contain special characters, line breaks, and various formatting.
      
      The validation system should handle this content appropriately while ensuring it meets all schema requirements for memory storage.`,
      timestamp: '2025-01-15T14:30',
      author: {
        id: 'user-long-content',
        name: 'Content Creator',
        role: 'content-manager',
      },
      tags: ['long-form', 'detailed', 'comprehensive', 'testing', 'validation'],
    },
  },
}

// Minimal valid form
export const MinimalValid: Story = {
  args: {
    initialData: {
      id: 'min-memory',
      content: 'Minimal valid memory',
      timestamp: '2025-01-15T14:30',
      author: {
        id: 'min-user',
        name: 'Min User',
        role: 'user',
      },
      participants: [],
      tags: [],
    },
  },
}
