import { logger } from '@studio/logger'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import express from 'express'

import { mcpRouter } from './router'

/**
 * Express server for MCP HTTP endpoints
 */
export class McpExpressServer {
  private app: express.Application
  private port: number

  constructor(port = 3005) {
    this.port = port
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  /**
   * Setup express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    this.app.use((req, res, next) => {
      const allowedOrigins =
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',') || [
              'https://localhost:3000',
            ]
          : [
              'http://localhost:3000',
              'http://127.0.0.1:3000',
              'http://localhost:3001',
            ]

      const origin = req.headers.origin
      if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin)
      } else if (process.env.NODE_ENV !== 'production') {
        res.header('Access-Control-Allow-Origin', '*')
      }

      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      )
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.header('Access-Control-Allow-Credentials', 'true')

      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
        return
      }

      next()
    })

    this.app.use((req, res, next) => {
      logger.info('HTTP request', {
        method: req.method,
        path: req.path,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      })
      next()
    })
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    this.app.use(
      '/api/trpc',
      createExpressMiddleware({
        router: mcpRouter,
        createContext: () => ({}),
      }),
    )

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'mcp-api-server',
        version: '0.1.0',
      })
    })

    this.app.get('/api/capabilities', (req, res) => {
      res.json({
        version: '0.1.0',
        features: [
          'mood_context_generation',
          'relational_timeline_construction',
          'emotional_vocabulary_extraction',
          'agent_context_assembly',
          'context_optimization',
          'quality_validation',
        ],
        endpoints: {
          trpc: '/api/trpc',
          health: '/health',
          capabilities: '/api/capabilities',
        },
        mcpSupport: {
          protocol: 'foundation',
          resources: [
            'mood_context',
            'timeline',
            'vocabulary',
            'agent_context',
          ],
          tools: ['generate_context', 'build_timeline', 'extract_vocabulary'],
        },
      })
    })

    this.app.get('/', (req, res) => {
      res.json({
        message: 'MCP Foundation Server',
        version: '0.1.0',
        description:
          'Emotional intelligence foundation layer for Phase 3 agent integration',
        endpoints: {
          api: '/api/trpc',
          health: '/health',
          capabilities: '/api/capabilities',
        },
        documentation:
          'https://github.com/nathanvale/mnemosyne/tree/main/packages/mcp',
      })
    })

    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /api/capabilities',
          'POST /api/trpc/*',
        ],
      })
    })

    this.app.use(
      (
        error: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        // Error handler must include all 4 parameters for Express to recognize it
        void next
        logger.error('Express server error', {
          error: error.message,
          stack: error.stack,
          method: req.method,
          path: req.path,
        })

        res.status(500).json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred while processing your request',
          timestamp: new Date().toISOString(),
        })
      },
    )
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        logger.info('MCP Express server started', {
          port: this.port,
          endpoints: {
            root: `http://localhost:${this.port}`,
            api: `http://localhost:${this.port}/api/trpc`,
            health: `http://localhost:${this.port}/health`,
            capabilities: `http://localhost:${this.port}/api/capabilities`,
          },
        })
        resolve()
      })
    })
  }

  /**
   * Get the express app instance
   */
  getApp(): express.Application {
    return this.app
  }
}

/**
 * Factory function to create MCP server
 */
export function createMcpServer(port?: number): McpExpressServer {
  return new McpExpressServer(port)
}

/**
 * Default export for convenience
 */
export default McpExpressServer
