# Contributing to Media SDK

Thank you for your interest in contributing to Media SDK! We welcome contributions from everyone.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- FFmpeg installed and in PATH
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/jamesaphoenix/media-sdk.git
cd media-sdk

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Run runtime tests
pnpm runtime:test
```

## Project Structure

```
media-sdk/
├── packages/
│   └── media-sdk/           # Core SDK package
├── apps/
│   ├── bun-runtime/         # Runtime testing environment
│   ├── docs/                # Documentation site
│   └── playground/          # Interactive demos
├── examples/                # Usage examples
└── docs/                    # Static documentation
```

## Contributing Guidelines

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request

### Branch Naming

Use descriptive branch names:
- `feat/video-transitions` - New features
- `fix/audio-sync-issue` - Bug fixes
- `docs/api-reference` - Documentation updates
- `test/edge-cases` - Test improvements

### Commit Messages

Follow conventional commits:
```bash
feat: add video transition effects
fix: resolve audio synchronization bug
docs: update API reference for Timeline
test: add edge cases for video splicing
```

### Code Style

- Use TypeScript with strict mode
- Follow existing code patterns
- Use functional programming principles
- Keep methods pure when possible
- Add JSDoc comments for public APIs

Example:
```typescript
/**
 * Adds a video overlay with picture-in-picture positioning.
 * @param timeline - The base timeline
 * @param source - Path to overlay video
 * @param options - PiP configuration options
 * @returns New timeline with overlay applied
 */
export function addPictureInPicture(
  timeline: Timeline,
  source: string,
  options: PiPOptions = {}
): Timeline {
  // Implementation
}
```

### Testing

#### Unit Tests
```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

#### Runtime Tests
```bash
# Run all runtime tests
pnpm runtime:test

# Run specific test suites
pnpm runtime:test:core-primitives
pnpm runtime:test:new-features
pnpm runtime:test:edge-cases
```

#### Test Requirements

- All new features must include tests
- Aim for >90% test coverage
- Include both unit and runtime tests
- Test edge cases and error conditions
- Use real media files for runtime tests

### Documentation

#### API Documentation
- Add JSDoc comments for all public APIs
- Include usage examples
- Document parameter types and return values
- Explain complex concepts

#### Examples
- Create practical, real-world examples
- Include complete, runnable code
- Add comments explaining key concepts
- Test examples to ensure they work

#### Documentation Site
```bash
# Run documentation site locally
pnpm docs:dev

# Build documentation
pnpm docs:build
```

## Bug Reports

When reporting bugs, please include:

1. **Environment**: Node.js version, OS, FFmpeg version
2. **Reproduction**: Minimal code to reproduce the issue
3. **Expected vs Actual**: What you expected vs what happened
4. **Error Messages**: Full error output if applicable

Use this template:

```markdown
## Bug Description
Brief description of the bug.

## Environment
- Node.js: v18.17.0
- OS: macOS 13.4
- FFmpeg: 6.0
- Media SDK: 1.0.0

## Reproduction
```typescript
const timeline = new Timeline()
  .addVideo('input.mp4')
  // ... minimal reproduction code
```

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Error Output
```
Full error message here
```
```

## Feature Requests

For feature requests, please:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your idea for how to solve it
3. **Alternatives**: Other approaches you've considered
4. **Examples**: Code examples of how it might work

## Performance Considerations

When contributing:

- Optimize FFmpeg command generation
- Minimize memory usage for large files
- Consider parallel processing opportunities
- Profile performance-critical paths
- Add benchmarks for new features

## Architecture Principles

Follow these core principles:

### Functional Composition
```typescript
// Good: Immutable, chainable
const result = timeline
  .addVideo('input.mp4')
  .pipe(t => addEffect(t))
  .getCommand('output.mp4');

// Bad: Mutable, imperative
timeline.video = 'input.mp4';
timeline.effects.push(effect);
```

### Type Safety
```typescript
// Good: Strongly typed
interface VideoOptions {
  startTime?: number;
  duration?: number;
}

// Bad: Any types
function addVideo(source: any, options: any): any
```

### Error Handling
```typescript
// Good: Descriptive errors
throw new Error('Invalid duration: must be positive number, got -5');

// Bad: Generic errors
throw new Error('Invalid input');
```

### Platform Awareness
```typescript
// Good: Built-in platform knowledge
timeline.setAspectRatio('9:16'); // Auto-optimizes for mobile

// Bad: Manual configuration required
timeline.setWidth(1080).setHeight(1920).addMetadata({platform: 'tiktok'});
```

## Release Process

### Version Management

We use semantic versioning (semver):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Changeset Process

1. Add changeset for your changes:
```bash
pnpm changeset
```

2. Select change type (major/minor/patch)
3. Write changelog entry
4. Commit changeset file

### Publishing

Releases are automated via GitHub Actions when changesets are merged.

## Community

### Getting Help

- GitHub Issues for bugs and features
- GitHub Discussions for questions
- Discord (coming soon) for real-time chat

### Recognition

Contributors are recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- GitHub releases for major features

## Advanced Contributing

### Self-Healing Architecture

When contributing to the self-healing system:

```typescript
// Add validation with suggestions
if (validation.qualityScore < 0.7) {
  return {
    isValid: false,
    suggestions: [
      'Increase font size for better readability',
      'Add stroke to text for contrast',
      'Consider different color scheme'
    ]
  };
}
```

### Vision Integration

For vision-related features:

```typescript
// Use vision analysis for quality checks
const analysis = await analyzeWithVision(outputPath);
if (analysis.textDetection?.confidence < 0.8) {
  suggestTextImprovements(analysis);
}
```

### AST-Based Testing

When adding AST analysis:

```typescript
// Track dependencies for intelligent invalidation
tracker.registerCassette('test-name', [
  'src/timeline.ts',
  'src/effects.ts',
  'assets/video.mp4'
]);
```

## Questions?

Feel free to open a GitHub Discussion or issue if you have questions about contributing!

Thank you for helping make Media SDK better! 🚀