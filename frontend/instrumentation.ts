// This file is used to configure the Sentry SDK for server-side and edge runtime
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    await import('./instrumentation-server');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    await import('./instrumentation-edge');
  }

  // Client-side initialization will be handled automatically by Sentry
  // via the client-side bundle and instrumentation-client.ts
}

// Capture errors from nested React Server Components and API routes
export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context
) => {
  // Use Sentry's specialized method for request errors
  Sentry.captureRequestError(err, request, context);
};
