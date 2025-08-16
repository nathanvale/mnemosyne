import type { ProviderType } from './types'

/**
 * Configuration for rate limiting
 */
export interface RateLimiterConfig {
  burstCapacity: number
  sustainedRate: number // tokens per second
  windowSizeMs: number
  maxRequestsPerWindow?: number
  maxQueueDepth?: number
  overflowPolicy?: 'reject' | 'drop-lowest'
  maxConcurrentRequests?: number
  backoff?: BackoffConfig
  circuitBreakerHooks?: CircuitBreakerHooks
}

/**
 * Backoff configuration
 */
export interface BackoffConfig {
  initialDelayMs: number
  maxDelayMs: number
  multiplier: number
  jitterFactor: number
}

/**
 * Circuit breaker integration hooks
 */
export interface CircuitBreakerHooks {
  onThresholdExceeded: (event: ThresholdExceededEvent) => void
  onRateLimitRecovered: (event: RateLimitRecoveredEvent) => void
}

/**
 * Event emitted when rate limit threshold exceeded
 */
export interface ThresholdExceededEvent {
  provider: string
  tokensRequested: number
  tokensAvailable: number
}

/**
 * Event emitted when rate limit recovers
 */
export interface RateLimitRecoveredEvent {
  provider: string
  tokensAvailable: number
}

/**
 * Queued request structure
 */
export interface QueuedRequest {
  tokens: number
  priority: number
  id?: string
  timestamp?: number
  resolver?: (value: boolean) => void
}

/**
 * Queue statistics
 */
export interface QueueStats {
  depth: number
  totalTokensQueued: number
  estimatedClearTime: number
}

/**
 * Provider statistics
 */
export interface ProviderStats {
  consecutiveFailures: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalTokensRequested: number
  totalTokensGranted: number
}

/**
 * Current rate limits
 */
export interface CurrentLimits {
  requestsRemaining: number
  tokensRemaining: number
  resetTime?: Date
}

/**
 * Synthetic metrics for providers without headers
 */
export interface SyntheticMetrics {
  tokensUsed: number
  requestsInWindow: number
  estimatedTokensRemaining: number
  estimatedRequestsRemaining: number
}

/**
 * Concurrency statistics
 */
export interface ConcurrencyStats {
  active: number
  queued: number
  maxConcurrent: number
}

/**
 * Clock interface for testing
 */
export interface Clock {
  now(): number
}

/**
 * Random number generator interface for testing
 */
export interface RNG {
  random(): number
}

/**
 * Token bucket state
 */
interface TokenBucket {
  tokens: number
  lastRefillTime: number
  config: RateLimiterConfig
}

/**
 * Request window tracking
 */
interface RequestWindow {
  timestamps: number[]
  windowSizeMs: number
  maxRequests: number
}

/**
 * Provider rate limit state
 */
interface ProviderState {
  bucket: TokenBucket
  window?: RequestWindow
  queue: QueuedRequest[]
  stats: ProviderStats
  consecutiveFailures: number
  lastSuccessTime?: number
  limits?: CurrentLimits
  concurrency: {
    active: number
    maxConcurrent: number
    queue: Array<{ id: string; resolver: (value: string) => void }>
  }
}

/**
 * Rate limiter implementation with token bucket and sliding window
 */
export class RateLimiter {
  private providers: Map<ProviderType, ProviderState> = new Map()
  private clock: Clock
  private rng: RNG
  private permitCounter = 0

  constructor(clock: Clock = { now: () => Date.now() }, rng: RNG = Math) {
    this.clock = clock
    this.rng = rng
  }

  /**
   * Configure rate limits for a provider
   */
  configure(provider: ProviderType, config: RateLimiterConfig): void {
    const now = this.clock.now()
    const bucket: TokenBucket = {
      tokens: config.burstCapacity,
      lastRefillTime: now,
      config,
    }

    const window: RequestWindow | undefined = config.maxRequestsPerWindow
      ? {
          timestamps: [],
          windowSizeMs: config.windowSizeMs,
          maxRequests: config.maxRequestsPerWindow,
        }
      : undefined

    this.providers.set(provider, {
      bucket,
      window,
      queue: [],
      stats: {
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokensRequested: 0,
        totalTokensGranted: 0,
      },
      consecutiveFailures: 0,
      concurrency: {
        active: 0,
        maxConcurrent: config.maxConcurrentRequests || Number.MAX_SAFE_INTEGER,
        queue: [],
      },
    })
  }

