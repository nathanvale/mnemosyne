/**
 * Configuration schema and validation for Claude hooks
 * Provides comprehensive validation and type safety for all hook configurations
 */

export * from './env-config.js'

export interface HookConfig {
  debug?: boolean
  notify?: boolean
  speak?: boolean
}

export interface CooldownConfig {
  cooldownPeriod: number
  allowUrgentOverride?: boolean
  perTypeSettings?: Partial<Record<NotificationType, number>>
}

export interface QuietHoursRange {
  start: string // HH:MM format
  end: string // HH:MM format
  name?: string
}

export interface QuietHoursConfig {
  enabled: boolean
  ranges: QuietHoursRange[]
  allowUrgentOverride?: boolean
  days?: string[]
  timezone?: string
}

export interface SpeechConfig {
  voice?: string
  rate?: number // Words per minute
  volume?: number // 0.0 to 1.0
  enabled?: boolean
}

export interface CompleteHookConfig extends HookConfig {
  cooldownPeriod?: number
  allowUrgentOverride?: boolean
  quietHours?: QuietHoursConfig
  speech?: SpeechConfig
  perTypeSettings?: Partial<Record<NotificationType, number>>
}

export type NotificationType =
  | 'speech'
  | 'audio'
  | 'urgent'
  | 'notification'
  | 'stop'
  | 'subagent'

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Configuration validator with comprehensive validation rules
 */
