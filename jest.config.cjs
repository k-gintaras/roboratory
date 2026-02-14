module.exports = {
  projects: [
    '<rootDir>/packages/db-core',
    '<rootDir>/packages/db-postgres',
    '<rootDir>/packages/db-sqlite',
    '<rootDir>/packages/fs-tools',
    '<rootDir>/apps/api-node',
    '<rootDir>/experiments/tagged-music',
    '<rootDir>/scripts-once',
    '<rootDir>/services-reuse'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};