  /**
   * Try to acquire tokens from the rate limiter
   */
  tryAcquire(provider: ProviderType, tokens: number): boolean {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const now = this.clock.now()
    this.refillBucket(state.bucket, now)

    // Update stats
    state.stats.totalRequests++
    state.stats.totalTokensRequested += tokens

    // Check window limits
    if (state.window && !this.checkWindowLimit(state.window, now)) {
      state.stats.failedRequests++
      state.consecutiveFailures++
      this.triggerThresholdExceeded(provider, tokens, state)
      return false
    }

    // Check token bucket
    if (state.bucket.tokens < tokens) {
      state.stats.failedRequests++
      state.consecutiveFailures++
      this.triggerThresholdExceeded(provider, tokens, state)
      return false
    }

    // Acquire tokens
    state.bucket.tokens -= tokens
    state.stats.successfulRequests++
    state.stats.totalTokensGranted += tokens

    // Record request in window
    if (state.window) {
      state.window.timestamps.push(now)
    }

    // Reset consecutive failures on success
    if (state.consecutiveFailures > 0) {
      const wasRecovered = state.consecutiveFailures > 0
      state.consecutiveFailures = 0
      state.lastSuccessTime = now
      if (wasRecovered) {
        this.triggerRateLimitRecovered(provider, state)
      }
    }

    return true
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillBucket(bucket: TokenBucket, now: number): void {
    const elapsed = now - bucket.lastRefillTime
    const tokensToAdd = (elapsed / 1000) * bucket.config.sustainedRate

    bucket.tokens = Math.min(
      bucket.config.burstCapacity,
      bucket.tokens + tokensToAdd,
    )
    bucket.lastRefillTime = now
  }

  /**
   * Check if request fits within sliding window
   */
  private checkWindowLimit(window: RequestWindow, now: number): boolean {
    // Remove expired timestamps
    const cutoff = now - window.windowSizeMs
    window.timestamps = window.timestamps.filter((t) => t > cutoff)

    return window.timestamps.length < window.maxRequests
  }

  /**
   * Predict wait time for tokens to become available
   */
  predictWaitTime(provider: ProviderType, tokens: number): number {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const now = this.clock.now()
    this.refillBucket(state.bucket, now)

    if (state.bucket.tokens >= tokens) {
      return 0
    }

    const tokensNeeded = tokens - state.bucket.tokens
    const secondsNeeded = tokensNeeded / state.bucket.config.sustainedRate
    return Math.ceil(secondsNeeded * 1000)
  }

  /**
   * Queue a request for later processing
   */
  queueRequest(provider: ProviderType, request: QueuedRequest): boolean {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const config = state.bucket.config
    const maxDepth = config.maxQueueDepth || Number.MAX_SAFE_INTEGER

    if (state.queue.length >= maxDepth) {
      if (config.overflowPolicy === 'drop-lowest') {
        // Find and remove lowest priority request
        let lowestPriorityIndex = 0
        let lowestPriority = state.queue[0]?.priority ?? Number.MAX_VALUE

        for (let i = 1; i < state.queue.length; i++) {
          if (state.queue[i].priority < lowestPriority) {
            lowestPriority = state.queue[i].priority
            lowestPriorityIndex = i
          }
        }

        // Only add if new request has higher priority
        if (request.priority <= lowestPriority) {
          return false
        }

        state.queue.splice(lowestPriorityIndex, 1)
      } else {
        return false
      }
    }

    state.queue.push({
      ...request,
      timestamp: this.clock.now(),
    })

    // Sort by priority (higher first) then by timestamp (FIFO for same priority)
    state.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return (a.timestamp || 0) - (b.timestamp || 0)
    })

