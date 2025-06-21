import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

// Custom loader for running ES modules with runtime testing
export async function resolve(specifier, context, defaultResolve) {
  // Handle relative imports from media-sdk
  if (specifier.startsWith('@jamesaphoenix/media-sdk')) {
    const sdkPath = resolvePath('../../packages/media-sdk/src/index.ts');
    return {
      url: pathToFileURL(sdkPath).href,
      format: 'module'
    };
  }
  
  return defaultResolve(specifier, context);
}

export async function load(url, context, defaultLoad) {
  // Transform TypeScript files if needed
  if (url.endsWith('.ts')) {
    const source = readFileSync(new URL(url), 'utf8');
    // Simple transformation - in a real implementation, use esbuild or similar
    const transformed = source
      .replace(/\.ts'/g, ".js'")
      .replace(/\.ts"/g, '.js"');
    
    return {
      format: 'module',
      source: transformed
    };
  }
  
  return defaultLoad(url, context);
}