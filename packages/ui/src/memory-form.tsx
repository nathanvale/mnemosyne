import {
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  validateMemory,
} from '@studio/schema'
import React, { useState, useCallback, useMemo } from 'react'

/**
 * Memory form data structure matching schema input
 */
export interface MemoryFormData {
  id: string
  content: string
  timestamp: string
  author: {
    id: string
    name: string
    role: string
  }
  participants: Array<{
    id: string
    name: string
    role: string
  }>
  tags: string[]
}

/**
 * Emotional context form data
 */
export interface EmotionalContextFormData {
  id: string
  primaryMood: string
  intensity: number
  themes: string[]
  emotionalMarkers: string[]
  contextualEvents: string[]
  temporalPatterns: {
    isBuilding?: boolean
    isResolving?: boolean
  }
}

/**
 * Form validation state
 */
interface ValidationState {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  validatedFields: Set<string>
}

/**
 * Input field props with validation
 */
interface ValidatedInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  validation?: ValidationState
  type?: 'text' | 'number' | 'email' | 'datetime-local'
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Validated input component with error display
 */
export function ValidatedInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  validation,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
}: ValidatedInputProps): React.JSX.Element {
  const fieldErrors =
    validation?.errors.filter((error) => error.field === id) || []
  const hasErrors = fieldErrors.length > 0
  const isValidated = validation?.validatedFields.has(id) || false

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1
          ${
            hasErrors
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : isValidated
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {hasErrors && (
        <div className="mt-1 text-sm text-red-600">
          {fieldErrors.map((error, index) => (
            <div key={index}>{error.message}</div>
          ))}
        </div>
      )}
      {isValidated && !hasErrors && (
        <div className="mt-1 text-sm text-green-600">✓ Valid</div>
      )}
    </div>
  )
}

/**
 * Array input component for managing lists with validation
 */
