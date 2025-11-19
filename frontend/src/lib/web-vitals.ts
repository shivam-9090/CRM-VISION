/**
 * Web Vitals monitoring for performance tracking
 * Tracks Core Web Vitals: LCP, INP, CLS, TTFB, FCP
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Performance thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
};

type Rating = 'good' | 'needs-improvement' | 'poor';

function getRating(metric: Metric): Rating {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (metric.value <= threshold.good) return 'good';
  if (metric.value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: Metric) {
  const rating = getRating(metric);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating,
      navigationType: metric.navigationType,
    });
  }
  
  // Send to analytics in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      metric: metric.name,
      value: Math.round(metric.value),
      rating,
      navigationType: metric.navigationType,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    // Use sendBeacon for reliability (fires even if user leaves page)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      // Fallback to fetch
      fetch('/api/analytics/vitals', {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error);
    }
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this in _app.tsx or layout.tsx
 */
export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (err) {
    console.error('Failed to initialize Web Vitals:', err);
  }
}

/**
 * Get Web Vitals summary for display in dev tools
 */
export async function getWebVitalsSummary() {
  const vitals: Record<string, { value: number; rating: Rating }> = {};
  
  return new Promise((resolve) => {
    let count = 0;
    const total = 5; // Number of metrics we're tracking
    
    const onMetric = (metric: Metric) => {
      vitals[metric.name] = {
        value: Math.round(metric.value),
        rating: getRating(metric),
      };
      
      count++;
      if (count === total) {
        resolve(vitals);
      }
    };
    
    onCLS(onMetric);
    onINP(onMetric);
    onFCP(onMetric);
    onLCP(onMetric);
    onTTFB(onMetric);
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(vitals), 5000);
  });
}

/**
 * Performance budget check
 * Returns true if all metrics are within budget
 */
export function checkPerformanceBudget(vitals: Record<string, { value: number; rating: Rating }>) {
  const budgetViolations: string[] = [];
  
  Object.entries(vitals).forEach(([name, { rating }]) => {
    if (rating === 'poor') {
      budgetViolations.push(name);
    }
  });
  
  if (budgetViolations.length > 0) {
    console.warn('⚠️ Performance budget violations:', budgetViolations.join(', '));
    return false;
  }
  
  console.log('✅ All Web Vitals within budget');
  return true;
}