    return true
  }

  /**
   * Get queue statistics
   */
  getQueueStats(provider: ProviderType): QueueStats {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const totalTokensQueued = state.queue.reduce(
      (sum, req) => sum + req.tokens,
      0,
    )
    const estimatedClearTime =
      (totalTokensQueued / state.bucket.config.sustainedRate) * 1000

    return {
      depth: state.queue.length,
      totalTokensQueued,
      estimatedClearTime,
    }
  }

  /**
   * Get current queue
   */
  getQueue(provider: ProviderType): QueuedRequest[] {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }
    return [...state.queue]
  }

  /**
   * Update rate limits from provider headers
   */
  updateFromHeaders(
    provider: ProviderType,
    headers: Record<string, string>,
  ): void {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    // Parse Anthropic headers
    const requestsRemaining = parseInt(
      headers['anthropic-ratelimit-requests-remaining'] || '0',
      10,
    )
    const tokensRemaining = parseInt(
      headers['anthropic-ratelimit-tokens-remaining'] || '0',
      10,
    )
    const resetTime = headers['anthropic-ratelimit-tokens-reset']
      ? new Date(headers['anthropic-ratelimit-tokens-reset'])
      : undefined

    state.limits = {
      requestsRemaining,
      tokensRemaining,
      resetTime,
    }
  }

  /**
   * Get current limits
   */
  getCurrentLimits(provider: ProviderType): CurrentLimits {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    return (
      state.limits || {
        requestsRemaining: 0,
        tokensRemaining: 0,
      }
    )
  }

  /**
   * Get synthetic metrics for OpenAI
   */
  getSyntheticMetrics(provider: ProviderType): SyntheticMetrics {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const now = this.clock.now()
    this.refillBucket(state.bucket, now)

    const requestsInWindow = state.window
      ? state.window.timestamps.filter(
          (t) => t > now - state.window!.windowSizeMs,
        ).length
      : 0

    return {
      tokensUsed: state.stats.totalTokensGranted,
      requestsInWindow,
      estimatedTokensRemaining: Math.floor(state.bucket.tokens),
      estimatedRequestsRemaining: state.window
        ? state.window.maxRequests - requestsInWindow
        : Number.MAX_SAFE_INTEGER,
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats(
    provider: ProviderType,
  ): ProviderStats & { consecutiveFailures: number } {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    return {
      ...state.stats,
      consecutiveFailures: state.consecutiveFailures,
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoff(provider: ProviderType, retryAttempt: number): number {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const backoff = state.bucket.config.backoff
    if (!backoff) {
      return 0
    }

    const baseDelay = Math.min(
      backoff.initialDelayMs * Math.pow(backoff.multiplier, retryAttempt),
      backoff.maxDelayMs,
    )

    // Apply jitter
    const jitter =
      baseDelay * backoff.jitterFactor * (this.rng.random() * 2 - 1)
    return Math.max(0, Math.round(baseDelay + jitter))
  }

  /**
   * Check if should retry after backoff
   */
  shouldRetryAfterBackoff(provider: ProviderType): {
    retry: boolean
    delayMs: number
  } {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const delayMs = this.calculateBackoff(provider, state.consecutiveFailures)
    return {
      retry: true,
      delayMs,
    }
  }

  /**
   * Acquire concurrency permit
   */
  async acquireConcurrencyPermit(provider: ProviderType): Promise<string> {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    if (state.concurrency.active < state.concurrency.maxConcurrent) {
      state.concurrency.active++
      return `permit-${++this.permitCounter}`
    }

    // Queue the request
    return new Promise((resolve) => {
      const id = `permit-${++this.permitCounter}`
      state.concurrency.queue.push({ id, resolver: resolve })
    })
  }

  /**
   * Release concurrency permit
   */
  releaseConcurrencyPermit(provider: ProviderType, _permitId: string): void {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    state.concurrency.active--

    // Process queued request if any
    if (state.concurrency.queue.length > 0) {
      const next = state.concurrency.queue.shift()
      if (next) {
        state.concurrency.active++
        next.resolver(next.id)
      }
    }
  }

  /**
   * Get concurrency statistics
   */
  getConcurrencyStats(provider: ProviderType): ConcurrencyStats {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    return {
      active: state.concurrency.active,
      queued: state.concurrency.queue.length,
      maxConcurrent: state.concurrency.maxConcurrent,
    }
  }

  /**
   * Get concurrency queue
   */
  getConcurrencyQueue(provider: ProviderType): Array<{ id: string }> {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    return state.concurrency.queue.map((item) => ({ id: item.id }))
  }

  /**
   * Get metrics
   */
  getMetrics(provider: ProviderType): ProviderStats {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    return { ...state.stats }
  }

  /**
   * Reset metrics
   */
  resetMetrics(provider: ProviderType): void {
    const state = this.providers.get(provider)
    if (!state) {
      throw new Error(`Provider ${provider} not configured`)
    }

    state.stats = {
      consecutiveFailures: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensRequested: 0,
      totalTokensGranted: 0,
    }
  }

  /**
   * Trigger threshold exceeded hook
   */
  private triggerThresholdExceeded(
    provider: ProviderType,
    tokens: number,
    state: ProviderState,
  ): void {
    const hooks = state.bucket.config.circuitBreakerHooks
    if (hooks?.onThresholdExceeded) {
      hooks.onThresholdExceeded({
        provider,
        tokensRequested: tokens,
        tokensAvailable: Math.floor(state.bucket.tokens),
      })
    }
  }

  /**
   * Trigger rate limit recovered hook
   */
  private triggerRateLimitRecovered(
    provider: ProviderType,
    state: ProviderState,
  ): void {
    const hooks = state.bucket.config.circuitBreakerHooks
    if (hooks?.onRateLimitRecovered) {
      hooks.onRateLimitRecovered({
        provider,
        tokensAvailable: Math.floor(state.bucket.tokens),
      })
    }
  }
}