interface ArrayInputProps {
  id: string
  label: string
  values: string[]
  onChange: (values: string[]) => void
  validation?: ValidationState
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function ArrayInput({
  id,
  label,
  values,
  onChange,
  validation,
  placeholder = 'Add item...',
  required = false,
  disabled = false,
}: ArrayInputProps): React.JSX.Element {
  const [newItem, setNewItem] = useState('')
  const fieldErrors =
    validation?.errors.filter((error) => error.field === id) || []
  const hasErrors = fieldErrors.length > 0

  const addItem = useCallback(() => {
    if (newItem.trim()) {
      onChange([...values, newItem.trim()])
      setNewItem('')
    }
  }, [newItem, values, onChange])

  const removeItem = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index))
    },
    [values, onChange],
  )

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Current items */}
      <div className="space-y-2 mb-2">
        {values.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
              {item}
            </span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={disabled}
              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' && (e.preventDefault(), addItem())
          }
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1
            ${
              hasErrors
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={disabled || !newItem.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {hasErrors && (
        <div className="mt-1 text-sm text-red-600">
          {fieldErrors.map((error, index) => (
            <div key={index}>{error.message}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Memory form component with real-time validation
 */
export interface MemoryFormProps {
  initialData?: Partial<MemoryFormData>
  onSubmit: (data: MemoryFormData, validation: ValidationResult) => void
  onValidationChange?: (validation: ValidationState) => void
  disabled?: boolean
}

export function MemoryForm({
  initialData = {},
  onSubmit,
  onValidationChange,
  disabled = false,
}: MemoryFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<MemoryFormData>({
    id: '',
    content: '',
    timestamp: new Date().toISOString().slice(0, 16), // datetime-local format
    author: { id: '', name: '', role: 'self' },
    participants: [],
    tags: [],
    ...initialData,
  })

  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set())

  // Real-time validation
  const validation = useMemo(() => {
    const result = validateMemory(formData)
    const state: ValidationState = {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      validatedFields,
    }

    // Notify parent component of validation changes
    onValidationChange?.(state)

    return state
  }, [formData, validatedFields, onValidationChange])

  const updateField = useCallback(
    (field: keyof MemoryFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const updateAuthor = useCallback(
    (field: keyof MemoryFormData['author'], value: string) => {
      setFormData((prev) => ({
        ...prev,
        author: { ...prev.author, [field]: value },
      }))
    },
    [],
  )

  const markFieldValidated = useCallback((field: string) => {
    setValidatedFields((prev) => new Set([...prev, field]))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // Mark all fields as validated
      const allFields = new Set([
        'id',
        'content',
        'timestamp',
        'author.id',
        'author.name',
        'participants',
        'tags',
      ])
      setValidatedFields(allFields)

      // Run final validation
      const finalValidation = validateMemory(formData)
      onSubmit(formData, finalValidation)
    },
    [formData, onSubmit],
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Memory</h2>

      <ValidatedInput
        id="id"
        label="Memory ID"
        value={formData.id}
        onChange={(value) => updateField('id', value)}
        onBlur={() => markFieldValidated('id')}
        validation={validation}
        placeholder="e.g., memory-2025-001"
        required
        disabled={disabled}
      />

      <ValidatedInput
        id="content"
        label="Content"
        value={formData.content}
        onChange={(value) => updateField('content', value)}
        onBlur={() => markFieldValidated('content')}
        validation={validation}
        placeholder="Describe the memory content..."
        required
        disabled={disabled}
      />

      <ValidatedInput
        id="timestamp"
        label="Timestamp"
        value={formData.timestamp}
        onChange={(value) => updateField('timestamp', value)}
        onBlur={() => markFieldValidated('timestamp')}
        validation={validation}
        type="datetime-local"
        required
        disabled={disabled}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ValidatedInput
          id="author.id"
          label="Author ID"
          value={formData.author.id}
          onChange={(value) => updateAuthor('id', value)}
          onBlur={() => markFieldValidated('author.id')}
          validation={validation}
          placeholder="e.g., user-123"
          required
          disabled={disabled}
        />

        <ValidatedInput
          id="author.name"
          label="Author Name"
          value={formData.author.name}
          onChange={(value) => updateAuthor('name', value)}
          onBlur={() => markFieldValidated('author.name')}
          validation={validation}
          placeholder="e.g., John Doe"
          required
          disabled={disabled}
        />
      </div>

      <ArrayInput
        id="tags"
        label="Tags"
        values={formData.tags}
        onChange={(values) => updateField('tags', values)}
        validation={validation}
        placeholder="Add a tag..."
        disabled={disabled}
      />

      {/* Validation summary */}
      {validation.errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Warnings:
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            setFormData({
              id: '',
              content: '',
              timestamp: new Date().toISOString().slice(0, 16),
              author: { id: '', name: '', role: 'self' },
              participants: [],
              tags: [],
            })
          }
          disabled={disabled}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={disabled || !validation.isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Create Memory
        </button>
      </div>
    </form>
  )
}

/**
 * Memory form validation result display component
 */
export interface ValidationDisplayProps {
  validation: ValidationState
  showValid?: boolean
}

export function ValidationDisplay({
  validation,
  showValid = true,
}: ValidationDisplayProps): React.JSX.Element | null {
  if (!validation.errors.length && !validation.warnings.length && !showValid) {
    return null
  }

  return (
    <div className="space-y-2">
      {validation.isValid && showValid && (
        <div className="flex items-center gap-2 text-green-600">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">
            All validation checks passed
          </span>
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-red-800">Errors:</h4>
          {validation.errors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-red-700"
            >
              <span className="text-red-500 mt-0.5">•</span>
              <span>
                <strong>{error.field}:</strong> {error.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
          {validation.warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-yellow-700"
            >
              <span className="text-yellow-500 mt-0.5">•</span>
              <span>
                <strong>{warning.field}:</strong> {warning.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
