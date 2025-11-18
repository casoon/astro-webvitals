/**
 * @casoon/astro-webvitals
 *
 * A comprehensive Web Vitals monitoring component for Astro
 * with advanced features like batch reporting, sampling, and accessibility
 *
 * @packageDocumentation
 */

export { default as WebVitals } from './WebVitals.astro';

/**
 * Web Vitals metric interface
 */
export interface WebVitalsMetric {
  /** Metric name (LCP, FID, CLS, etc.) */
  name: string;
  /** Metric value (milliseconds for timing metrics, unitless for CLS) */
  value: number;
  /** Page URL where metric was measured */
  url: string;
  /** Timestamp when metric was captured */
  timestamp: number;
  /** User agent string */
  userAgent: string;
  /** Optional target element for interaction metrics */
  target?: string;
}

/**
 * Extended metrics payload
 */
export interface ExtendedMetrics {
  /** Memory usage information (Chrome only) */
  memory?: {
    used: number;
    total: number;
  };
  /** Network connection information */
  connection?: {
    type: string;
    rtt?: number;
    downlink?: number;
  };
}

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  /** Largest Contentful Paint threshold (ms) */
  LCP?: number;
  /** First Input Delay threshold (ms) */
  FID?: number;
  /** Cumulative Layout Shift threshold */
  CLS?: number;
  /** First Contentful Paint threshold (ms) */
  FCP?: number;
  /** Time to First Byte threshold (ms) */
  TTFB?: number;
  /** Interaction to Next Paint threshold (ms) */
  INP?: number;
}

/**
 * Props for WebVitals component
 */
export interface WebVitalsProps {
  /** Enable debug overlay showing metrics in real-time */
  debug?: boolean;
  /** Optional endpoint to send metrics to (POST request) */
  endpoint?: string;
  /** Position of debug overlay */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Track metrics even in development mode */
  trackInDev?: boolean;
  /** Sampling rate (0-1) - percentage of users to track */
  sampleRate?: number;
  /** Enable batch reporting to reduce requests */
  batchReporting?: boolean;
  /** Interval for batch reporting (ms) */
  batchInterval?: number;
  /** Maximum batch size before forcing send */
  maxBatchSize?: number;
  /** Enable WCAG accessibility checking */
  checkAccessibility?: boolean;
  /** Enable extended metrics (Long Tasks, Memory, Network) */
  extendedMetrics?: boolean;
  /** Enable smart detection (rage clicks, dead clicks) */
  smartDetection?: boolean;
  /** Performance budget thresholds */
  performanceBudget?: PerformanceBudget;
  /** Callback when budget is exceeded */
  onBudgetExceeded?: (metric: string, value: number, budget: number) => void;
  /** Custom headers for endpoint requests */
  headers?: Record<string, string>;
  /** Session ID for tracking */
  sessionId?: string;
  /** User ID for tracking */
  userId?: string;
}
