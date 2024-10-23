import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/*.{test,spec}.?(c|m)[jt]s?(x)'],
    //setupFiles: './tests/setupTests.ts',
    // onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
    //   console.log(log);
    //   return true;
    // },
  },
});
