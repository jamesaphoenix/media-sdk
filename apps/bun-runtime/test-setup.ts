/**
 * Test setup for Bun runtime tests
 */

import { mkdirSync, existsSync } from 'fs';

// Ensure required directories exist
const dirs = ['./cassettes', './output', './test-results'];
dirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Set environment variables for CI
if (process.env.CI === 'true') {
  process.env.CASSETTE_MODE = 'replay';
  console.log('🎭 Running in CI mode - cassettes will be replayed');
}

// Configure vision cost control
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️ No GEMINI_API_KEY found - vision tests will be mocked');
}