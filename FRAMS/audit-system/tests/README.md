# Audit System Tests

This directory contains all tests for the audit system components.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── property/       # Property-based tests using fast-check
├── integration/    # Integration tests for end-to-end workflows
└── fixtures/       # Test fixtures and mock data
```

## Test Types

### Unit Tests
Unit tests verify individual component functionality in isolation.

### Property-Based Tests
Property-based tests use fast-check to verify correctness properties across many randomly generated inputs. Each property test runs a minimum of 100 iterations.

### Integration Tests
Integration tests verify the complete audit workflow from screen scanning to report generation.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ScreenScanner.test.ts
```

## Test Guidelines

1. **Focus on core logic**: Test the essential functionality, not implementation details
2. **Use descriptive names**: Test names should clearly describe what is being tested
3. **Minimal test solutions**: Avoid over-testing edge cases
4. **Property test tags**: Each property-based test must include a comment with format:
   ```typescript
   // Feature: android-ui-ux-audit, Property N: [Property Name]
   ```

## Test Coverage Goals

- Unit test coverage: 80%+ for core logic
- Property test coverage: All 21 correctness properties
- Integration test coverage: All major workflows
