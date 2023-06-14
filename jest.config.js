module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./src/test-support/jest-setup.ts'],
  moduleNameMapper: {
    '^axios$': '<rootDir>src/test-support/__mocks__/axios.ts',
  },
}
