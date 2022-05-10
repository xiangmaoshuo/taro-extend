module.exports = {
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  collectCoverageFrom: [
    'packages/**/src/**/*.{ts,tsx}',
    '!packages/**/src/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  moduleNameMapper: {
    '@mondeo/([^\\/]*)$': '<rootDir>/packages/$1/src',
    '@mondeo/([^\\/]*)/lib/([^\\/]*)$': '<rootDir>/packages/$1/src/$2',
  },
};
