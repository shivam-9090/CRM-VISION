/**
 * Performance optimization utilities
 * Helper functions for improving frontend performance
 */

import { useEffect, useRef, useCallback } from "react";

/**
 * Debounce function for expensive operations
 * @param func Function to debounce
 * @param wait Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for high-frequency events
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 * @param callback Function to call when element is visible
 * @param options Intersection Observer options
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [callback, options]);

  return targetRef;
}

/**
 * Preload resource (script, style, image, font)
 * @param href Resource URL
 * @param as Resource type
 */
export function preloadResource(href: string, as: string): void {
  if (typeof document === "undefined") return;

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (existingLink) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;

  if (as === "font") {
    link.crossOrigin = "anonymous";
  }

  document.head.appendChild(link);
}

/**
 * Prefetch page for faster navigation
 * @param url Page URL to prefetch
 */
export function prefetchPage(url: string): void {
  if (typeof document === "undefined") return;

  const existingLink = document.querySelector(`link[href="${url}"]`);
  if (existingLink) return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Measure component render time
 * @param componentName Name of the component
 */
export function useMeasureRender(componentName: string) {
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    const startTime = performance.now();
    const renderCount = renderCountRef.current;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] ${componentName} render #${renderCount}: ${renderTime.toFixed(
            2
          )}ms`
        );
      }
    };
  });
}

/**
 * Hook to detect slow renders
 * @param componentName Name of the component
 * @param threshold Threshold in milliseconds (default: 16ms)
 */
export function useRenderPerformance(componentName: string, threshold = 16) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      if (renderTime > threshold) {
        console.warn(
          `[Performance] ${componentName} slow render: ${renderTime.toFixed(
            2
          )}ms (threshold: ${threshold}ms)`
        );
      }
    };
  });
}

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if (typeof window === "undefined") return null;

  const memory = (performance as any).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  };
}

/**
 * Mark performance timeline
 * @param name Mark name
 */
export function mark(name: string): void {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 * @param name Measure name
 * @param startMark Start mark name
 * @param endMark End mark name
 */
export function measure(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance !== "undefined" && performance.measure) {
    performance.measure(name, startMark, endMark);
    const measures = performance.getEntriesByName(name, "measure");
    return measures.length > 0 ? measures[0].duration : null;
  }
  return null;
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceData(): void {
  if (typeof performance !== "undefined") {
    if (performance.clearMarks) performance.clearMarks();
    if (performance.clearMeasures) performance.clearMeasures();
  }
}

/**
 * Check if device is low-end
 * Based on device memory and CPU cores
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const memory = (navigator as any).deviceMemory; // GB
  const cpuCores = navigator.hardwareConcurrency;

  // Consider low-end if:
  // - Less than 4GB RAM
  // - Less than 4 CPU cores
  return (memory && memory < 4) || (cpuCores && cpuCores < 4);
}

/**
 * Get network information
 */
export function getNetworkInfo() {
  if (typeof navigator === "undefined") return null;

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // ms
    saveData: connection.saveData, // boolean
  };
}

/**
 * Optimize based on network conditions
 */
export function shouldReduceQuality(): boolean {
  const network = getNetworkInfo();
  if (!network) return false;

  // Reduce quality on slow connections or save-data mode
  return (
    network.saveData ||
    network.effectiveType === "slow-2g" ||
    network.effectiveType === "2g" ||
    (network.downlink && network.downlink < 1)
  );
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(
  callback: () => void,
  timeout = 1000
): number {
  if (typeof window === "undefined") return 0;

  if ("requestIdleCallback" in window) {
    const id = (window as any).requestIdleCallback(callback, { timeout });
    return id as number;
  }

  // Fallback to setTimeout
  const timeoutId = setTimeout(callback, 1);
  return timeoutId as unknown as number;
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window === "undefined") return;

  if ("cancelIdleCallback" in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
