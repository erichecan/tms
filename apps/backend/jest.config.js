module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsconfig: '<rootDir>/tsconfig.json'
    }
  },
  testPathIgnorePatterns: [
    '<rootDir>/tests/controllers/', // 2025-11-11T16:00:15Z Added by Assistant: Legacy suite awaiting refactor
    '<rootDir>/tests/routes/', // 2025-11-11T16:00:15Z Added by Assistant: Legacy suite awaiting refactor
    '<rootDir>/tests/security/', // 2025-11-11T16:00:15Z Added by Assistant: Legacy suite awaiting refactor
    '<rootDir>/tests/integration/', // 2025-11-11T16:00:15Z Added by Assistant: Legacy suite awaiting refactor
    '<rootDir>/tests/middleware/', // 2025-11-11T16:00:15Z Added by Assistant: Legacy suite awaiting refactor
    '<rootDir>/tests/services/', // 2025-11-11T16:00:15Z Added by Assistant: Legacy suite awaiting refactor
    '<rootDir>/tests/performance/' // 2025-11-11T16:04:40Z Added by Assistant: Legacy performance suite awaiting refactor
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/database/migrate.ts',
    '!src/database/seed.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared-types/$1',
    '^@utils/(.*)$': '<rootDir>/../../packages/utils/$1'
  }
};