export class ConfigValidator {
  private static readonly TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  private static readonly VALID_DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]
  private static readonly VALID_NOTIFICATION_TYPES: NotificationType[] = [
    'speech',
    'audio',
    'urgent',
    'notification',
    'stop',
    'subagent',
  ]

  /**
   * Validate complete hook configuration
   */
  static validate(config: unknown): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    if (
      config === null ||
      config === undefined ||
      typeof config !== 'object' ||
      Array.isArray(config)
    ) {
      return {
        isValid: false,
        errors: [{ field: 'root', message: 'Configuration must be an object' }],
        warnings: [],
      }
    }

    const cfg = config as Record<string, unknown>

    // Validate basic hook configuration
    this.validateHookConfig(cfg, errors, warnings)

    // Validate cooldown configuration
    this.validateCooldownConfig(cfg, errors, warnings)

    // Validate quiet hours configuration
    if (cfg.quietHours !== undefined) {
      this.validateQuietHoursConfig(cfg.quietHours, errors, warnings)
    }

    // Validate speech configuration
    if (cfg.speech !== undefined) {
      this.validateSpeechConfig(cfg.speech, errors, warnings)
    }

    // Validate per-type settings
    if (cfg.perTypeSettings !== undefined) {
      this.validatePerTypeSettings(cfg.perTypeSettings, errors, warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate basic hook configuration
   */
  private static validateHookConfig(
    config: Record<string, unknown>,
    errors: ValidationError[],
    _warnings: ValidationError[],
  ): void {
    const booleanFields = ['debug', 'notify', 'speak']

    booleanFields.forEach((field) => {
      if (config[field] !== undefined && typeof config[field] !== 'boolean') {
        errors.push({
          field,
          message: `${field} must be a boolean`,
          value: config[field],
        })
      }
    })
  }

  /**
   * Validate cooldown configuration
   */
  private static validateCooldownConfig(
    config: Record<string, unknown>,
    errors: ValidationError[],
    _warnings: ValidationError[],
  ): void {
    if (config.cooldownPeriod !== undefined) {
      if (
        typeof config.cooldownPeriod !== 'number' ||
        config.cooldownPeriod < 0
      ) {
        errors.push({
          field: 'cooldownPeriod',
          message: 'cooldownPeriod must be a non-negative number',
          value: config.cooldownPeriod,
        })
      } else if (config.cooldownPeriod > 300000) {
        // 5 minutes
        _warnings.push({
          field: 'cooldownPeriod',
          message: 'cooldownPeriod is very long (>5 minutes)',
          value: config.cooldownPeriod,
        })
      }
    }

    if (
      config.allowUrgentOverride !== undefined &&
      typeof config.allowUrgentOverride !== 'boolean'
    ) {
      errors.push({
        field: 'allowUrgentOverride',
        message: 'allowUrgentOverride must be a boolean',
        value: config.allowUrgentOverride,
      })
    }
  }

  /**
   * Validate quiet hours configuration
   */
  private static validateQuietHoursConfig(
    quietHours: unknown,
    errors: ValidationError[],
    _warnings: ValidationError[],
  ): void {
    if (typeof quietHours !== 'object' || quietHours === null) {
      errors.push({
        field: 'quietHours',
        message: 'quietHours must be an object',
        value: quietHours,
      })
      return
    }

    const qh = quietHours as Record<string, unknown>

    // Validate enabled
    if (typeof qh.enabled !== 'boolean') {
      errors.push({
        field: 'quietHours.enabled',
        message: 'quietHours.enabled must be a boolean',
        value: qh.enabled,
      })
    }

    // Validate ranges
    if (!Array.isArray(qh.ranges)) {
      errors.push({
        field: 'quietHours.ranges',
        message: 'quietHours.ranges must be an array',
        value: qh.ranges,
      })
    } else {
      qh.ranges.forEach((range, index) => {
        this.validateTimeRange(
          range,
          `quietHours.ranges[${index}]`,
          errors,
          _warnings,
        )
      })
    }

    // Validate allowUrgentOverride
    if (
      qh.allowUrgentOverride !== undefined &&
      typeof qh.allowUrgentOverride !== 'boolean'
    ) {
      errors.push({
        field: 'quietHours.allowUrgentOverride',
        message: 'quietHours.allowUrgentOverride must be a boolean',
        value: qh.allowUrgentOverride,
      })
    }

    // Validate days
    if (qh.days !== undefined) {
      if (!Array.isArray(qh.days)) {
        errors.push({
          field: 'quietHours.days',
          message: 'quietHours.days must be an array',
          value: qh.days,
        })
      } else {
        qh.days.forEach((day, index) => {
          if (
            typeof day !== 'string' ||
            !this.VALID_DAYS.includes(day.toLowerCase())
          ) {
            errors.push({
              field: `quietHours.days[${index}]`,
              message: `Invalid day name. Must be one of: ${this.VALID_DAYS.join(', ')}`,
              value: day,
            })
          }
        })
      }
    }

    // Validate timezone
    if (qh.timezone !== undefined && typeof qh.timezone !== 'string') {
      errors.push({
        field: 'quietHours.timezone',
        message: 'quietHours.timezone must be a string',
        value: qh.timezone,
      })
    }
  }

  /**
   * Validate time range
   */
  private static validateTimeRange(
    range: unknown,
    fieldPrefix: string,
    errors: ValidationError[],
    _warnings: ValidationError[],
  ): void {
    if (typeof range !== 'object' || range === null) {
      errors.push({
        field: fieldPrefix,
        message: 'Time range must be an object',
        value: range,
      })
      return
    }

    const r = range as Record<string, unknown>

    // Validate start time
    if (typeof r.start !== 'string' || !this.TIME_REGEX.test(r.start)) {
      errors.push({
        field: `${fieldPrefix}.start`,
        message: 'start time must be in HH:MM format (24-hour)',
        value: r.start,
      })
    }

    // Validate end time
    if (typeof r.end !== 'string' || !this.TIME_REGEX.test(r.end)) {
      errors.push({
        field: `${fieldPrefix}.end`,
        message: 'end time must be in HH:MM format (24-hour)',
        value: r.end,
      })
    }

    // Validate name (optional)
    if (r.name !== undefined && typeof r.name !== 'string') {
      errors.push({
        field: `${fieldPrefix}.name`,
        message: 'name must be a string',
        value: r.name,
      })
    }
  }

  /**
   * Validate speech configuration
   */
  private static validateSpeechConfig(
    speech: unknown,
    errors: ValidationError[],
    _warnings: ValidationError[],
  ): void {
    if (typeof speech !== 'object' || speech === null) {
      errors.push({
        field: 'speech',
        message: 'speech configuration must be an object',
        value: speech,
      })
      return
    }

    const s = speech as Record<string, unknown>

    // Validate voice
    if (s.voice !== undefined && typeof s.voice !== 'string') {
      errors.push({
        field: 'speech.voice',
        message: 'speech.voice must be a string',
        value: s.voice,
      })
    }

    // Validate rate
    if (s.rate !== undefined) {
      if (typeof s.rate !== 'number' || s.rate <= 0) {
        errors.push({
          field: 'speech.rate',
          message: 'speech.rate must be a positive number',
          value: s.rate,
        })
      } else if (s.rate < 50 || s.rate > 500) {
        _warnings.push({
          field: 'speech.rate',
          message: 'speech.rate outside typical range (50-500 WPM)',
          value: s.rate,
        })
      }
    }

    // Validate volume
    if (s.volume !== undefined) {
      if (typeof s.volume !== 'number' || s.volume < 0 || s.volume > 1) {
        errors.push({
          field: 'speech.volume',
          message: 'speech.volume must be a number between 0 and 1',
          value: s.volume,
        })
      }
    }

    // Validate enabled
    if (s.enabled !== undefined && typeof s.enabled !== 'boolean') {
      errors.push({
        field: 'speech.enabled',
        message: 'speech.enabled must be a boolean',
        value: s.enabled,
      })
    }
  }

  /**
   * Validate per-type settings
   */
  private static validatePerTypeSettings(
    perTypeSettings: unknown,
    errors: ValidationError[],
    _warnings: ValidationError[],
  ): void {
    if (typeof perTypeSettings !== 'object' || perTypeSettings === null) {
      errors.push({
        field: 'perTypeSettings',
        message: 'perTypeSettings must be an object',
        value: perTypeSettings,
      })
      return
    }

    const pts = perTypeSettings as Record<string, unknown>

    Object.entries(pts).forEach(([type, period]) => {
      // Validate notification type
      if (!this.VALID_NOTIFICATION_TYPES.includes(type as NotificationType)) {
        errors.push({
          field: `perTypeSettings.${type}`,
          message: `Invalid notification type. Must be one of: ${this.VALID_NOTIFICATION_TYPES.join(', ')}`,
          value: type,
        })
        return
      }

      // Validate period
      if (typeof period !== 'number' || period < 0) {
        errors.push({
          field: `perTypeSettings.${type}`,
          message: 'Period must be a non-negative number',
          value: period,
        })
      } else if (period > 300000) {
        // 5 minutes
        _warnings.push({
          field: `perTypeSettings.${type}`,
          message: 'Period is very long (>5 minutes)',
          value: period,
        })
      }
    })
  }

  /**
   * Validate time string format
   */
  static validateTimeString(time: string): boolean {
    return this.TIME_REGEX.test(time)
  }

  /**
   * Validate day name
   */
  static validateDayName(day: string): boolean {
    return this.VALID_DAYS.includes(day.toLowerCase())
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig(): CompleteHookConfig {
    return {
      debug: false,
      notify: false,
      speak: false,
      cooldownPeriod: 5000, // 5 seconds
      allowUrgentOverride: false,
      quietHours: {
        enabled: false,
        ranges: [],
        allowUrgentOverride: false,
        days: this.VALID_DAYS,
        timezone: 'local',
      },
      speech: {
        voice: 'default',
        rate: 200,
        volume: 0.7,
        enabled: false,
      },
      perTypeSettings: {},
    }
  }
}
