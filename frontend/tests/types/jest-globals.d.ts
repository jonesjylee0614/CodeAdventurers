declare module '@jest/globals' {
  export const jest: typeof globalThis.jest;
  export const expect: typeof globalThis.expect;
  export const describe: typeof globalThis.describe;
  export const it: typeof globalThis.it;
  export const test: typeof globalThis.test;
  export const beforeEach: typeof globalThis.beforeEach;
  export const afterEach: typeof globalThis.afterEach;
  export const beforeAll: typeof globalThis.beforeAll;
  export const afterAll: typeof globalThis.afterAll;
}
