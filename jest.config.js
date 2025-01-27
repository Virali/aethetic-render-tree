/** @type {import('ts-jest').JestConfigWithTsJest} **/

module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  testEnvironment: "node",
  coverageReporters: ["text", "text-summary"],
  testPathIgnorePatterns: ["build"]
};