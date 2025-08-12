import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import type { ProviderType } from '../types.js'

import { RateLimiter } from '../rate-limiter.js'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  const mockClock = {
    now: vi.fn(() => Date.now()),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    rateLimiter = new RateLimiter(mockClock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Token Bucket Algorithm', () => {
    it('should initialize with configured burst capacity', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10, // tokens per second
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      const canProceed = rateLimiter.tryAcquire('claude' as ProviderType, 50)
      expect(canProceed).toBe(true)

      const canProceed2 = rateLimiter.tryAcquire('claude' as ProviderType, 50)
      expect(canProceed2).toBe(true)

      // Should fail as we've exhausted the burst capacity
      const canProceed3 = rateLimiter.tryAcquire('claude' as ProviderType, 1)
      expect(canProceed3).toBe(false)
    })

    it('should refill tokens at sustained rate', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10, // 10 tokens per second
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust all tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 100)
      expect(rateLimiter.tryAcquire('claude' as ProviderType, 1)).toBe(false)

      // Simulate 500ms passing (should refill 5 tokens)
      mockClock.now.mockReturnValue(Date.now() + 500)

      expect(rateLimiter.tryAcquire('claude' as ProviderType, 5)).toBe(true)
      expect(rateLimiter.tryAcquire('claude' as ProviderType, 1)).toBe(false)
    })

    it('should not exceed burst capacity when refilling', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Use half the tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 50)

      // Simulate 10 seconds passing (would refill 100 tokens)
      mockClock.now.mockReturnValue(Date.now() + 10000)

      // Should only be able to acquire up to burst capacity (50 remaining + refill to 100 = 100 total)
      expect(rateLimiter.tryAcquire('claude' as ProviderType, 101)).toBe(false)
      expect(rateLimiter.tryAcquire('claude' as ProviderType, 100)).toBe(true)
    })
  })

  describe('Sliding Window Request Tracking', () => {
    it('should track requests within window', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 60000, // 1 minute window
        maxRequestsPerWindow: 5,
      }

      rateLimiter.configure('openai' as ProviderType, config)

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.tryAcquire('openai' as ProviderType, 1)).toBe(true)
      }

      // 6th request should fail
      expect(rateLimiter.tryAcquire('openai' as ProviderType, 1)).toBe(false)
    })

    it('should allow requests after old ones expire from window', () => {
      const baseTime = Date.now()
      mockClock.now.mockReturnValue(baseTime)

      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000, // 1 second window
        maxRequestsPerWindow: 2,
      }

      rateLimiter.configure('openai' as ProviderType, config)

      // Make 2 requests
      rateLimiter.tryAcquire('openai' as ProviderType, 1)
      rateLimiter.tryAcquire('openai' as ProviderType, 1)

      // 3rd request should fail
      expect(rateLimiter.tryAcquire('openai' as ProviderType, 1)).toBe(false)

      // Move time forward by 1.1 seconds
      mockClock.now.mockReturnValue(baseTime + 1100)

      // Should be able to make new requests
      expect(rateLimiter.tryAcquire('openai' as ProviderType, 1)).toBe(true)
    })
  })

  describe('Predictive Queue Projection', () => {
    it('should predict queue wait time based on current rate', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10, // 10 tokens per second
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust all tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 100)

      // Predict wait time for 50 tokens
      const waitTime = rateLimiter.predictWaitTime('claude' as ProviderType, 50)

      // Should need 5 seconds to accumulate 50 tokens at 10 tokens/second
      expect(waitTime).toBe(5000)
    })

    it('should return 0 wait time if tokens available', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      const waitTime = rateLimiter.predictWaitTime('claude' as ProviderType, 50)
      expect(waitTime).toBe(0)
    })

    it('should project queue depth for multiple pending requests', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
        maxQueueDepth: 10,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 100)

      // Queue multiple requests
      const request1 = { tokens: 20, priority: 0 }
      const request2 = { tokens: 30, priority: 0 }
      const request3 = { tokens: 25, priority: 0 }

      const canQueue1 = rateLimiter.queueRequest(
        'claude' as ProviderType,
        request1,
      )
      const canQueue2 = rateLimiter.queueRequest(
        'claude' as ProviderType,
        request2,
      )
      const canQueue3 = rateLimiter.queueRequest(
        'claude' as ProviderType,
        request3,
      )

      expect(canQueue1).toBe(true)
      expect(canQueue2).toBe(true)
      expect(canQueue3).toBe(true)

      const queueStats = rateLimiter.getQueueStats('claude' as ProviderType)
      expect(queueStats.depth).toBe(3)
      expect(queueStats.totalTokensQueued).toBe(75)
      expect(queueStats.estimatedClearTime).toBe(7500) // 75 tokens at 10/sec
    })
  })

  describe('Queue Overflow Policy', () => {
    it('should reject requests when queue is full', () => {
      const config = {
        burstCapacity: 10,
        sustainedRate: 1,
        windowSizeMs: 1000,
        maxQueueDepth: 2,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 10)

      // Fill queue
      expect(
        rateLimiter.queueRequest('claude' as ProviderType, {
          tokens: 5,
          priority: 0,
        }),
      ).toBe(true)
      expect(
        rateLimiter.queueRequest('claude' as ProviderType, {
          tokens: 5,
          priority: 0,
        }),
      ).toBe(true)

      // Should reject when queue is full
      expect(
        rateLimiter.queueRequest('claude' as ProviderType, {
          tokens: 5,
          priority: 0,
        }),
      ).toBe(false)
    })

    it('should drop lowest priority request when overflow policy is drop-lowest', () => {
      const config = {
        burstCapacity: 10,
        sustainedRate: 1,
        windowSizeMs: 1000,
        maxQueueDepth: 2,
        overflowPolicy: 'drop-lowest' as const,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 10)

      // Queue requests with different priorities
      rateLimiter.queueRequest('claude' as ProviderType, {
        tokens: 5,
        priority: 1,
        id: 'high',
      })
      rateLimiter.queueRequest('claude' as ProviderType, {
        tokens: 5,
        priority: 0,
        id: 'low',
      })

      // Adding high priority should drop the low priority one
      const queued = rateLimiter.queueRequest('claude' as ProviderType, {
        tokens: 5,
        priority: 2,
        id: 'higher',
      })
      expect(queued).toBe(true)

      const queueStats = rateLimiter.getQueueStats('claude' as ProviderType)
      expect(queueStats.depth).toBe(2)

      // Verify the low priority request was dropped (higher priority items come first)
      const queue = rateLimiter.getQueue('claude' as ProviderType)
      expect(queue.map((r) => r.id)).toEqual(['higher', 'high'])
    })

    it('should apply FIFO ordering for same priority requests', () => {
      const config = {
        burstCapacity: 10,
        sustainedRate: 1,
        windowSizeMs: 1000,
        maxQueueDepth: 5,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 10)

      // Queue multiple requests with same priority
      rateLimiter.queueRequest('claude' as ProviderType, {
        tokens: 1,
        priority: 0,
        id: 'first',
      })
      rateLimiter.queueRequest('claude' as ProviderType, {
        tokens: 1,
        priority: 0,
        id: 'second',
      })
      rateLimiter.queueRequest('claude' as ProviderType, {
        tokens: 1,
        priority: 0,
        id: 'third',
      })

      const queue = rateLimiter.getQueue('claude' as ProviderType)
      expect(queue.map((r) => r.id)).toEqual(['first', 'second', 'third'])
    })
  })

  describe('Provider-Specific Rate Limits', () => {
    it('should maintain separate limits per provider', () => {
      const claudeConfig = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
      }

      const openaiConfig = {
        burstCapacity: 50,
        sustainedRate: 5,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, claudeConfig)
      rateLimiter.configure('openai' as ProviderType, openaiConfig)

      // Claude should allow 100 tokens
      expect(rateLimiter.tryAcquire('claude' as ProviderType, 100)).toBe(true)

      // OpenAI should only allow 50 tokens
      expect(rateLimiter.tryAcquire('openai' as ProviderType, 51)).toBe(false)
      expect(rateLimiter.tryAcquire('openai' as ProviderType, 50)).toBe(true)
    })

    it('should update rate limits from provider headers', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Update from Anthropic rate limit headers
      const headers = {
        'anthropic-ratelimit-requests-limit': '200',
        'anthropic-ratelimit-requests-remaining': '150',
        'anthropic-ratelimit-requests-reset': new Date(
          Date.now() + 60000,
        ).toISOString(),
        'anthropic-ratelimit-tokens-limit': '10000',
        'anthropic-ratelimit-tokens-remaining': '8000',
        'anthropic-ratelimit-tokens-reset': new Date(
          Date.now() + 60000,
        ).toISOString(),
      }

      rateLimiter.updateFromHeaders('claude' as ProviderType, headers)

      const limits = rateLimiter.getCurrentLimits('claude' as ProviderType)
      expect(limits.requestsRemaining).toBe(150)
      expect(limits.tokensRemaining).toBe(8000)
    })

    it('should calculate synthetic metrics for OpenAI', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 60000, // 1 minute
        maxRequestsPerWindow: 50,
      }

      rateLimiter.configure('openai' as ProviderType, config)

      // Make some requests
      rateLimiter.tryAcquire('openai' as ProviderType, 20)
      rateLimiter.tryAcquire('openai' as ProviderType, 30)

      const metrics = rateLimiter.getSyntheticMetrics('openai' as ProviderType)
      expect(metrics.tokensUsed).toBe(50)
      expect(metrics.requestsInWindow).toBe(2)
      expect(metrics.estimatedTokensRemaining).toBe(50)
      expect(metrics.estimatedRequestsRemaining).toBe(48)
    })
  })

  describe('Circuit Breaker Integration', () => {
    it('should provide hooks for circuit breaker', () => {
      const onThresholdExceeded = vi.fn()
      const onRateLimitRecovered = vi.fn()

      const config = {
        burstCapacity: 10,
        sustainedRate: 1,
        windowSizeMs: 1000,
        circuitBreakerHooks: {
          onThresholdExceeded,
          onRateLimitRecovered,
        },
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust rate limit
      rateLimiter.tryAcquire('claude' as ProviderType, 10)
      const failed = rateLimiter.tryAcquire('claude' as ProviderType, 1)

      expect(failed).toBe(false)
      expect(onThresholdExceeded).toHaveBeenCalledWith({
        provider: 'claude',
        tokensRequested: 1,
        tokensAvailable: 0,
      })

      // Simulate recovery
      const baseTime = Date.now()
      mockClock.now.mockReturnValue(baseTime + 5000)
      rateLimiter.tryAcquire('claude' as ProviderType, 1)

      expect(onRateLimitRecovered).toHaveBeenCalledWith({
        provider: 'claude',
        tokensAvailable: 2, // After refill we have some tokens, minus 1 just used
      })
    })

    it('should track consecutive failures for circuit breaker', () => {
      const baseTime = Date.now()
      mockClock.now.mockReturnValue(baseTime)

      const config = {
        burstCapacity: 10,
        sustainedRate: 1,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 10)

      // Track consecutive failures
      rateLimiter.tryAcquire('claude' as ProviderType, 5)
      rateLimiter.tryAcquire('claude' as ProviderType, 5)
      rateLimiter.tryAcquire('claude' as ProviderType, 5)

      const stats = rateLimiter.getProviderStats('claude' as ProviderType)
      expect(stats.consecutiveFailures).toBe(3)

      // Successful request should reset counter
      mockClock.now.mockReturnValue(baseTime + 5000)
      const success = rateLimiter.tryAcquire('claude' as ProviderType, 1)
      expect(success).toBe(true)

      const newStats = rateLimiter.getProviderStats('claude' as ProviderType)
      expect(newStats.consecutiveFailures).toBe(0)
    })
  })

  describe('Exponential Backoff', () => {
    it('should calculate backoff with injectable jitter', () => {
      const mockRng = {
        random: vi.fn(() => 0.5),
      }

      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
        backoff: {
          initialDelayMs: 1000,
          maxDelayMs: 60000,
          multiplier: 2,
          jitterFactor: 0.1,
        },
      }

      rateLimiter = new RateLimiter(mockClock, mockRng)
      rateLimiter.configure('claude' as ProviderType, config)

      // Calculate backoff for different retry attempts
      const backoff1 = rateLimiter.calculateBackoff('claude' as ProviderType, 0)
      expect(backoff1).toBeGreaterThanOrEqual(900)
      expect(backoff1).toBeLessThanOrEqual(1100)

      const backoff2 = rateLimiter.calculateBackoff('claude' as ProviderType, 1)
      expect(backoff2).toBeGreaterThanOrEqual(1800)
      expect(backoff2).toBeLessThanOrEqual(2200)

      const backoff3 = rateLimiter.calculateBackoff('claude' as ProviderType, 2)
      expect(backoff3).toBeGreaterThanOrEqual(3600)
      expect(backoff3).toBeLessThanOrEqual(4400)

      // Should cap at maxDelayMs
      const backoff10 = rateLimiter.calculateBackoff(
        'claude' as ProviderType,
        10,
      )
      expect(backoff10).toBeLessThanOrEqual(60000 * 1.1)
    })

    it('should apply backoff when rate limited', () => {
      const config = {
        burstCapacity: 10,
        sustainedRate: 1,
        windowSizeMs: 1000,
        backoff: {
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          multiplier: 2,
          jitterFactor: 0,
        },
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Exhaust tokens
      rateLimiter.tryAcquire('claude' as ProviderType, 10)

      // Get backoff recommendation
      const shouldRetry = rateLimiter.shouldRetryAfterBackoff(
        'claude' as ProviderType,
      )
      expect(shouldRetry.retry).toBe(true)
      expect(shouldRetry.delayMs).toBe(1000)

      // After waiting, backoff should increase for next failure
      mockClock.now.mockReturnValue(Date.now() + 1000)
      rateLimiter.tryAcquire('claude' as ProviderType, 10) // Still not enough tokens

      const shouldRetry2 = rateLimiter.shouldRetryAfterBackoff(
        'claude' as ProviderType,
      )
      expect(shouldRetry2.delayMs).toBe(2000)
    })
  })

  describe('Concurrency Control', () => {
    it('should limit concurrent requests', async () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
        maxConcurrentRequests: 2,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Acquire permits for concurrent requests
      const permit1 = await rateLimiter.acquireConcurrencyPermit(
        'claude' as ProviderType,
      )
      const permit2 = await rateLimiter.acquireConcurrencyPermit(
        'claude' as ProviderType,
      )

      expect(permit1).toBeTruthy()
      expect(permit2).toBeTruthy()

      // Third should be queued
      const permit3Promise = rateLimiter.acquireConcurrencyPermit(
        'claude' as ProviderType,
      )

      // Check that it's pending
      const stats = rateLimiter.getConcurrencyStats('claude' as ProviderType)
      expect(stats.active).toBe(2)
      expect(stats.queued).toBe(1)

      // Release one permit
      rateLimiter.releaseConcurrencyPermit('claude' as ProviderType, permit1)

      // Now the queued request should proceed
      const permit3 = await permit3Promise
      expect(permit3).toBeTruthy()
    })

    it('should enforce FIFO for concurrent request queue', async () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
        maxConcurrentRequests: 1,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Acquire the single permit
      const permit1 = await rateLimiter.acquireConcurrencyPermit(
        'claude' as ProviderType,
      )

      // Queue multiple requests
      const results: string[] = []
      void rateLimiter
        .acquireConcurrencyPermit('claude' as ProviderType)
        .then(() => {
          results.push('first')
        })
      void rateLimiter
        .acquireConcurrencyPermit('claude' as ProviderType)
        .then(() => {
          results.push('second')
        })
      void rateLimiter
        .acquireConcurrencyPermit('claude' as ProviderType)
        .then(() => {
          results.push('third')
        })

      // Check queue before releasing
      const queueBefore = rateLimiter.getConcurrencyQueue(
        'claude' as ProviderType,
      )
      expect(queueBefore.length).toBe(3)

      // Release permit and let queue process
      rateLimiter.releaseConcurrencyPermit('claude' as ProviderType, permit1)

      // After releasing, one should be processed, leaving 2 in queue
      const queue = rateLimiter.getConcurrencyQueue('claude' as ProviderType)
      expect(queue.length).toBe(2)
    })
  })

  describe('Metrics and Monitoring', () => {
    it('should track rate limit metrics', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Make various requests
      rateLimiter.tryAcquire('claude' as ProviderType, 30)
      rateLimiter.tryAcquire('claude' as ProviderType, 40)
      rateLimiter.tryAcquire('claude' as ProviderType, 50) // This should fail

      const metrics = rateLimiter.getMetrics('claude' as ProviderType)
      expect(metrics.totalRequests).toBe(3)
      expect(metrics.successfulRequests).toBe(2)
      expect(metrics.failedRequests).toBe(1)
      expect(metrics.totalTokensRequested).toBe(120)
      expect(metrics.totalTokensGranted).toBe(70)
    })

    it('should reset metrics on demand', () => {
      const config = {
        burstCapacity: 100,
        sustainedRate: 10,
        windowSizeMs: 1000,
      }

      rateLimiter.configure('claude' as ProviderType, config)

      // Make some requests
      rateLimiter.tryAcquire('claude' as ProviderType, 50)

      const metrics = rateLimiter.getMetrics('claude' as ProviderType)
      expect(metrics.totalRequests).toBe(1)

      // Reset metrics
      rateLimiter.resetMetrics('claude' as ProviderType)

      const newMetrics = rateLimiter.getMetrics('claude' as ProviderType)
      expect(newMetrics.totalRequests).toBe(0)
      expect(newMetrics.totalTokensGranted).toBe(0)
    })
  })
})
