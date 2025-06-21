# AST-Based Dependency Tracking for Cassette Manager

## Overview

The dependency tracking system automatically detects when test files or their dependencies have changed, invalidating cassettes to ensure tests always run against the latest code.

## Features

- **Automatic Dependency Discovery**: Uses AST parsing to find all imports and build a complete dependency graph
- **Transitive Dependency Tracking**: Tracks not just direct imports but the entire dependency tree
- **Smart Cassette Invalidation**: Automatically switches from replay to record mode when dependencies change
- **Performance Optimized**: Caches file content and modification times to minimize filesystem operations
- **Flexible Configuration**: Support for manual control, auto-invalidation, and custom file tracking

## Architecture

### Core Components

1. **DependencyTracker**: Low-level dependency graph builder
   - Parses TypeScript/JavaScript files to extract imports
   - Builds a bidirectional dependency graph
   - Tracks file modification times
   - Supports ES6 imports, CommonJS requires, and dynamic imports

2. **CassetteDependencyTracker**: Cassette-specific dependency manager
   - Associates cassettes with test files
   - Manages cassette-to-file mappings
   - Determines which cassettes need invalidation

3. **EnhancedBunCassetteManager**: Cassette manager with dependency tracking
   - Extends the basic cassette manager
   - Integrates dependency tracking
   - Supports three modes: record, replay, and auto
   - Automatically invalidates stale cassettes

## Usage

### Basic Auto-Invalidation

```typescript
import { EnhancedBunMockExecutor } from './enhanced-cassette-manager';

const executor = new EnhancedBunMockExecutor('my-cassette', {
  mode: 'auto',              // Automatically choose record/replay
  trackedFiles: [__filename], // Track current test file
  autoInvalidate: true       // Enable automatic invalidation
});

// Will record on first run, replay on subsequent runs
// unless dependencies change
const result = await executor.execute('ffmpeg -i input.mp4 output.mp4');
```

### Tracking Multiple Files

```typescript
const executor = new EnhancedBunMockExecutor('multi-cassette', {
  trackedFiles: [
    './test/feature1.test.ts',
    './test/feature2.test.ts',
    './src/video-processor.ts'
  ]
});

// Cassette invalidates if any tracked file or their dependencies change
```

### Manual Control

```typescript
const executor = new EnhancedBunMockExecutor('manual-cassette', {
  mode: 'replay',
  autoInvalidate: false  // Disable automatic invalidation
});

// Manually check and invalidate if needed
if (shouldInvalidate()) {
  executor.invalidate();
}
```

## How It Works

1. **File Parsing**: When a file is tracked, the system parses it to find all import statements
2. **Graph Building**: Creates a dependency graph with bidirectional links (dependencies and dependents)
3. **Change Detection**: On each run, checks if any file in the dependency graph has been modified
4. **Automatic Invalidation**: If changes are detected in auto mode, switches to record mode

## Supported Import Types

- ES6 imports: `import { foo } from './bar'`
- CommonJS: `require('./foo')`
- Dynamic imports: `import('./lazy-module')`
- Re-exports: `export { foo } from './bar'`

## Performance Considerations

- File parsing is done once and cached
- Modification times are checked efficiently using filesystem stats
- Dependency graphs are kept in memory during execution
- Only local files are tracked (node_modules excluded)

## Integration with Existing Tests

### Before (Basic Cassette Manager)
```typescript
const executor = new BunMockExecutor('test-cassette');
// Manually switch between record/replay modes
```

### After (Enhanced with Dependency Tracking)
```typescript
const executor = new EnhancedBunMockExecutor('test-cassette', {
  mode: 'auto',
  trackedFiles: [__filename]
});
// Automatically handles mode switching based on changes
```

## Advanced Features

### Dependency Statistics
```typescript
const stats = executor.getStats();
console.log(stats.dependencies);
// {
//   trackedFiles: 3,
//   totalDependencies: 15,
//   avgDependenciesPerFile: 5
// }
```

### Export Dependency Graph
```typescript
const tracker = new DependencyTracker();
tracker.trackFile('./src/index.ts', true);
const graph = tracker.exportGraph();
// Returns nodes and edges for visualization
```

### Find Affected Cassettes
```typescript
const tracker = new CassetteDependencyTracker();
const affected = tracker.getCassettesAffectedByFile('./src/helper.ts');
// Returns all cassettes that depend on this file
```

## Limitations

- Currently uses regex-based parsing (production version should use TypeScript Compiler API)
- Does not track runtime dependencies or dynamic requires with variables
- External modules (node_modules) are not tracked
- File deletions are detected but not file additions in parent directories

## Future Enhancements

1. **TypeScript Compiler API Integration**: Replace regex parsing with proper AST parsing
2. **Watch Mode**: Automatically invalidate cassettes when files change during development
3. **Dependency Visualization**: Generate visual dependency graphs
4. **Selective Invalidation**: Only invalidate specific interactions affected by changes
5. **Git Integration**: Invalidate based on git diff between test runs