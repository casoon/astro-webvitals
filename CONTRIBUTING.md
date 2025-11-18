# Contributing to @casoon/astro-webvitals

Thank you for your interest in contributing to @casoon/astro-webvitals! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 20.18.0 or higher
- pnpm 9.15.0 or higher
- Git

### Setup with Volta (Recommended)

This project uses Volta for Node.js version management:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Clone the repository
git clone https://github.com/casoon/astro-webvitals.git
cd astro-webvitals

# Volta will automatically use the correct Node and pnpm versions
pnpm install
```

### Manual Setup

```bash
# Clone the repository
git clone https://github.com/casoon/astro-webvitals.git
cd astro-webvitals

# Install pnpm if needed
npm install -g pnpm@9.15.0

# Install dependencies
pnpm install
```

## Development Workflow

### 1. Create a Branch

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/what-you-are-documenting
```

### 2. Make Your Changes

Follow these guidelines:
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Type checking
pnpm run type-check

# Format code
pnpm run format

# Lint (when configured)
pnpm run lint
```

### 4. Manual Testing

Test the component in an Astro project:

```bash
# Link the package locally
pnpm link

# In your test Astro project
pnpm link @casoon/astro-webvitals
```

### 5. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add sampling rate control"

# Bug fixes
git commit -m "fix: correct CLS calculation"

# Documentation
git commit -m "docs: update API reference"

# Performance improvements
git commit -m "perf: optimize batch reporting"

# Refactoring
git commit -m "refactor: simplify metric collection"
```

### 6. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub with:
- Clear title following commit convention
- Description of changes
- Link to related issues
- Screenshots if applicable

## Project Structure

```
astro-webvitals/
├── src/
│   ├── WebVitals.astro          # Basic component
│   ├── WebVitalsEnhanced.astro  # Enhanced component
│   └── index.ts                 # TypeScript exports
├── docs/                        # Documentation
├── examples/                    # Example implementations
├── tests/                       # Test files
└── package.json
```

## Adding Features

### 1. Planning

Before implementing:
- Check existing issues/PRs
- Discuss major changes in an issue first
- Consider backward compatibility

### 2. Implementation Guidelines

#### For New Metrics
```typescript
// Add to measurement function
function measureNewMetric() {
  try {
    const observer = new PerformanceObserver((list) => {
      // Implementation
    });
    observer.observe({ type: 'new-metric', buffered: true });
  } catch (e) {
    if (debug) console.warn('[@casoon/astro-webvitals] NewMetric not supported');
  }
}
```

#### For New Props
```typescript
// Add to Props interface
export interface Props {
  /**
   * Description of the new prop
   * @default defaultValue
   */
  newProp?: PropType;
}

// Add to destructuring with default
const { newProp = defaultValue } = Astro.props;
```

### 3. Documentation

Update relevant documentation:
- Props table in README.md
- API reference in docs/
- Examples if needed
- TypeScript types

### 4. Testing Checklist

- [ ] Component renders without errors
- [ ] New features work as expected
- [ ] No console errors in debug mode
- [ ] Metrics are sent correctly
- [ ] TypeScript types are correct
- [ ] Documentation is updated
- [ ] Examples work

## Testing

### Manual Testing

1. **Basic Functionality**
   ```astro
   <WebVitals debug={true} />
   ```
   - Verify overlay appears
   - Check metrics update
   - Test keyboard navigation

2. **Analytics Integration**
   ```astro
   <WebVitals endpoint="/api/test" />
   ```
   - Monitor network tab
   - Verify payload format
   - Check batch reporting

3. **Browser Testing**
   Test in multiple browsers:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

### Automated Testing (Coming Soon)

```bash
# Run tests
pnpm test

# Run specific test
pnpm test -- measureLCP
```

## Code Style

### JavaScript/TypeScript

- Use meaningful variable names
- Add JSDoc comments for functions
- Prefer const over let
- Use template literals for strings
- Handle errors gracefully

### Astro Components

- Use TypeScript for props interface
- Include comprehensive JSDoc comments
- Follow Astro best practices
- Keep inline scripts optimized

### Example Code Style

```typescript
/**
 * Measures the Largest Contentful Paint metric
 * @param {boolean} debug - Enable debug logging
 * @returns {void}
 */
function measureLCP(debug: boolean): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        const value = Math.round(lastEntry.startTime);
        recordMetric('LCP', value);
      }
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    if (debug) {
      console.warn('[@casoon/astro-webvitals] LCP not supported:', error);
    }
  }
}
```

## Accessibility

All contributions must maintain or improve accessibility:

- [ ] ARIA attributes present
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Sufficient color contrast
- [ ] Focus indicators visible

## Performance

Keep the component lightweight:

- No external dependencies
- Minimize bundle size
- Optimize runtime performance
- Use native APIs when possible
- Lazy load optional features

## Documentation

### What to Document

- All public APIs
- Configuration options
- Usage examples
- Migration guides
- Troubleshooting tips

### Documentation Style

- Use clear, simple language
- Include code examples
- Explain the "why" not just "how"
- Keep it up to date

## Release Process

Maintainers follow this process:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release PR
4. Merge after review
5. Tag release
6. Publish to npm

## Getting Help

- 📖 [Documentation](./docs/)
- 💬 [GitHub Discussions](https://github.com/casoon/astro-webvitals/discussions)
- 🐛 [Issue Tracker](https://github.com/casoon/astro-webvitals/issues)
- 📧 Contact maintainers

## Recognition

Contributors are recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

Thank you for contributing! 🎉