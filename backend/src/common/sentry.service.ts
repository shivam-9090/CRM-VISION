import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService implements OnModuleInit {
  private isEnabled = false;

  onModuleInit() {
    // Only initialize Sentry if DSN is provided
    if (process.env.SENTRY_DSN) {
      this.isEnabled = true;
      const environment = process.env.NODE_ENV || 'development';
      const isProd = environment === 'production';

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
          // Enable HTTP calls tracing
          Sentry.httpIntegration(),
          // Enable Express.js middleware tracing
          Sentry.expressIntegration(),
          // Enable profiling
          nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: isProd ? 0.1 : 1.0, // 10% in prod, 100% in dev
        // Profiling
        profilesSampleRate: isProd ? 0.1 : 1.0, // 10% in prod, 100% in dev
        environment,
        // Release tracking
        release: process.env.SENTRY_RELEASE || 'crm-backend@1.0.0',
        // Server name
        serverName: process.env.HOSTNAME || 'crm-server',
        // Max breadcrumbs
        maxBreadcrumbs: 50,
        // Attach stacktrace to messages
        attachStacktrace: true,
        // Before send hook for filtering
        beforeSend(event) {
          // Don't send events in development unless explicitly enabled
          if (environment === 'development' && !process.env.SENTRY_ENABLE_DEV) {
            return null;
          }
          return event;
        },
      });

      console.log(`🔍 Sentry monitoring initialized (${environment})`);
    } else {
      console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    }
  }

  /**
   * Capture an exception with optional context
   */
  captureException(error: any, context?: string, extras?: Record<string, any>) {
    if (!this.isEnabled) return;

    Sentry.withScope((scope) => {
      if (context) {
        scope.setTag('context', context);
      }
      if (extras) {
        scope.setContext('additional_info', extras);
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Capture a message with severity level
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    extras?: Record<string, any>,
  ) {
    if (!this.isEnabled) return;

    Sentry.withScope((scope) => {
      if (extras) {
        scope.setContext('message_context', extras);
      }
      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    if (!this.isEnabled) return;
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set current user context
   */
  setUser(user: {
    id: string;
    email?: string;
    username?: string;
    companyId?: string;
  }) {
    if (!this.isEnabled) return;
    Sentry.setUser(user);
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser() {
    if (!this.isEnabled) return;
    Sentry.setUser(null);
  }

  /**
   * Set custom tag
   */
  setTag(key: string, value: string) {
    if (!this.isEnabled) return;
    Sentry.setTag(key, value);
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, any>) {
    if (!this.isEnabled) return;
    Sentry.setContext(key, context);
  }

  /**
   * Capture database query performance
   */
  captureQuery(query: string, duration: number, success: boolean) {
    if (!this.isEnabled) return;

    this.addBreadcrumb({
      category: 'database',
      message: query,
      level: success ? 'info' : 'error',
      data: {
        duration_ms: duration,
        success,
      },
    });

    // Alert on slow queries (>1 second)
    if (duration > 1000) {
      this.captureMessage(
        `Slow database query detected: ${query.substring(0, 100)}...`,
        'warning',
        { duration_ms: duration, query },
      );
    }
  }

  /**
   * Capture HTTP request performance
   */
  captureHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ) {
    if (!this.isEnabled) return;

    this.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level:
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info',
      data: {
        method,
        url,
        status_code: statusCode,
        duration_ms: duration,
      },
    });

    // Alert on slow requests (>3 seconds)
    if (duration > 3000) {
      this.captureMessage(`Slow HTTP request: ${method} ${url}`, 'warning', {
        duration_ms: duration,
        status_code: statusCode,
      });
    }
  }

  /**
   * Check if Sentry is enabled
   */
  isReady(): boolean {
    return this.isEnabled;
  }
}
