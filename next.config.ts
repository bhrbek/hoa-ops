import type { NextConfig } from "next";
import { readFileSync } from "fs";

// Read version from VERSION file
let appVersion = "dev";
try {
  appVersion = readFileSync("./VERSION", "utf-8").trim();
} catch {
  // VERSION file not found, use default
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
};

export default nextConfig;
