'use client'

import React, { useState, useEffect } from 'react'

import {
  BrowserLogger,
  createLogger,
  createSentryLogger,
} from '@/lib/browser-logger'

/**
 * Interactive demo component for BrowserLogger
 * Demonstrates all logger features with visual feedback
 */
export function LoggerDemo() {
  const [logs, setLogs] = useState<Array<string>>([])
  const [isRemoteLogging, setIsRemoteLogging] = useState(false)
  const [currentLogLevel, setCurrentLogLevel] = useState<string>('trace')
  const [logger, setLogger] = useState<BrowserLogger>(() =>
    createLogger({
      level: 'trace',
      enableConsole: true,
      enableColors: true,
      devClickableTraces: true,
      globalContext: { demo: true, timestamp: Date.now() },
    }),
  )

  // Capture console output for display
  useEffect(() => {
    const originalConsole = { ...console }
    const capturedLogs: Array<string> = []

    // Override console methods to capture output
    ;(['trace', 'debug', 'info', 'warn', 'error'] as const).forEach((level) => {
      console[level] = (...args: Array<unknown>) => {
        const logText = args
          .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
          .join(' ')
        const newLog = `[${level.toUpperCase()}] ${logText}`
        capturedLogs.push(newLog)
        setLogs((prevLogs) => [...prevLogs, newLog])
        originalConsole[level](...args)
      }
    })

    return () => {
      Object.assign(console, originalConsole)
    }
  }, [])

  const createRemoteLogger = () => {
    return createLogger({
      level: 'trace',
      enableConsole: true,
      enableColors: true,
      remoteEndpoint: 'https://jsonplaceholder.typicode.com/posts', // Mock endpoint
      batchSize: 3,
      flushInterval: 5000,
      maxRetries: 2,
      sensitiveFields: ['password', 'token'],
      onRemoteSuccess: (payload) => {
        setLogs((prev) => [
          ...prev,
          `✅ Remote: Uploaded ${payload.length} logs successfully`,
        ])
      },
      onRemoteError: (error) => {
        setLogs((prev) => [
          ...prev,
          `❌ Remote: Upload failed - ${error.message}`,
        ])
      },
    })
  }

  const toggleRemoteLogging = () => {
    if (isRemoteLogging) {
      const newLogger = createLogger({
        level: 'trace',
        enableConsole: true,
        enableColors: true,
      })
      setLogger(newLogger)
      setCurrentLogLevel('trace')
      setIsRemoteLogging(false)
    } else {
      const newLogger = createRemoteLogger()
      setLogger(newLogger)
      setCurrentLogLevel('trace')
      setIsRemoteLogging(true)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const demoBasicLogging = () => {
    logger.trace('🔍 Trace: Detailed debugging information')
    logger.debug('🐛 Debug: Development debugging info')
    logger.info('ℹ️ Info: General information')
    logger.warn('⚠️ Warning: Something needs attention')
    logger.error('❌ Error: Something went wrong')
  }

  const demoContextualLogging = () => {
    const userLogger = logger.withTag('UserService').withContext({
      userId: 'user_123',
      sessionId: 'session_abc',
    })

    userLogger.info('User logged in successfully')
    userLogger.warn('Password will expire soon', { daysRemaining: 3 })

    const apiLogger = logger.withTag('APIClient')
    apiLogger.debug('Making API request', {
      endpoint: '/api/users',
      method: 'GET',
    })
  }

  const demoSensitiveDataRedaction = () => {
    logger.info('Login attempt', {
      username: 'john_doe',
      password: 'super_secret_123', // Will be redacted if remote logging enabled
      token: 'jwt_token_here', // Will be redacted if remote logging enabled
      email: 'john@example.com',
    })
  }

  const demoPerformanceMonitoring = () => {
    logger.mark('operation-start')

    // Simulate some work
    setTimeout(() => {
      logger.mark('operation-middle')

      setTimeout(() => {
        logger.measure('total-operation', 'operation-start')
        logger.measure('second-half', 'operation-middle')
      }, 150)
    }, 100)
  }

  const demoConsoleGrouping = () => {
    logger.group('🎯 User Registration Flow')
    logger.info('Validating user input')
    logger.debug('Email format check passed')
    logger.debug('Password strength check passed')

    logger.groupCollapsed('🔒 Security Checks')
    logger.trace('Checking for existing account')
    logger.trace('Validating against blacklist')
    logger.groupEnd()

    logger.info('Creating user account')
    logger.info('Sending welcome email')
    logger.groupEnd()
  }

  const demoDevOnlyTracing = () => {
    logger.traceDev('🔧 Development trace with clickable source navigation')
    logger.info('This will show in production')
  }

  const demoErrorWithSentry = () => {
    const sentryLogger = createSentryLogger({
      level: 'error',
      enableConsole: true,
      enableInProduction: true,
    })

    const error = new Error('Simulated application error')
    sentryLogger.error('Application error occurred', error, {
      component: 'LoggerDemo',
      action: 'demoErrorWithSentry',
      userAgent: navigator.userAgent,
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🚀 BrowserLogger Interactive Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Explore all the features of the production-ready browser logger. Open
          your browser&apos;s developer console to see the formatted output with
          colors and clickable traces.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={toggleRemoteLogging}
            className={`px-4 py-2 rounded-md font-medium ${
              isRemoteLogging
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isRemoteLogging ? '🌐 Remote Logging ON' : '📱 Console Only'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600"
          >
            Clear Logs
          </button>
        </div>

        {/* Demo Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={demoBasicLogging}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-left"
          >
            <h3 className="font-semibold text-blue-900">Basic Logging</h3>
            <p className="text-sm text-blue-700">All log levels with colors</p>
          </button>

          <button
            onClick={demoContextualLogging}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 text-left"
          >
            <h3 className="font-semibold text-purple-900">Tags & Context</h3>
            <p className="text-sm text-purple-700">Structured logging</p>
          </button>

          <button
            onClick={demoSensitiveDataRedaction}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-left"
          >
            <h3 className="font-semibold text-red-900">Data Redaction</h3>
            <p className="text-sm text-red-700">Secure sensitive fields</p>
          </button>

          <button
            onClick={demoPerformanceMonitoring}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-left"
          >
            <h3 className="font-semibold text-green-900">Performance</h3>
            <p className="text-sm text-green-700">Marks & measurements</p>
          </button>

          <button
            onClick={demoConsoleGrouping}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 text-left"
          >
            <h3 className="font-semibold text-yellow-900">Grouping</h3>
            <p className="text-sm text-yellow-700">Organized output</p>
          </button>

          <button
            onClick={demoDevOnlyTracing}
            className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-left"
          >
            <h3 className="font-semibold text-indigo-900">Dev Tracing</h3>
            <p className="text-sm text-indigo-700">Clickable source links</p>
          </button>

          <button
            onClick={demoErrorWithSentry}
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 text-left"
          >
            <h3 className="font-semibold text-orange-900">
              Sentry Integration
            </h3>
            <p className="text-sm text-orange-700">Error tracking hooks</p>
          </button>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Current Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Log Level:</span> {currentLogLevel}
            </div>
            <div>
              <span className="font-medium">Remote Logging:</span>{' '}
              {isRemoteLogging ? 'Enabled' : 'Disabled'}
            </div>
            <div>
              <span className="font-medium">Console Colors:</span> Enabled
            </div>
            <div>
              <span className="font-medium">Clickable Traces:</span> Enabled
            </div>
          </div>
        </div>

        {/* Captured Logs Display */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-semibold">
              Captured Console Output
            </h3>
            <span className="text-gray-400">{logs.length} logs</span>
          </div>
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">
              Click a demo button to see log output here...
              <br />
              💡 Also check your browser&apos;s developer console for the full
              formatted experience!
            </div>
          ) : (
            <div className="space-y-1">
              {logs.slice(-20).map((log, index) => (
                <div key={index} className="text-xs leading-relaxed">
                  {log}
                </div>
              ))}
              {logs.length > 20 && (
                <div className="text-gray-500 italic">
                  ... showing last 20 of {logs.length} logs
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Open your browser&apos;s{' '}
              <strong>Developer Console (F12)</strong> to see formatted,
              colorful logs
            </li>
            <li>
              • Click on the file:line links in the console to jump directly to
              source code
            </li>
            <li>
              • Enable &quot;Remote Logging&quot; to see batching, retries, and
              sensitive data redaction
            </li>
            <li>
              • Performance demos will show timing measurements in the console
            </li>
            <li>
              • Console grouping creates collapsible log sections for better
              organization
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoggerDemo
