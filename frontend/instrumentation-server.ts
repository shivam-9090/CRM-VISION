// Server-side Sentry initialization
// This file configures the initialization of Sentry on the server side.

import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Optionally uncomment the lines below to enable Spotlight in development
  // spotlight: process.env.NODE_ENV === 'development',
});

// Capture server-side request errors
export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context
) => {
  Sentry.captureRequestError(err, request, context);
};
