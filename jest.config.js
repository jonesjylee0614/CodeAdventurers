import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';

const tsconfig = JSON.parse(readFileSync(new URL('./tsconfig.json', import.meta.url)));

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: '<rootDir>/' })
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: [
    '<rootDir>/**/?(*.)+(spec|test).[tj]s?(x)'
  ],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      useESM: true
    }
  }
};
