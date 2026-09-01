export type LogLevel = 'error' | 'info' | 'warn';

export type PingLogger = {
  banner: (message: string) => void;
  log: (level: LogLevel, message: string) => void;
};

export const logger: PingLogger = {
  banner: (message) => process.stdout.write(`${message}\n`),
  log: (level, message) => {
    const output = level === 'error' ? process.stderr : process.stdout;
    output.write(
      `${new Date().toISOString()} ${level.toUpperCase()} ${message}\n`,
    );
  },
};
