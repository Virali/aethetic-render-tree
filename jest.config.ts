import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  moduleDirectories: ["node_modules", "src"],
  testEnvironment: "node",
  coverageReporters: ["text", "text-summary"],
  moduleNameMapper: {
    "^src(.*)$": "<rootDir>/src$1",
  },
};

export default config;
