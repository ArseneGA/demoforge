import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "demoforge",
  project: "demoforge",
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  }
});

