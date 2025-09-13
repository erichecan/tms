# 🤝 Contributing to TMS SaaS Platform

Thank you for your interest in contributing to the TMS SaaS Platform! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git
- PostgreSQL 15+
- Redis 7+

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/tms.git
   cd tms
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/erichecan/tms.git
   ```

## 🛠️ Development Setup

### Environment Setup

1. Copy the environment file:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your local configuration

3. Install dependencies:
   ```bash
   npm install
   ```

### Docker Development

1. Start all services:
   ```bash
   docker-compose up -d
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed the database:
   ```bash
   npm run db:seed
   ```

### Local Development

1. Start the backend:
   ```bash
   npm run dev:backend
   ```

2. Start the frontend:
   ```bash
   npm run dev:frontend
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Default login: admin@demo.tms-platform.com / password

## 🔄 Contributing Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/your-bugfix-name
```

### 2. Make Changes

- Follow the code style guidelines
- Write tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suites
npm run test --workspace=apps/backend
npm run test --workspace=apps/frontend

# Run linting
npm run lint
```

### 4. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new billing rule type"
git commit -m "fix: resolve authentication issue"
git commit -m "docs: update API documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## 🎨 Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React Components

- Use functional components with hooks
- Follow the established component structure
- Use TypeScript interfaces for props
- Implement proper error boundaries

### Database

- Use migrations for schema changes
- Follow naming conventions (snake_case for tables/columns)
- Add proper indexes for performance
- Document complex queries

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement proper error handling
- Add request/response validation

## 🧪 Testing

### Test Types

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows

### Writing Tests

```typescript
// Example unit test
describe('RuleEngineService', () => {
  it('should calculate pricing correctly', () => {
    // Test implementation
  });
});
```

### Test Coverage

- Maintain at least 80% test coverage
- Focus on critical business logic
- Test error scenarios and edge cases

## 📝 Pull Request Process

### Before Submitting

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No breaking changes (or documented)
- [ ] Security implications considered

### PR Description

Use the provided PR template and include:

- Clear description of changes
- Related issue numbers
- Screenshots (for UI changes)
- Testing instructions
- Deployment notes

### Review Process

1. Automated checks must pass
2. Code review by maintainers
3. Security review for sensitive changes
4. Performance testing for critical changes

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template and include:

- Clear reproduction steps
- Expected vs actual behavior
- Environment details
- Screenshots/logs

### Feature Requests

Use the feature request template and include:

- Clear problem statement
- Proposed solution
- Business value
- Acceptance criteria

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed

## 🏗️ Architecture Guidelines

### Multi-Tenancy

- Always consider tenant isolation
- Use tenant middleware for API routes
- Validate tenant context in business logic

### Rule Engine

- Keep rules simple and focused
- Use descriptive rule names
- Test rule combinations thoroughly
- Document rule behavior

### Security

- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow principle of least privilege

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex business logic
- Include examples in comments

### API Documentation

- Keep OpenAPI specs updated
- Include request/response examples
- Document error responses

### Architecture Documentation

- Update architecture docs for major changes
- Document design decisions
- Keep deployment guides current

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Notes

Include in release notes:

- New features
- Bug fixes
- Breaking changes
- Migration instructions
- Known issues

## 🤔 Questions?

- Check existing issues and discussions
- Join our community discussions
- Contact maintainers for guidance

## 🙏 Recognition

Contributors will be recognized in:

- Release notes
- README contributors section
- Annual contributor appreciation

Thank you for contributing to the TMS SaaS Platform! 🎉
